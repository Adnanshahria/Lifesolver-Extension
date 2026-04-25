import { state } from '../state';
import { isSocialDomain } from '../platform';
import { injectFeedHideCss, removeFeedHideCss } from './css';
import { injectDashboard, removeDashboard, dashboardId } from './dashboard';

function getPlatformKey(domain: string): string {
  if (domain.includes('facebook.com')) return 'facebook';
  if (domain.includes('youtube.com')) return 'youtube';
  if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
  if (domain.includes('instagram.com')) return 'instagram';
  if (domain.includes('reddit.com')) return 'reddit';
  return '';
}

// ─── Persistent watcher to ensure dashboard stays in the DOM ─
let feedObserver: MutationObserver | null = null;
let retryTimer: number | null = null;

function stopWatcher() {
  if (feedObserver) {
    feedObserver.disconnect();
    feedObserver = null;
  }
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

/**
 * Attempts to inject the dashboard. Returns true if successful (element now in DOM).
 */
function tryInjectDashboard(): boolean {
  const existing = document.getElementById(dashboardId);
  if (existing) return true; // Already injected

  injectDashboard();
  return !!document.getElementById(dashboardId);
}

/**
 * Starts a persistent MutationObserver + fallback polling to keep retrying dashboard injection
 * and to re-inject it if the platform dynamically removes it.
 */
function startWatcher() {
  stopWatcher(); // Clean up any previous watcher

  // Try immediately
  tryInjectDashboard();

  // MutationObserver: watches for DOM changes. If dashboard is missing, try to inject.
  feedObserver = new MutationObserver(() => {
    if (!document.getElementById(dashboardId)) {
      tryInjectDashboard();
    }
  });

  if (document.body) {
    feedObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      feedObserver?.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Fallback interval: persistent polling just in case MO misses something
  retryTimer = window.setInterval(() => {
    if (!document.getElementById(dashboardId)) {
      tryInjectDashboard();
    }
  }, 2000);
}

export function applyFeedHide() {
  const platformKey = getPlatformKey(state.currentDomain);
  const platformEnabled = platformKey ? (state.frictionSettings.feedHidePlatforms?.[platformKey] ?? true) : true;

  if (!state.frictionSettings.feedHide || !isSocialDomain() || !platformEnabled) {
    stopWatcher();
    removeFeedHideCss();
    removeDashboard();
    return;
  }

  // CSS can be injected immediately — it hides the feed even before the container exists
  injectFeedHideCss();

  // Start persistent watcher to inject and maintain the dashboard
  startWatcher();
}
