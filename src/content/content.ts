import "./content.css";

// ─── State ───────────────────────────────────────────────────────────────────
let cachedTasks: any[] = [];
let cachedHabits: any[] = [];
let usageData: Record<string, number> = {};
let currentDomain = "";
let isAuthenticated = false;
let focusGateShown = false;
let checkoutGateShown = false;
let enforcePauseInterval: number | null = null;
let budgetLeft: number | null = null;

// Video state tracking – remember each video's state before gate pauses them
interface VideoSnapshot {
  video: HTMLVideoElement;
  wasMuted: boolean;
  wasPlaying: boolean;
  savedTime: number;
}
let videoSnapshots: VideoSnapshot[] = [];
let gatePauseObserver: MutationObserver | null = null;
let gateAnsweredForHref: string | null = null;  // locks out re-triggering on the same URL

// ─── Platform detection ───────────────────────────────────────────────────────
function detectPlatform(): string | null {
  const hostname = window.location.hostname;
  const DOMAINS = [
    "youtube.com", "facebook.com", "instagram.com",
    "twitter.com", "x.com", "tiktok.com", "reddit.com",
  ];
  for (const d of DOMAINS) {
    if (hostname.includes(d)) {
      currentDomain = d;
      return d;
    }
  }
  return null;
}

function isVideoPage(): boolean {
  const h = window.location.hostname;
  const p = window.location.pathname;
  const s = window.location.search;
  if (h.includes("youtube.com") && (s.includes("v=") || p.includes("/shorts/"))) return true;
  if (h.includes("tiktok.com") && p.includes("/video/")) return true;
  if (h.includes("facebook.com") && (p.includes("/watch") || p.includes("/videos/") || p.includes("/reel/"))) return true;
  if ((h.includes("twitter.com") || h.includes("x.com")) && p.includes("/status/")) return true;
  if (h.includes("instagram.com") && (p.startsWith("/reel") || p.startsWith("/p/"))) return true;
  return false;
}

function isCheckoutPage(): boolean {
  const h = window.location.hostname;
  const p = window.location.pathname.toLowerCase();
  
  // Common e-commerce checkout/cart path patterns
  const checkoutPatterns = ["/checkout", "/cart", "/basket", "/payment", "/buy", "/pay"];
  if (checkoutPatterns.some(pattern => p.includes(pattern))) {
    // Basic filter to avoid some non-ecommerce sites if needed, but host_permissions handles most
    return true;
  }
  
  // Specific site checks
  if (h.includes("amazon.") && (p.includes("/gp/cart") || p.includes("/checkout/"))) return true;
  if (h.includes("ebay.") && p.includes("/checkout")) return true;
  
  return false;
}

// ─── Time formatter ───────────────────────────────────────────────────────────
function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "< 1 min";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ─── Focus Gate Modal ─────────────────────────────────────────────────────────
function buildFocusGate(): HTMLDivElement {
  const platform = detectPlatform() || currentDomain;
  const timeStr = formatTime(usageData[platform] || 0);
  const today = new Date().toISOString().split("T")[0];
  const pendingTasks = cachedTasks.filter((t: any) => t.status !== "done");
  const pendingHabits = cachedHabits.filter((h: any) => h.last_completed_date !== today);

  const gate = document.createElement("div");
  gate.id = "ls-focus-gate";
  gate.innerHTML = `
    <div class="ls-gate-backdrop"></div>
    <div class="ls-gate-card">

      <!-- Header -->
      <div class="ls-gate-header">
        <div class="ls-gate-logo">
          <span class="ls-gate-dot"></span>
          LifeSolver
        </div>
        <div class="ls-gate-time">⏱ ${timeStr} today on ${platform}</div>
      </div>

      <!-- Stats row -->
      <div class="ls-gate-stats">
        <div class="ls-stat-card ls-stat-tasks">
          <span class="ls-stat-icon">📋</span>
          <span class="ls-stat-num">${pendingTasks.length}</span>
          <span class="ls-stat-label">Tasks pending</span>
        </div>
        <div class="ls-stat-card ls-stat-habits">
          <span class="ls-stat-icon">🔥</span>
          <span class="ls-stat-num">${pendingHabits.length}</span>
          <span class="ls-stat-label">Habits left today</span>
        </div>
        <div class="ls-stat-card ls-stat-time">
          <span class="ls-stat-icon">⏰</span>
          <span class="ls-stat-num">${timeStr}</span>
          <span class="ls-stat-label">Time here today</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="ls-gate-divider"></div>

      <!-- Questions container -->
      <div class="ls-gate-questions" id="ls-questions">

        <!-- Q1 -->
        <div class="ls-question" id="ls-q1" data-q="1">
          <div class="ls-q-label">
            <span class="ls-q-num">01</span>
            Is this video really needed right now?
          </div>
          <div class="ls-choices">
            <button class="ls-choice" data-q="1" data-val="yes">
              <span class="ls-choice-icon">✓</span> Yes, I genuinely need it
            </button>
            <button class="ls-choice ls-choice-no" data-q="1" data-val="no">
              <span class="ls-choice-icon">✗</span> No, just scrolling
            </button>
          </div>
        </div>

      </div>

      <!-- Result buttons (hidden until end) -->
      <div class="ls-gate-actions ls-q-hidden" id="ls-gate-actions">
        <button class="ls-btn-back" id="ls-goback">
          ← Take me back to work
        </button>
      </div>

      <!-- Footer -->
      <div class="ls-gate-footer">
        Powered by LifeSolver · Stay intentional
      </div>

    </div>
  `;

  return gate;
}

