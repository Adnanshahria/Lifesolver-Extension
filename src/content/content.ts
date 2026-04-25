import './content.css';

import { state } from './modules/state';
import { formatTime, detectPlatform } from './modules/platform';
import { applyVisualFriction, /* applyPayToPlay, */ initScrollFriction } from './modules/frictionEngine';
import { applyFeedHide } from './modules/Friction_FeedHide';
import { checkDetoxBlock, removeDetoxBlock } from './modules/detoxOverlay';
import { checkPornBlock } from './modules/pornBlocker';
import { checkForGates } from './modules/navObserver';
import { initNavObserver } from './modules/navObserver';
import { syncAuthFromMainSite } from './modules/syncAuth';

// ─── Data Loading ────────────────────────────────────────────────────────────

async function loadData() {
  detectPlatform();
  try {
    const data = await chrome.storage.local.get([
      'ls_token', 'ls_user',
      'ls_cached_tasks', 'ls_cached_habits', 'ls_budget_left', 'ls_cached_finance', 'ls_cached_usage',
      'ls_friction_visual', 'ls_friction_pay', 'ls_friction_bumper', 'ls_friction_scroll', 'ls_friction_cognitive', 'ls_friction_temporal', 'ls_friction_feedhide',
      'ls_friction_checkout_gate', 'ls_friction_focus_gate', 'ls_friction_auto_popup',
      'ls_friction_feedhide_platforms', 'ls_focus_credits',
    ]);

    state.isAuthenticated = !!(data.ls_token && data.ls_user);
    
    // Populate settings immediately
    state.frictionSettings.visual = !!data.ls_friction_visual;
    state.frictionSettings.feedHide = data.ls_friction_feedhide !== false; // Default ON, but user can toggle
    // state.frictionSettings.pay = true; // Disabled for now
    state.frictionSettings.checkoutGate = data.ls_friction_checkout_gate !== false;
    state.frictionSettings.focusGate = data.ls_friction_focus_gate !== false;
    state.frictionSettings.autoPopup = data.ls_friction_auto_popup !== false;
    state.frictionSettings.bumper = data.ls_friction_bumper !== false;
    state.frictionSettings.scroll = data.ls_friction_scroll !== false;
    state.frictionSettings.cognitive = data.ls_friction_cognitive !== false;
    state.frictionSettings.temporal = data.ls_friction_temporal !== false;
    if (data.ls_friction_feedhide_platforms) {
      state.frictionSettings.feedHidePlatforms = data.ls_friction_feedhide_platforms as Record<string, boolean>;
    }
    state.focusCredits = (data.ls_focus_credits as number) || 0;
    state.cachedTasks = (data.ls_cached_tasks as any[]) || [];
    state.cachedHabits = (data.ls_cached_habits as any[]) || [];
    state.cachedFinance = (data.ls_cached_finance as any[]) || [];
    state.cachedUsage = (data.ls_cached_usage as Record<string, number>) || {};
    state.budgetLeft = (data.ls_budget_left as number) ?? null;

    // Apply feed hide IMMEDIATELY once state is populated
    applyFeedHide();

    applyVisualFriction();
    // applyPayToPlay();
    
    // Re-run applyFeedHide once dashboard data is ready
    applyFeedHide();

    try {
      chrome.runtime.sendMessage({ type: 'LS_GET_USAGE' }, function onUsageLoaded(res) {
        try {
          if (chrome.runtime.lastError) return;
          if (res?.usage) state.usageData = res.usage;
          checkForGates();
        } catch (err) {
          console.warn('[LifeSolver] Usage callback error:', err);
        }
      });
    } catch (_) {}
  } catch (err) {
    console.error('[LifeSolver] loadData error:', err);
  }
}

// ─── Periodic Usage Refresh ─────────────────────────────────────────────────

const intervalId = setInterval(function periodicUsageRefresh() {
  if (!state.isAuthenticated) return;
  try {
    chrome.runtime.sendMessage({ type: 'LS_GET_USAGE' }, function onPeriodicUsage(res) {
      try {
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
      } catch (err) {
        console.warn('[LifeSolver] Periodic usage callback error:', err);
      }
    });
  } catch (_) { clearInterval(intervalId); }
}, 30000);

// ─── Message Listeners ──────────────────────────────────────────────────────

try {
  chrome.runtime.onMessage.addListener(function onExtensionMessage(msg) {
    try {
      if (msg.type === 'LS_DATA_UPDATED') loadData();
      if (msg.type === 'LS_DETOX_CHECK') checkDetoxBlock();
      if (msg.type === 'LS_DETOX_ENDED') removeDetoxBlock();
      if (msg.type === 'LS_PORN_BLOCKER_UPDATE') checkPornBlock(msg.active);
      if (msg.type === 'LS_FRICTION_UPDATE') loadData();
    } catch (err) {
      console.warn('[LifeSolver] Message listener error:', err);
    }
  });
} catch (_) {}

// ─── Initialize ─────────────────────────────────────────────────────────────

loadData();
syncAuthFromMainSite();
checkDetoxBlock();
checkPornBlock();
initNavObserver();
initScrollFriction();
