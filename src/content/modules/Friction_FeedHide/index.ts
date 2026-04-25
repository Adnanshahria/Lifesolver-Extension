import { state } from '../state';
import { isSocialDomain, isHomeFeedPage } from '../platform';
import { injectFeedHideCss, removeFeedHideCss } from './css';
import { injectDashboard, removeDashboard } from './dashboard';

function getPlatformKey(domain: string): string {
  if (domain.includes('facebook.com')) return 'facebook';
  if (domain.includes('youtube.com')) return 'youtube';
  if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
  if (domain.includes('instagram.com')) return 'instagram';
  if (domain.includes('reddit.com')) return 'reddit';
  return '';
}

export function applyFeedHide() {
  const platformKey = getPlatformKey(state.currentDomain);
  const platformEnabled = platformKey ? (state.frictionSettings.feedHidePlatforms?.[platformKey] ?? true) : true;

  if (!state.frictionSettings.feedHide || !isSocialDomain() || !isHomeFeedPage() || !platformEnabled) {
    removeFeedHideCss();
    removeDashboard();
    return;
  }

  injectFeedHideCss();
  injectDashboard();
}