// ─── Checkout Gate Modal ──────────────────────────────────────────────────────
function buildCheckoutGate(): HTMLDivElement {
  const hostname = window.location.hostname;
  const merchantName = hostname.replace(/^www\./, "").split(".")[0];
  const budgetStr = budgetLeft !== null ? `৳${budgetLeft.toLocaleString()}` : "Not set";
  const isOverBudget = budgetLeft !== null && budgetLeft < 0;
  
  // Calculate budget percentage for the bar if possible
  let budgetPct = 0;
  if (budgetLeft !== null) {
    // We don't have total budget here, but we can assume some default or use a generic visual if total is unknown.
    // However, the background script stores ls_cached_budgets. We could fetch that too.
    // For now, let's just use a visual indicator if it's over/under.
    budgetPct = isOverBudget ? 100 : 65; // Mocking visual depth
  }

  const gate = document.createElement("div");
  gate.id = "ls-focus-gate";
  gate.innerHTML = `
    <div class="ls-gate-backdrop"></div>
    <div class="ls-gate-card">

      <!-- Header -->
      <div class="ls-gate-header ls-animate ls-delay-1">
        <div class="ls-gate-logo">
          <span class="ls-gate-dot" style="background: ${isOverBudget ? '#ef4444' : '#10b981'}; box-shadow: 0 0 10px ${isOverBudget ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'};"></span>
          LifeSolver Financial
        </div>
        <div class="ls-gate-time" style="color: ${isOverBudget ? '#f87171' : '#34d399'}; background: ${isOverBudget ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)'}; border-color: ${isOverBudget ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'};">
          ${isOverBudget ? '⚠ Over Budget' : '✓ Within Budget'}
        </div>
      </div>

      <!-- Stats row -->
      <div class="ls-gate-stats">
        <div class="ls-stat-card ls-animate ls-delay-2">
          <span class="ls-stat-icon">💰</span>
          <span class="ls-stat-num ${isOverBudget ? 'ls-stat-budget-over' : 'ls-stat-budget-ok'}">${budgetStr}</span>
          <span class="ls-stat-label">Budget Left</span>
          <div class="ls-budget-bar">
            <div class="ls-budget-fill ${isOverBudget ? 'ls-budget-fill-over' : 'ls-budget-fill-ok'}" style="width: ${budgetPct}%"></div>
          </div>
        </div>
        <div class="ls-stat-card ls-animate ls-delay-3">
          <span class="ls-stat-icon">🛒</span>
          <span class="ls-stat-num" style="color: #38bdf8; text-transform: capitalize;">${merchantName}</span>
          <span class="ls-stat-label">Merchant</span>
        </div>
        <div class="ls-stat-card ls-animate ls-delay-4">
          <span class="ls-stat-icon">🛡</span>
          <span class="ls-stat-num" style="color: #c084fc;">Shield</span>
          <span class="ls-stat-label">Active</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="ls-gate-divider ls-animate ls-delay-5"></div>

      <!-- Questions container -->
      <div class="ls-gate-questions" id="ls-questions">

        <!-- Q1 -->
        <div class="ls-question ls-animate ls-delay-5" id="ls-q1" data-q="1">
          <div class="ls-q-label" style="font-size: 14px; color: #f1f5f9; margin-bottom: 16px; font-weight: 500;">
            <span style="color: #38bdf8; font-weight: 800; margin-right: 8px;">01</span>
            Is this purchase really necessary right now?
          </div>
          <div class="ls-choices">
            <button class="ls-choice" data-q="1" data-val="yes">
              <span class="ls-choice-icon">💎</span> Yes, I need this for my goals
            </button>
            <button class="ls-choice ls-choice-no" data-q="1" data-val="no">
              <span class="ls-choice-icon">🛑</span> No, it's an impulse buy
            </button>
          </div>
        </div>

      </div>

      <!-- Result buttons (hidden until end) -->
      <div class="ls-gate-actions ls-q-hidden" id="ls-gate-actions">
        <button class="ls-btn-back ls-animate" id="ls-goback">
          ← Cancel Order & Save Money
        </button>
        <button class="ls-btn-proceed ls-btn-proceed-secondary ls-animate ls-delay-1" id="ls-proceed-purchase">
          Continue to checkout anyway
        </button>
      </div>

      <!-- Footer -->
      <div class="ls-gate-footer ls-animate ls-delay-5" style="margin-top: 24px; opacity: 0.6;">
        LifeSolver Protocol: Intentionality over Impulse.
      </div>

    </div>
  `;

  return gate;
}

