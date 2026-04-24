import "./content.css";

// ─── State ───────────────────────────────────────────────────────────────────
let cachedTasks: any[] = [];
let cachedHabits: any[] = [];
let usageData: Record<string, number> = {};
let currentDomain = "";
let isAuthenticated = false;
let focusGateShown = false;
let enforcePauseInterval: number | null = null;

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
}

function advanceQuestion(gate: HTMLDivElement, currentQ: number, val: string) {
  if (currentQ === 1) {
    if (val === "yes") {
      removeFocusGate();
    } else {
      showFinalActions(gate, true);
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

function removeFocusGate() {
  if (enforcePauseInterval) {
    clearInterval(enforcePauseInterval);
    enforcePauseInterval = null;
  }
  
  const existing = document.getElementById("ls-focus-gate");
  if (existing) {
    existing.classList.add("ls-gate-exit");
    setTimeout(() => existing.remove(), 350);
  }
  focusGateShown = false;

  // Resume all videos
  document.querySelectorAll("video").forEach(v => {
    if (v.paused) v.play().catch(() => {});
  });
}

function showFocusGate() {
  if (focusGateShown) return;
  focusGateShown = true;

  // Aggressively pause all videos
  enforcePauseInterval = window.setInterval(() => {
    document.querySelectorAll("video").forEach(v => {
      if (!v.paused) v.pause();
    });
  }, 300);

  const gate = buildFocusGate();
  if (document.body) {
    document.body.appendChild(gate);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(gate));
  }
  attachGateEvents(gate);
}

// ─── Video page watcher ───────────────────────────────────────────────────────
function checkForVideoPage() {
  if (!isAuthenticated) return;
  if (isVideoPage() && !focusGateShown) {
    showFocusGate();
  }
}

// Watch for YouTube SPA navigation
let lastHref = window.location.href;
const navObserver = new MutationObserver(() => {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href;
    focusGateShown = false;
    setTimeout(checkForVideoPage, 800);
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

    const data = await chrome.storage.local.get(["ls_cached_tasks", "ls_cached_habits"]);
    cachedTasks = (data.ls_cached_tasks as any[]) || [];
    cachedHabits = (data.ls_cached_habits as any[]) || [];

    try {
      chrome.runtime.sendMessage({ type: "LS_GET_USAGE" }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.usage) usageData = res.usage;
        checkForVideoPage();
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
  });
} catch (_) {}

loadData();
