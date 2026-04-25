import { isSocialDomain } from './platform';

// ─── Detox Domain Check ──────────────────────────────────────────────────────



function isDetoxDomainBlocked(customSites: string[]): boolean {
  if (isSocialDomain()) return true;

  let hostname = window.location.hostname;
  if (hostname.startsWith('www.')) hostname = hostname.slice(4);

  for (const site of customSites) {
    const clean = site.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').toLowerCase();
    if (clean && (hostname === clean || hostname.endsWith('.' + clean))) return true;
  }
  return false;
}

// ─── Build Detox Overlay ────────────────────────────────────────────────────

let detoxCountdownInterval: number | null = null;

function buildDetoxOverlay(endTime: number): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'ls-detox-block';
  overlay.innerHTML = `
    <style>
      #ls-detox-block {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #09090b !important;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
      }
      #ls-detox-block * { box-sizing: border-box !important; }
      .ls-detox-bg1 {
        position: absolute; top: -20%; left: -10%;
        width: 500px; height: 500px; border-radius: 50%;
        background: radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 70%);
        filter: blur(80px); pointer-events: none;
        animation: ls-detox-float 8s ease-in-out infinite;
      }
      .ls-detox-bg2 {
        position: absolute; bottom: -20%; right: -10%;
        width: 400px; height: 400px; border-radius: 50%;
        background: radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%);
        filter: blur(80px); pointer-events: none;
        animation: ls-detox-float 8s ease-in-out infinite reverse;
      }
      @keyframes ls-detox-float {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-30px) scale(1.05); }
      }
      .ls-detox-card {
        position: relative; z-index: 1;
        text-align: center; max-width: 420px; width: 90%;
        padding: 48px 36px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        backdrop-filter: blur(20px);
        box-shadow: 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .ls-detox-shield {
        display: inline-flex; align-items: center; justify-content: center;
        width: 72px; height: 72px; margin-bottom: 20px;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(147,51,234,0.2), rgba(236,72,153,0.2));
        border: 1px solid rgba(147,51,234,0.3);
        animation: ls-shield-pulse 2s ease-in-out infinite;
      }
      .ls-detox-shield svg {
        width: 36px; height: 36px;
        stroke: #c084fc; fill: none; stroke-width: 2;
        stroke-linecap: round; stroke-linejoin: round;
      }
      @keyframes ls-shield-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(147,51,234,0.3), 0 0 60px rgba(147,51,234,0.1); }
        50% { box-shadow: 0 0 30px rgba(147,51,234,0.5), 0 0 80px rgba(147,51,234,0.2); }
      }
      .ls-detox-title {
        font-size: 22px; font-weight: 700; letter-spacing: -0.5px;
        color: #f1f5f9; margin: 0 0 6px 0;
        background: linear-gradient(135deg, #c084fc, #f472b6);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .ls-detox-subtitle {
        font-size: 13px; color: rgba(255,255,255,0.45);
        margin: 0 0 32px 0; font-weight: 400;
      }
      .ls-detox-timer {
        font-size: 48px; font-weight: 800; letter-spacing: 2px;
        font-variant-numeric: tabular-nums;
        color: #f1f5f9; margin: 0 0 8px 0;
        text-shadow: 0 0 40px rgba(147,51,234,0.4);
      }
      .ls-detox-timer-label {
        font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
        color: rgba(255,255,255,0.3); margin: 0 0 28px 0; font-weight: 600;
      }
      .ls-detox-progress-track {
        width: 100%; height: 4px; border-radius: 4px;
        background: rgba(255,255,255,0.06); margin-bottom: 28px;
        overflow: hidden;
      }
      .ls-detox-progress-fill {
        height: 100%; border-radius: 4px;
        background: linear-gradient(90deg, #9333ea, #ec4899);
        box-shadow: 0 0 12px rgba(147,51,234,0.5);
        transition: width 1s linear;
      }
      .ls-detox-quote {
        font-size: 13px; font-style: italic; line-height: 1.6;
        color: rgba(255,255,255,0.35); margin: 0 0 8px 0;
      }
      .ls-detox-footer {
        font-size: 10px; color: rgba(255,255,255,0.2);
        letter-spacing: 1px; text-transform: uppercase;
        margin-top: 24px; font-weight: 500;
      }
    </style>
    <div class="ls-detox-bg1"></div>
    <div class="ls-detox-bg2"></div>
    <div class="ls-detox-card">
      <div class="ls-detox-shield">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h1 class="ls-detox-title">Dopamine Detox Active</h1>
      <p class="ls-detox-subtitle">This site is blocked during your detox session</p>
      <div class="ls-detox-timer" id="ls-detox-timer">00:00:00</div>
      <div class="ls-detox-timer-label">Time Remaining</div>
      <div class="ls-detox-progress-track">
        <div class="ls-detox-progress-fill" id="ls-detox-progress" style="width: 0%"></div>
      </div>
      <p class="ls-detox-quote">"The secret of getting ahead is getting started."</p>
      <div class="ls-detox-footer">Powered by LifeSolver · Stay focused</div>
    </div>
  `;

  const timerEl = overlay.querySelector('#ls-detox-timer') as HTMLElement;
  const progressEl = overlay.querySelector('#ls-detox-progress') as HTMLElement;

  const updateTimer = () => {
    const now = Date.now();
    const remaining = endTime - now;
    if (remaining <= 0) {
      timerEl.textContent = '00:00:00';
      progressEl.style.width = '100%';
      removeDetoxBlock();
      return;
    }
    const totalSec = Math.ceil(remaining / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    chrome.storage.local.get('ls_detox_duration').then((data) => {
      const totalDuration = (data.ls_detox_duration as number) || (endTime - now);
      const elapsed = totalDuration - remaining;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      progressEl.style.width = `${pct}%`;
    }).catch(() => {});
  };

  updateTimer();
  detoxCountdownInterval = window.setInterval(updateTimer, 1000);

  document.documentElement.style.overflow = 'hidden';

  return overlay;
}

// ─── Remove / Check Detox Block ─────────────────────────────────────────────

export function removeDetoxBlock() {
  if (detoxCountdownInterval) {
    clearInterval(detoxCountdownInterval);
    detoxCountdownInterval = null;
  }
  const overlay = document.getElementById('ls-detox-block');
  if (overlay) {
    overlay.remove();
    document.documentElement.style.overflow = '';
  }
}

export async function checkDetoxBlock() {
  try {
    const data = await chrome.storage.local.get(['ls_detox_active', 'ls_detox_end_time', 'ls_detox_custom_sites']);
    if (!data.ls_detox_active) {
      removeDetoxBlock();
      return;
    }
    if (data.ls_detox_end_time && Date.now() >= (data.ls_detox_end_time as number)) {
      removeDetoxBlock();
      return;
    }

    const customSites = (data.ls_detox_custom_sites as string[]) || [];
    if (isDetoxDomainBlocked(customSites)) {
      if (!document.getElementById('ls-detox-block')) {
        const overlay = buildDetoxOverlay(data.ls_detox_end_time as number);
        if (document.body) {
          document.body.appendChild(overlay);
        } else {
          document.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));
        }
      }
    } else {
      removeDetoxBlock();
    }
  } catch (_) {}
}