// Answer state
const answers: Record<string, string> = {};

function attachGateEvents(gate: HTMLDivElement) {
  gate.querySelectorAll(".ls-choice").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const el = btn as HTMLButtonElement;
      const q = el.dataset.q!;
      const val = el.dataset.val!;

      // Mark selection
      gate.querySelectorAll(`.ls-choice[data-q="${q}"]`).forEach(b => b.classList.remove("ls-choice-selected"));
      el.classList.add("ls-choice-selected");
      answers[q] = val;

      // Advance logic
      setTimeout(() => advanceQuestion(gate, parseInt(q), val), 350);
    });
  });

  gate.querySelector("#ls-goback")?.addEventListener("click", () => {
    removeFocusGate();
    if (window.history.length > 1 && document.referrer) {
      history.back();
    } else {
      chrome.runtime.sendMessage({ type: "LS_CLOSE_TAB" });
    }
  });

  gate.querySelector("#ls-proceed-purchase")?.addEventListener("click", () => {
    removeFocusGate();
  });
}

function advanceQuestion(gate: HTMLDivElement, currentQ: number, val: string) {
  if (currentQ === 1) {
    if (val === "yes") {
      // Impactful confirmation for "Yes"
      const qBox = gate.querySelector("#ls-q1") as HTMLElement;
      if (qBox) {
        qBox.innerHTML = `
          <div class="ls-animate" style="text-align: center; padding: 20px 0;">
            <div style="font-size: 32px; margin-bottom: 12px;">💎</div>
            <div style="color: #34d399; font-weight: 700; font-size: 16px; margin-bottom: 4px;">Intentionality Confirmed</div>
            <div style="color: #94a3b8; font-size: 12px;">Proceeding with your goals in mind.</div>
          </div>
        `;
      }
      setTimeout(removeFocusGate, 1500);
    } else {
      // Impactful friction for "No"
      showFinalActions(gate, true);
      const qBox = gate.querySelector("#ls-q1") as HTMLElement;
      if (qBox) {
        qBox.style.opacity = "0.5";
        qBox.style.pointerEvents = "none";
      }
    }
  }
}

function showFinalActions(_gate: HTMLDivElement, suggestBack: boolean) {
  const actions = _gate.querySelector("#ls-gate-actions") as HTMLElement | null;
  if (!actions) return;
  actions.classList.remove("ls-q-hidden");

  if (suggestBack) {
    const back = _gate.querySelector("#ls-goback") as HTMLElement | null;
    if (back) {
      back.classList.add("ls-btn-back-highlight");
    }
  }

  setTimeout(() => actions.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
}

// ─── Video pause/resume helpers ──────────────────────────────────────────────

let gateIsOpen = false;  // true while the gate overlay is displayed

/** Handler attached to each <video> — re-pauses if the gate is still open */
function onVideoPlay(this: HTMLVideoElement) {
  if (!gateIsOpen) return;
  try {
    this.muted = true;
    this.pause();
  } catch (_) {}
}

/** Mute, pause, and attach a play-guard listener to a video */
function safelyPauseVideo(v: HTMLVideoElement) {
  try {
    v.muted = true;   // mute first to prevent audio pop
    v.pause();
  } catch (_) {}
  // Guard against Facebook's autoplay re-starting the video
  v.removeEventListener("play", onVideoPlay);  // avoid duplicates
  v.addEventListener("play", onVideoPlay);
}

/** Remove the play-guard listener from a video */
function removePlayGuard(v: HTMLVideoElement) {
  v.removeEventListener("play", onVideoPlay);
}

/** Snapshot all current videos, mute them and pause */
function snapshotAndPauseAll() {
  videoSnapshots = [];
  document.querySelectorAll<HTMLVideoElement>("video").forEach(v => {
    videoSnapshots.push({
      video: v,
      wasMuted: v.muted,
      wasPlaying: !v.paused,
      savedTime: v.currentTime,
    });
    safelyPauseVideo(v);
  });
}

/** Pause any newly-inserted <video> elements while the gate is open */
function startGatePauseObserver() {
  if (gatePauseObserver) return;
  gatePauseObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        // The node itself might be a <video>
        if (node.tagName === "VIDEO") {
          safelyPauseVideo(node as HTMLVideoElement);
        }
        // Or it could contain nested <video> elements
        node.querySelectorAll<HTMLVideoElement>("video").forEach(safelyPauseVideo);
      });
    }
  });
  gatePauseObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function stopGatePauseObserver() {
  if (gatePauseObserver) {
    gatePauseObserver.disconnect();
    gatePauseObserver = null;
  }
}

