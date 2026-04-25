import './content.css';

import { state } from './modules/state';
import { formatTime } from './modules/platform';
import { applyVisualFriction, applyPayToPlay, initScrollFriction } from './modules/frictionEngine';
import { applyFeedHide } from './modules/feedHide';
import { checkDetoxBlock, removeDetoxBlock } from './modules/detoxOverlay';
import { checkPornBlock } from './modules/pornBlocker';
import { checkForGates } from './modules/navObserver';
import { initNavObserver } from './modules/navObserver';

// ─── Data Loading ────────────────────────────────────────────────────────────

async function loadData() {
  try {
    const auth = await chrome.storage.local.get(['ls_token', 'ls_user']);
    state.isAuthenticated = !!(auth.ls_token && auth.ls_user);
    if (!state.isAuthenticated) return;

    const data = await chrome.storage.local.get([
      'ls_cached_tasks', 'ls_cached_habits', 'ls_budget_left', 'ls_cached_finance', 'ls_cached_usage',
      'ls_friction_visual', 'ls_friction_pay', 'ls_friction_bumper', 'ls_friction_scroll', 'ls_friction_cognitive', 'ls_friction_temporal', 'ls_friction_feedhide',
      'ls_focus_credits',
    ]);
    state.cachedTasks = (data.ls_cached_tasks as any[]) || [];
    state.cachedHabits = (data.ls_cached_habits as any[]) || [];
    state.cachedFinance = (data.ls_cached_finance as any[]) || [];
    state.cachedUsage = (data.ls_cached_usage as Record<string, number>) || {};
    state.budgetLeft = (data.ls_budget_left as number) ?? null;

    state.frictionSettings.visual = !!data.ls_friction_visual;
    state.frictionSettings.pay = !!data.ls_friction_pay;
    state.frictionSettings.bumper = data.ls_friction_bumper !== false;
    state.frictionSettings.scroll = data.ls_friction_scroll !== false;
    state.frictionSettings.cognitive = data.ls_friction_cognitive !== false;
    state.frictionSettings.temporal = data.ls_friction_temporal !== false;
    state.frictionSettings.feedHide = !!data.ls_friction_feedhide;
    state.focusCredits = (data.ls_focus_credits as number) || 0;

    applyVisualFriction();
    applyPayToPlay();
    applyFeedHide();

    try {
      chrome.runtime.sendMessage({ type: 'LS_GET_USAGE' }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.usage) state.usageData = res.usage;
        checkForGates();
      });
    } catch (_) {}
  } catch (_) {}
}

// ─── Periodic Usage Refresh ─────────────────────────────────────────────────

const intervalId = setInterval(() => {
  if (!state.isAuthenticated) return;
  try {
    chrome.runtime.sendMessage({ type: 'LS_GET_USAGE' }, (res) => {
      if (chrome.runtime.lastError) { clearInterval(intervalId); return; }
      if (res?.usage) state.usageData = res.usage;
      // Update stat cards if gate is open
      const openGate = document.getElementById('ls-focus-gate');
      if (openGate) {
        const timeEl = openGate.querySelector('.ls-gate-time');
        if (timeEl) {
          const t = formatTime(state.usageData[state.currentDomain] || 0);
          timeEl.textContent = `⏱ ${t} today on ${state.currentDomain}`;
        }
      }
    });
  } catch (_) { clearInterval(intervalId); }
}, 30000);

// ─── Message Listeners ──────────────────────────────────────────────────────

try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LS_DATA_UPDATED') loadData();
    if (msg.type === 'LS_DETOX_CHECK') checkDetoxBlock();
    if (msg.type === 'LS_DETOX_ENDED') removeDetoxBlock();
    if (msg.type === 'LS_PORN_BLOCKER_UPDATE') checkPornBlock(msg.active);
    if (msg.type === 'LS_FRICTION_UPDATE') loadData();
  });
} catch (_) {}

// ─── Initialize ─────────────────────────────────────────────────────────────

loadData();
checkDetoxBlock();
checkPornBlock();
initNavObserver();
initScrollFriction();
