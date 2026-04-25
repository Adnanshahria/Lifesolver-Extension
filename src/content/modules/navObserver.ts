import { state } from './state';
import { isVideoPage, isCheckoutPage } from './platform';
import { showFocusGate } from './focusGate';
import { showCheckoutGate } from './checkoutGate';
import { checkPornBlock } from './pornBlocker';
import { applyFeedHide } from './Friction_FeedHide';

// ─── Gate Watcher ────────────────────────────────────────────────────────────

export function checkForGates() {
  if (!state.isAuthenticated) return;

  // Don't re-trigger if the user already answered the gate for this exact URL
  if (state.gateAnsweredForHref === window.location.href) return;

  if (isVideoPage() && !state.focusGateShown && !state.checkoutGateShown) {
    showFocusGate();
  } else if (isCheckoutPage() && !state.checkoutGateShown && !state.focusGateShown) {
    showCheckoutGate();
  }
}

// ─── SPA Navigation Observer ────────────────────────────────────────────────

export function initNavObserver() {
  let lastHref = window.location.href;

  const navObserver = new MutationObserver(function onDomMutation() {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href;
      // URL changed — reset all gate state so the gate can show on the new page
      state.focusGateShown = false;
      state.checkoutGateShown = false;
      state.gateAnsweredForHref = null;
      setTimeout(function delayedCheckForGates() { checkForGates(); }, 800);
      setTimeout(function delayedCheckPornBlock() { checkPornBlock(); }, 100);
      setTimeout(function delayedApplyFeedHide() { applyFeedHide(); }, 300);
    }
  });

  if (document.body) {
    navObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      navObserver.observe(document.body, { childList: true, subtree: true });
    });
  }
}