function removeFocusGate() {
  // Mark gate as closed so play-guard listeners become no-ops
  gateIsOpen = false;

  // Stop the legacy interval (if any leftover) & the observer
  if (enforcePauseInterval) {
    clearInterval(enforcePauseInterval);
    enforcePauseInterval = null;
  }
  stopGatePauseObserver();

  const existing = document.getElementById("ls-focus-gate");
  if (existing) {
    existing.classList.add("ls-gate-exit");
    setTimeout(() => existing.remove(), 350);
  }

  // IMPORTANT: Do NOT reset focusGateShown/checkoutGateShown to false here.
  // Keeping them true prevents checkForGates() from re-triggering and pausing
  // videos again while the user is still on the same page.
  // The nav observer resets them when the URL actually changes.
  gateAnsweredForHref = window.location.href;

  // Resume only the videos that were actually playing before the gate appeared.
  // Restore their original muted state so we don't un-mute videos that Facebook
  // had auto-muted, and don't start random background videos the user never saw.
  for (const snap of videoSnapshots) {
    try {
      const v = snap.video;
      // Clean up the play-guard listener
      removePlayGuard(v);

      // Skip if the element has been removed from the DOM
      if (!document.contains(v)) continue;

      // Restore muted state BEFORE play to avoid brief sound flash
      v.muted = snap.wasMuted;

      if (snap.wasPlaying) {
        // Seek back to where the video was when we paused it, in case
        // the player's internal position drifted (Facebook's player can do this)
        if (Math.abs(v.currentTime - snap.savedTime) > 1) {
          v.currentTime = snap.savedTime;
        }
        v.play().catch(() => {});
      }
    } catch (_) {}
  }
  videoSnapshots = [];

  // Also clean up play-guard from any videos that weren't in the snapshot
  // (e.g. added by observer during gate)
  document.querySelectorAll<HTMLVideoElement>("video").forEach(removePlayGuard);
}

function showFocusGate() {
  if (focusGateShown || checkoutGateShown) return;
  focusGateShown = true;
  gateIsOpen = true;

  // Snapshot current video states, then mute+pause all at once
  snapshotAndPauseAll();

  // Watch for any new <video> elements that appear while the gate is open
  startGatePauseObserver();

  const gate = buildFocusGate();
  if (document.body) {
    document.body.appendChild(gate);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(gate));
  }
  attachGateEvents(gate);
}

function showCheckoutGate() {
  if (checkoutGateShown || focusGateShown) return;
  checkoutGateShown = true;

  const gate = buildCheckoutGate();
  if (document.body) {
    document.body.appendChild(gate);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(gate));
  }
  attachGateEvents(gate);
}

// ─── Gate Watcher ─────────────────────────────────────────────────────────────
function checkForGates() {
  if (!isAuthenticated) return;

  // Don't re-trigger if the user already answered the gate for this exact URL
  if (gateAnsweredForHref === window.location.href) return;
  
  if (isVideoPage() && !focusGateShown && !checkoutGateShown) {
    showFocusGate();
  } else if (isCheckoutPage() && !checkoutGateShown && !focusGateShown) {
    showCheckoutGate();
  }
}

