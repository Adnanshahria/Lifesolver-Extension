// ─── Shared Mutable State for Content Script Modules ──────────────────────────
// All content script modules share this state object to coordinate behavior.

export const state = {
  // Data
  cachedTasks: [] as any[],
  cachedHabits: [] as any[],
  cachedFinance: [] as any[],
  cachedUsage: {} as Record<string, number>,
  usageData: {} as Record<string, number>,
  currentDomain: '',
  isAuthenticated: false,
  budgetLeft: null as number | null,
  focusCredits: 0,

  // Gate state
  focusGateShown: false,
  checkoutGateShown: false,
  gateIsOpen: false,
  gateAnsweredForHref: null as string | null,

  // Friction settings
  frictionSettings: {
    visual: false,
    pay: false,
    bumper: true,
    scroll: true,
    cognitive: true,
    temporal: true,
    feedHide: false,
    checkoutGate: true,
    focusGate: true,
    autoPopup: true,
    feedHidePlatforms: {
      facebook: true,
      youtube: true,
      twitter: true,
      instagram: true,
      reddit: true,
    } as Record<string, boolean>,
  },
};
