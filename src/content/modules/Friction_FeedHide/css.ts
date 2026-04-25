export const cssId = 'ls-feed-hide-css';

export function injectFeedHideCss() {
  let styleEl = document.getElementById(cssId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = cssId;
    styleEl.innerHTML = `
      /* YouTube */
      ytd-browse[page-subtype="home"] ytd-rich-grid-renderer { opacity: 0 !important; pointer-events: none !important; height: 0 !important; overflow: hidden !important; }
      
      /* Dashboard must always be visible */
      #ls-feed-dashboard { display: block !important; opacity: 1 !important; height: auto !important; pointer-events: auto !important; visibility: visible !important; }
      
      /* Facebook - Hide feed children but NOT the dashboard */
      div[role="main"] .ls-feed-container > *:not(#ls-feed-dashboard) {
        display: none !important;
      }
      /* Facebook - Hide feed items inside [role="feed"], but keep the feed container itself visible for our dashboard */
      div[role="main"] [role="feed"] > * {
        display: none !important;
      }
      div[role="main"] div[data-pagelet="FeedUnit"] {
        display: none !important;
      }
      
      div[role="main"] [aria-label="Stories"],
      div[role="main"] [aria-label="Create a post"],
      div[role="main"] [aria-label="What's on your mind?"],
      div[role="main"] [role="region"][aria-label*="Stories"] { 
        display: none !important;
      }
      
      /* Twitter / X */
      [aria-label="Timeline: Your Home Timeline"] > * { opacity: 0 !important; pointer-events: none !important; height: 0 !important; overflow: hidden !important; }
      
      /* Reddit */
      shreddit-feed { opacity: 0 !important; pointer-events: none !important; height: 0 !important; overflow: hidden !important; }
    `;
    const parent = document.head || document.documentElement;
    if (parent) {
      parent.appendChild(styleEl);
    }
  }
}

export function removeFeedHideCss() {
  const styleEl = document.getElementById(cssId);
  if (styleEl) styleEl.remove();
}