// Watch for YouTube SPA navigation
let lastHref = window.location.href;
const navObserver = new MutationObserver(() => {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href;
    // URL changed — reset all gate state so the gate can show on the new page
    focusGateShown = false;
    checkoutGateShown = false;
    gateAnsweredForHref = null;
    setTimeout(checkForGates, 800);
  }
});
if (document.body) {
  navObserver.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    navObserver.observe(document.body, { childList: true, subtree: true });
  });
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  try {
    const auth = await chrome.storage.local.get(["ls_token", "ls_user"]);
    isAuthenticated = !!(auth.ls_token && auth.ls_user);
    if (!isAuthenticated) return;

    const data = await chrome.storage.local.get(["ls_cached_tasks", "ls_cached_habits", "ls_budget_left"]);
    cachedTasks = (data.ls_cached_tasks as any[]) || [];
    cachedHabits = (data.ls_cached_habits as any[]) || [];
    budgetLeft = (data.ls_budget_left as number) ?? null;

    try {
      chrome.runtime.sendMessage({ type: "LS_GET_USAGE" }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.usage) usageData = res.usage;
        checkForGates();
      });
    } catch (_) {}
  } catch (_) {}
}

// Refresh usage periodically
const intervalId = setInterval(() => {
  if (!isAuthenticated) return;
  try {
    chrome.runtime.sendMessage({ type: "LS_GET_USAGE" }, (res) => {
      if (chrome.runtime.lastError) { clearInterval(intervalId); return; }
      if (res?.usage) usageData = res.usage;
      // Update stat cards if gate is open
      const openGate = document.getElementById("ls-focus-gate");
      if (openGate) {
        const timeEl = openGate.querySelector(".ls-gate-time");
        if (timeEl) {
          const t = formatTime(usageData[currentDomain] || 0);
          timeEl.textContent = `⏱ ${t} today on ${currentDomain}`;
        }
      }
    });
  } catch (_) { clearInterval(intervalId); }
}, 30000);

try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "LS_DATA_UPDATED") loadData();
    if (msg.type === "LS_DETOX_CHECK") checkDetoxBlock();
    if (msg.type === "LS_DETOX_ENDED") removeDetoxBlock();
  });
} catch (_) {}

// ─── Dopamine Detox Block ─────────────────────────────────────────────────────

const DETOX_SOCIAL_DOMAINS = [
  "youtube.com", "facebook.com", "instagram.com",
  "twitter.com", "x.com", "tiktok.com", "reddit.com",
];

let detoxCountdownInterval: number | null = null;

function isDetoxDomainBlocked(customSites: string[]): boolean {
  let hostname = window.location.hostname;
  if (hostname.startsWith("www.")) hostname = hostname.slice(4);

  for (const d of DETOX_SOCIAL_DOMAINS) {
    if (hostname === d || hostname.endsWith("." + d)) return true;
  }
  for (const site of customSites) {
    const clean = site.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "").toLowerCase();
    if (clean && (hostname === clean || hostname.endsWith("." + clean))) return true;
  }
  return false;
}

function buildDetoxOverlay(endTime: number): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "ls-detox-block";
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

  // Start countdown
  const timerEl = overlay.querySelector("#ls-detox-timer") as HTMLElement;
  const progressEl = overlay.querySelector("#ls-detox-progress") as HTMLElement;

  // We need the start time to calculate progress
  // Approximate: read duration from storage or just show remaining
  const updateTimer = () => {
    const now = Date.now();
    const remaining = endTime - now;
    if (remaining <= 0) {
      timerEl.textContent = "00:00:00";
      progressEl.style.width = "100%";
      removeDetoxBlock();
      return;
    }
    const totalSec = Math.ceil(remaining / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // Estimate progress (we'll use storage to get original duration)
    chrome.storage.local.get("ls_detox_duration").then(data => {
      const totalDuration = (data.ls_detox_duration as number) || (endTime - now);
      const elapsed = totalDuration - remaining;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      progressEl.style.width = `${pct}%`;
    }).catch(() => {});
  };

  updateTimer();
  detoxCountdownInterval = window.setInterval(updateTimer, 1000);

  // Hide original page content
  document.documentElement.style.overflow = "hidden";

  return overlay;
}

function removeDetoxBlock() {
  if (detoxCountdownInterval) {
    clearInterval(detoxCountdownInterval);
    detoxCountdownInterval = null;
  }
  const overlay = document.getElementById("ls-detox-block");
  if (overlay) {
    overlay.remove();
    document.documentElement.style.overflow = "";
  }
}

async function checkDetoxBlock() {
  try {
    const data = await chrome.storage.local.get(["ls_detox_active", "ls_detox_end_time", "ls_detox_custom_sites"]);
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
      // Don't double-insert
      if (!document.getElementById("ls-detox-block")) {
        const overlay = buildDetoxOverlay(data.ls_detox_end_time as number);
        if (document.body) {
          document.body.appendChild(overlay);
        } else {
          document.addEventListener("DOMContentLoaded", () => document.body.appendChild(overlay));
        }
      }
    } else {
      removeDetoxBlock();
    }
  } catch (_) {}
}

// Check detox on initial load
loadData();
checkDetoxBlock();

