import { API } from "../lib/api";

const SOCIAL_MEDIA_DOMAINS = [
  "youtube.com", "facebook.com", "instagram.com", 
  "twitter.com", "x.com", "tiktok.com", "reddit.com"
];

let activeTabId: number | null = null;
let activeDomain: string | null = null;
let trackingStartTime: number | null = null;

function extractDomain(url: string) {
  try {
    if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("file://")) return null;
    let hostname = new URL(url).hostname;
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);
    
    for (const d of SOCIAL_MEDIA_DOMAINS) {
      if (hostname === d || hostname.endsWith("." + d)) {
        return d;
      }
    }
    
    return hostname;
  } catch {
    return null;
  }
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

async function flushActiveTime() {
  if (!activeDomain || !trackingStartTime) return;
  const elapsed = Date.now() - trackingStartTime;
  if (elapsed <= 0) return;

  const today = getTodayKey();
  const currentHour = new Date().getHours().toString();
  
  const storageKey = `ls_usage_${today}`;
  const hourlyKey = `ls_hourly_${today}`;
  
  const result = await chrome.storage.local.get([storageKey, hourlyKey]);
  const usage = result[storageKey] || {};
  const hourly = result[hourlyKey] || {};

  usage[activeDomain] = (usage[activeDomain] || 0) + elapsed;
  hourly[currentHour] = (hourly[currentHour] || 0) + elapsed;
  
  await chrome.storage.local.set({ 
    [storageKey]: usage,
    [hourlyKey]: hourly 
  });
  
  trackingStartTime = Date.now();
}

async function startTracking(domain: string) {
  if (activeDomain === domain) return;
  
  const previousDomain = activeDomain;
  await flushActiveTime();
  activeDomain = domain;
  trackingStartTime = Date.now();

  // Automatically open the extension popup when switching to a social media site
  if (previousDomain !== domain && SOCIAL_MEDIA_DOMAINS.some(d => domain === d || domain.endsWith("." + d))) {
    try {
      // Check if there's an active browser window first
      const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
      const focusedWindow = windows.find(w => w.focused);
      // @ts-ignore - openPopup is available in Manifest V3 (Chrome 127+) without user gesture
      if (focusedWindow && chrome.action && chrome.action.openPopup) {
        await chrome.action.openPopup();
      }
    } catch {
      // Silently ignore — popup can't be opened programmatically in all contexts
    }
  }
}

async function stopTracking() {
  await flushActiveTime();
  activeDomain = null;
  trackingStartTime = null;
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const domain = tab.url ? extractDomain(tab.url) : null;
    if (domain) await startTracking(domain);
    else await stopTracking();
  } catch {
    await stopTracking();
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, _changeInfo, tab) => {
  if (tabId !== activeTabId || !tab.url) return;
  const domain = extractDomain(tab.url);
  if (domain) await startTracking(domain);
  else await stopTracking();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await stopTracking();
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const domain = extractDomain(tab.url);
        if (domain) await startTracking(domain);
        else await stopTracking();
      }
    } catch {
      await stopTracking();
    }
  }
});

async function syncData() {
  const token = await API.getToken();
  if (!token) return;

  try {
    const tasks = await API.fetchTasks();
    await chrome.storage.local.set({ ls_cached_tasks: tasks });

    const habits = await API.fetchHabits();
    await chrome.storage.local.set({ ls_cached_habits: habits });

    const finance = await API.fetchFinance();
    await chrome.storage.local.set({ ls_cached_finance: finance });

    const budgets = await API.fetchBudgets();
    await chrome.storage.local.set({ ls_cached_budgets: budgets });

    // Calculate remaining budget
    const regularFinance = finance.filter((e: any) => !e.is_special);
    const regularBudgets = budgets.filter((b: any) => !b.is_special);
    const budgetGoals = regularBudgets.filter((b: any) => b.type === "budget");
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const primaryBudget = budgetGoals.find((b: any) => b.period === "monthly" && b.start_date?.startsWith(currentMonthStr))
        || budgetGoals.find((b: any) => b.period === "monthly" && !b.start_date)
        || budgetGoals.find((b: any) => b.period === "monthly")
        || budgetGoals[0];

    if (primaryBudget) {
      const budgetStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const budgetEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const periodExpenses = regularFinance.filter((e: any) => {
          if (e.type !== "expense") return false;
          const expenseDate = new Date(e.date);
          if (expenseDate < budgetStart || expenseDate > budgetEnd) return false;
          if (primaryBudget.category && e.category !== primaryBudget.category) return false;
          return true;
      });
      const budgetSpent = periodExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const budgetTarget = primaryBudget.target_amount;
      const budgetRemaining = budgetTarget - budgetSpent;
      
      await chrome.storage.local.set({ ls_budget_left: budgetRemaining });
    } else {
      await chrome.storage.local.set({ ls_budget_left: null });
    }

  } catch (err) {
    console.warn("Sync failed", err);
  }

  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        chrome.tabs.sendMessage(tab.id, { type: "LS_DATA_UPDATED" }).catch(() => {});
      }
    }
  } catch {}
}

