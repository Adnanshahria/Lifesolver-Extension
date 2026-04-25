import { state } from './state';

// ─── Domain Constants ─────────────────────────────────────────────────────────
export const SOCIAL_DOMAINS = [
  'youtube.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'tiktok.com', 'reddit.com',
];

export const DETOX_SOCIAL_DOMAINS = SOCIAL_DOMAINS;

// ─── Platform Detection ──────────────────────────────────────────────────────

export function detectPlatform(): string | null {
  const hostname = window.location.hostname;
  for (const d of SOCIAL_DOMAINS) {
    if (hostname.includes(d)) {
      state.currentDomain = d;
      return d;
    }
  }
  return null;
}

export function isSocialDomain(): boolean {
  let hostname = window.location.hostname;
  if (hostname.startsWith('www.')) hostname = hostname.slice(4);
  for (const d of SOCIAL_DOMAINS) {
    if (hostname === d || hostname.endsWith('.' + d)) return true;
  }
  return false;
}

export function isVideoPage(): boolean {
  const h = window.location.hostname;
  const p = window.location.pathname;
  const s = window.location.search;
  if (h.includes('youtube.com') && (s.includes('v=') || p.includes('/shorts/'))) return true;
  if (h.includes('tiktok.com') && p.includes('/video/')) return true;
  if (h.includes('facebook.com') && (p.includes('/watch') || p.includes('/videos/') || p.includes('/reel/'))) return true;
  if ((h.includes('twitter.com') || h.includes('x.com')) && p.includes('/status/')) return true;
  if (h.includes('instagram.com') && (p.startsWith('/reel') || p.startsWith('/p/'))) return true;
  return false;
}

export function isCheckoutPage(): boolean {
  const h = window.location.hostname;
  const p = window.location.pathname.toLowerCase();

  const checkoutPatterns = ['/checkout', '/cart', '/basket', '/payment', '/buy', '/pay'];
  if (checkoutPatterns.some((pattern) => p.includes(pattern))) {
    return true;
  }

  if (h.includes('amazon.') && (p.includes('/gp/cart') || p.includes('/checkout/'))) return true;
  if (h.includes('ebay.') && p.includes('/checkout')) return true;

  return false;
}

export function isHomeFeedPage(): boolean {
  const h = window.location.hostname;
  const p = window.location.pathname;
  if (h.includes('facebook.com')) return p === '/' || p === '/home.php';
  if (h.includes('youtube.com')) return p === '/';
  if (h.includes('twitter.com') || h.includes('x.com')) return p === '/home';
  if (h.includes('instagram.com')) return p === '/';
  if (h.includes('reddit.com')) return p === '/';
  return true; // Default true for unknown platforms, let findFeedContainer handle it
}

export function findFeedContainer(): HTMLElement | null {
  const host = window.location.hostname;
  if (host.includes('youtube.com')) return document.querySelector("ytd-browse[page-subtype='home']") as HTMLElement;
  if (host.includes('facebook.com')) {
    const main = document.querySelector("div[role='main']") as HTMLElement;
    if (main) {
      const feed = main.querySelector("[role='feed']");
      if (feed) {
        let current = feed as HTMLElement;
        while (current.parentElement && (current.parentElement as HTMLElement) !== main) {
          current = current.parentElement as HTMLElement;
        }
        return current;
      }
      return main.firstElementChild as HTMLElement || main;
    }
    return document.querySelector("div[role='main']") as HTMLElement;
  }
  if (host.includes('twitter.com') || host.includes('x.com')) return document.querySelector("main[role='main']") as HTMLElement;
  if (host.includes('reddit.com')) return document.querySelector('shreddit-feed')?.parentElement as HTMLElement || null;
  return null;
}

// ─── Time Formatter ──────────────────────────────────────────────────────────

export function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 1) return '< 1 min';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
