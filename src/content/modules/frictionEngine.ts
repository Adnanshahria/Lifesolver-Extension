import { state } from './state';
import { isSocialDomain } from './platform';
import { recordFrictionEvent } from './frictionAnalytics';

// ─── Visual Friction (Grayscale) ────────────────────────────────────────────

export function applyVisualFriction() {
  if (!state.frictionSettings.visual || !isSocialDomain()) {
    document.body.style.filter = '';
    return;
  }

  const timeSpentMs = state.usageData[state.currentDomain] || 0;
  const timeSpentMins = timeSpentMs / 60000;

  // 0 mins = 0% grayscale, 5 mins = 100% grayscale
  const grayscalePct = Math.min(100, (timeSpentMins / 5) * 100);
  document.body.style.filter = `grayscale(${grayscalePct}%)`;
}

// ─── Pay-to-Play ────────────────────────────────────────────────────────────

let payToPlayOverlay: HTMLDivElement | null = null;
let payToPlayTimer: number | null = null;

export function applyPayToPlay() {
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
          <div style="position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: rgba(9, 9, 11, 0.95); backdrop-filter: blur(10px); flex-direction: column; color: white; font-family: 'Inter', system-ui, sans-serif;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #f1f5f9;">Out of Focus Credits</h1>
            <p style="font-size: 14px; opacity: 0.7; margin-bottom: 20px; color: #94a3b8;">Complete a task in LifeSolver to earn more screen time.</p>
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
