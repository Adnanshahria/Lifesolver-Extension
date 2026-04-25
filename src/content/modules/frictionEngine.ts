import { state } from './state';
import { isSocialDomain } from './platform';
import { recordFrictionEvent } from './frictionAnalytics';

// ─── Visual Friction (Grayscale) ────────────────────────────────────────────

let grayscaleInterval: number | null = null;

export function applyVisualFriction() {
  if (!state.frictionSettings.visual || !isSocialDomain()) {
    if (grayscaleInterval) {
      clearInterval(grayscaleInterval);
      grayscaleInterval = null;
    }
    document.documentElement.style.filter = '';
    return;
  }

  // Prevent multiple intervals
  if (grayscaleInterval) return;

  const startTime = Date.now();
  const DURATION = 5 * 60 * 1000; // 5 minutes to full grayscale

  grayscaleInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    
    // Only apply if still enabled
    if (!state.frictionSettings.visual) {
      if (grayscaleInterval) {
        clearInterval(grayscaleInterval);
        grayscaleInterval = null;
      }
      document.documentElement.style.filter = '';
      return;
    }

    document.documentElement.style.filter = `grayscale(${progress * 100}%)`;
    
    if (progress >= 1 && grayscaleInterval) {
      clearInterval(grayscaleInterval);
      grayscaleInterval = null;
    }
  }, 1000);
}

// ─── Pay-to-Play ────────────────────────────────────────────────────────────

// let payToPlayOverlay: HTMLDivElement | null = null;
// let payToPlayTimer: number | null = null;

export function applyPayToPlay() {
  /*
  if (!state.frictionSettings.pay || !isSocialDomain()) {
    if (payToPlayOverlay) {
      payToPlayOverlay.remove();
      payToPlayOverlay = null;
    }
    if (payToPlayTimer) {
      clearInterval(payToPlayTimer);
      payToPlayTimer = null;
    }
    return;
  }

  const checkCredits = () => {
    if (state.focusCredits <= 0) {
      if (!payToPlayOverlay) {
        payToPlayOverlay = document.createElement('div');
        payToPlayOverlay.id = 'ls-pay-to-play-block';
        payToPlayOverlay.innerHTML = `
          <div style="position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: rgba(9, 9, 11, 0.98); backdrop-filter: blur(20px); flex-direction: column; color: white; font-family: 'Inter', system-ui, sans-serif; text-align: center;">
            <div style="width: 80px; height: 80px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 0 40px rgba(239, 68, 68, 0.1);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 12px; color: #f1f5f9; letter-spacing: -0.02em; text-transform: uppercase;">Dashboard Locked</h1>
            <p style="font-size: 16px; opacity: 0.6; margin-bottom: 32px; color: #94a3b8; max-width: 400px; line-height: 1.6;">You have exhausted your **Focus Credits**. <br> Complete a task in LifeSolver to unlock your dashboard and earn more screen time.</p>
            <div style="display: flex; gap: 12px;">
               <div style="padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 13px; color: #f1f5f9; font-weight: 600;">0 Credits Available</div>
            </div>
          </div>
        `;
        document.documentElement.appendChild(payToPlayOverlay);
        document.documentElement.style.overflow = 'hidden';
        recordFrictionEvent('pay_blocked', state.currentDomain);
      }
    } else {
      if (payToPlayOverlay) {
        payToPlayOverlay.remove();
        payToPlayOverlay = null;
        document.documentElement.style.overflow = '';
      }
    }
  };

  checkCredits();

  if (!payToPlayTimer) {
    payToPlayTimer = window.setInterval(() => {
      if (state.focusCredits > 0) {
        state.focusCredits -= 1;
        chrome.storage.local.set({ ls_focus_credits: state.focusCredits });
        checkCredits();
      }
    }, 60000); // Drain 1 credit every minute
  }
  */
}

// ─── Doom-Scroll Bumper & Heavy Scroll ──────────────────────────────────────

let totalPixelsScrolled = 0;
const BUMPER_THRESHOLD = window.innerHeight * 4;

function buildDoomScrollBumper(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'ls-doom-bumper';
  overlay.innerHTML = `
    <style>
      #ls-doom-bumper {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483646 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(9, 9, 11, 0.95) !important;
        backdrop-filter: blur(10px) !important;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
      }
      .ls-bumper-card {
        text-align: center; max-width: 400px; width: 90%;
        padding: 40px; border-radius: 20px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .ls-bumper-title { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0 0 10px 0; }
      .ls-bumper-subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0 0 24px 0; line-height: 1.5; }
      .ls-bumper-btn {
        padding: 12px 24px; border-radius: 12px;
        background: #f8fafc; color: #0f172a;
        font-weight: 600; font-size: 14px; border: none; cursor: pointer;
      }
    </style>
    <div class="ls-bumper-card">
      <h1 class="ls-bumper-title">Hold on.</h1>
      <p class="ls-bumper-subtitle">You've scrolled the equivalent of 4 full pages. Are you still being intentional, or are you on autopilot?</p>
      <button class="ls-bumper-btn" id="ls-bumper-continue">I am intentional. Continue.</button>
    </div>
  `;

  overlay.querySelector('#ls-bumper-continue')?.addEventListener('click', () => {
    overlay.remove();
    document.documentElement.style.overflow = '';
    totalPixelsScrolled = 0;
    recordFrictionEvent('bumper_continued', state.currentDomain);
  });

  return overlay;
}

export function initScrollFriction() {
  if (!isSocialDomain()) return;

  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      if (!state.frictionSettings.scroll && !state.frictionSettings.bumper) return;

      // Do not interfere if scrolling on the bumper itself
      if (document.getElementById('ls-doom-bumper')) return;

      if (state.frictionSettings.scroll) {
        // Mechanical Scroll Friction (50% slower)
        e.preventDefault();
        window.scrollBy({
          top: e.deltaY * 0.4,
          left: e.deltaX * 0.4,
          behavior: 'auto',
        });
        totalPixelsScrolled += Math.abs(e.deltaY * 0.4);
      } else {
        totalPixelsScrolled += Math.abs(e.deltaY);
      }

      // Doom-Scroll Bumper
      if (state.frictionSettings.bumper && totalPixelsScrolled >= BUMPER_THRESHOLD) {
        if (!document.getElementById('ls-doom-bumper')) {
          const bumper = buildDoomScrollBumper();
          document.documentElement.appendChild(bumper);
          document.documentElement.style.overflow = 'hidden';
          recordFrictionEvent('bumper_shown', state.currentDomain);
        }
      }
    },
    { passive: false },
  );
}
