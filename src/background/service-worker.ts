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
  } catch (err) {
    console.warn("Sync failed", err);
  }

  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && extractDomain(tab.url)) {
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
});

chrome.runtime.onInstalled.addListener(() => syncData());
chrome.runtime.onStartup.addListener(() => syncData());
