import { state } from './state';

export async function syncAuthFromMainSite() {
  const host = window.location.hostname;
  
  // Detect if we are on the main site (production or local dev)
  const isMainSite = 
    host === 'life-solver.vercel.app' || 
    host === 'lifesolver.app' || 
    host === 'localhost' || 
    host === '127.0.0.1';

  if (!isMainSite) return;

  try {
    const token = localStorage.getItem('lifeos-token');
    const userStr = localStorage.getItem('lifeos-user');

    if (!token || !userStr) return;

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      return;
    }

    // Check if we need to update
    const current = await chrome.storage.local.get(['ls_token', 'ls_user']);
    
    if (current.ls_token !== token || JSON.stringify(current.ls_user) !== JSON.stringify(user)) {
      console.log('[LifeSolver] Syncing auth from main site...');
      
      await chrome.storage.local.set({
        ls_token: token,
        ls_user: user
      });

      // Update local state
      state.isAuthenticated = true;

      // Force background sync
      chrome.runtime.sendMessage({ type: 'LS_FORCE_SYNC' });
    }
  } catch (err) {
    console.warn('[LifeSolver] Auth sync failed:', err);
  }
}