chrome.alarms.create("ls_sync_data", { periodInMinutes: 5 });
chrome.alarms.create("ls_flush_time", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "ls_sync_data") await syncData();
  else if (alarm.name === "ls_flush_time") await flushActiveTime();
  else if (alarm.name === "ls_detox_end") {
    // Detox timer expired — clear state and notify all tabs
    await chrome.storage.local.set({ ls_detox_active: false, ls_detox_end_time: null });
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          chrome.tabs.sendMessage(tab.id, { type: "LS_DETOX_ENDED" }).catch(() => {});
        }
      }
    } catch {}
  }
});

// ─── Detox: check if a domain is blocked ────────────────────────────────────
async function isDetoxBlocked(url: string): Promise<boolean> {
  try {
    const data = await chrome.storage.local.get(["ls_detox_active", "ls_detox_end_time", "ls_detox_custom_sites"]);
    if (!data.ls_detox_active) return false;
    if (data.ls_detox_end_time && Date.now() >= (data.ls_detox_end_time as number)) {
      // Timer expired but alarm hasn't fired yet — clean up
      await chrome.storage.local.set({ ls_detox_active: false, ls_detox_end_time: null });
      return false;
    }

    let hostname = new URL(url).hostname;
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);

    // Check built-in social media domains
    for (const d of SOCIAL_MEDIA_DOMAINS) {
      if (hostname === d || hostname.endsWith("." + d)) return true;
    }

    // Check custom blocked sites
    const customSites = (data.ls_detox_custom_sites as string[]) || [];
    for (const site of customSites) {
      const clean = site.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "").toLowerCase();
      if (clean && (hostname === clean || hostname.endsWith("." + clean))) return true;
    }
  } catch {}
  return false;
}

// Notify content script when a tab navigates to a blocked domain during detox
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    const blocked = await isDetoxBlocked(changeInfo.url);
    if (blocked) {
      chrome.tabs.sendMessage(tabId, { type: "LS_DETOX_CHECK" }).catch(() => {});
    }
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "LS_GET_USAGE") {
    const today = getTodayKey();
    chrome.storage.local.get([`ls_usage_${today}`, `ls_hourly_${today}`]).then((res) => {
      const rawUsage = res[`ls_usage_${today}`] || {};
      const hourlyUsage = res[`ls_hourly_${today}`] || {};
      const normalizedUsage: Record<string, number> = {};
      
      for (const [domain, time] of Object.entries(rawUsage)) {
        let normalized = domain;
        for (const d of SOCIAL_MEDIA_DOMAINS) {
          if (domain === d || domain.endsWith("." + d)) {
            normalized = d;
            break;
          }
        }
        normalizedUsage[normalized] = (normalizedUsage[normalized] || 0) + (time as number);
      }
      
      sendResponse({ usage: normalizedUsage, hourly: hourlyUsage });
    });
    return true;
  }
  if (msg.type === "LS_FORCE_SYNC") {
    syncData().then(() => sendResponse({ done: true }));
    return true;
  }
  if (msg.type === "LS_CLOSE_TAB") {
    if (_sender.tab?.id) {
      chrome.tabs.remove(_sender.tab.id).catch(() => {});
    }
    return true;
  }

  // ─── Detox Messages ──────────────────────────────────────────────────────
  if (msg.type === "LS_DETOX_START") {
    const { duration, customSites } = msg;
    const endTime = Date.now() + duration;
    chrome.storage.local.set({
      ls_detox_active: true,
      ls_detox_end_time: endTime,
      ls_detox_custom_sites: customSites || [],
    }).then(() => {
      chrome.alarms.create("ls_detox_end", { when: endTime });
      // Notify all tabs to check if they should be blocked
      chrome.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
          if (tab.id && tab.url) {
            chrome.tabs.sendMessage(tab.id, { type: "LS_DETOX_CHECK" }).catch(() => {});
          }
        }
      });
      sendResponse({ success: true, endTime });
    });
    return true;
  }
  if (msg.type === "LS_DETOX_STOP") {
    chrome.storage.local.set({ ls_detox_active: false, ls_detox_end_time: null }).then(() => {
      chrome.alarms.clear("ls_detox_end");
      // Notify all tabs to remove detox overlay
      chrome.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
          if (tab.id && tab.url) {
            chrome.tabs.sendMessage(tab.id, { type: "LS_DETOX_ENDED" }).catch(() => {});
          }
        }
      });
      sendResponse({ success: true });
    });
    return true;
  }
  if (msg.type === "LS_DETOX_STATUS") {
    chrome.storage.local.get(["ls_detox_active", "ls_detox_end_time", "ls_detox_custom_sites"]).then(data => {
      sendResponse({
        active: !!data.ls_detox_active,
        endTime: data.ls_detox_end_time || null,
        customSites: data.ls_detox_custom_sites || [],
      });
    });
    return true;
  }
  if (msg.type === "LS_PORN_BLOCKER_UPDATE") {
    // Notify all tabs about the porn blocker state change
    chrome.tabs.query({}).then(tabs => {
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          chrome.tabs.sendMessage(tab.id, { type: "LS_PORN_BLOCKER_UPDATE", active: msg.active }).catch(() => {});
        }
      }
    });
    sendResponse({ success: true });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => syncData());
chrome.runtime.onStartup.addListener(() => syncData());
