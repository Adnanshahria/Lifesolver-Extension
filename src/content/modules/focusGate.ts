import { state } from './state';
import { detectPlatform, formatTime } from './platform';
import { snapshotAndPauseAll, startGatePauseObserver, stopGatePauseObserver, restoreVideos } from './videoController';

// ─── Answer state ─────────────────────────────────────────────────────────────
const answers: Record<string, string> = {};
let enforcePauseInterval: number | null = null;

// ─── Remove Focus Gate ────────────────────────────────────────────────────────
export function removeFocusGate() {
  state.gateIsOpen = false;

  if (enforcePauseInterval) {
    clearInterval(enforcePauseInterval);
    enforcePauseInterval = null;
  }
  stopGatePauseObserver();

  const existing = document.getElementById('ls-focus-gate');
  if (existing) {
    existing.classList.add('ls-gate-exit');
    setTimeout(() => existing.remove(), 350);
  }

  state.gateAnsweredForHref = window.location.href;
  restoreVideos();
}

// ─── Build Focus Gate Modal ───────────────────────────────────────────────────
function buildFocusGate(): HTMLDivElement {
  const platform = detectPlatform() || state.currentDomain;
  const timeStr = formatTime(state.usageData[platform] || 0);
  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = state.cachedTasks.filter((t: any) => t.status !== 'done');
  const pendingHabits = state.cachedHabits.filter((h: any) => h.last_completed_date !== today);

  const gate = document.createElement('div');
  gate.id = 'ls-focus-gate';
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
            <button class="ls-choice" data-q="1" data-val="yes" id="ls-focus-yes-btn">
              <span class="ls-choice-icon">✓</span> Yes, I genuinely need it (<span id="ls-focus-timer">10</span>s)
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

// ─── Advance Question Logic ──────────────────────────────────────────────────
function advanceQuestion(gate: HTMLDivElement, currentQ: number, val: string) {
  if (currentQ === 1) {
    if (val === 'yes') {
      const qBox = gate.querySelector('#ls-q1') as HTMLElement;
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
      showFinalActions(gate, true);
      const qBox = gate.querySelector('#ls-q1') as HTMLElement;
      if (qBox) {
        qBox.style.opacity = '0.5';
        qBox.style.pointerEvents = 'none';
      }
    }
  }
}

function showFinalActions(_gate: HTMLDivElement, suggestBack: boolean) {
  const actions = _gate.querySelector('#ls-gate-actions') as HTMLElement | null;
  if (!actions) return;
  actions.classList.remove('ls-q-hidden');

  if (suggestBack) {
    const back = _gate.querySelector('#ls-goback') as HTMLElement | null;
    if (back) {
      back.classList.add('ls-btn-back-highlight');
    }
  }

  setTimeout(() => actions.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

// ─── Attach Gate Events ──────────────────────────────────────────────────────
export function attachGateEvents(gate: HTMLDivElement) {
  const yesBtn = gate.querySelector('#ls-focus-yes-btn') as HTMLButtonElement | null;
  const timerSpan = gate.querySelector('#ls-focus-timer') as HTMLSpanElement | null;

  if (state.frictionSettings.temporal && yesBtn && timerSpan) {
    yesBtn.style.pointerEvents = 'none';
    yesBtn.style.opacity = '0.5';
    let secondsLeft = 10;
    const interval = setInterval(() => {
      secondsLeft--;
      if (!document.body.contains(gate)) {
        clearInterval(interval);
        return;
      }
      if (secondsLeft <= 0) {
        clearInterval(interval);
        if (timerSpan) timerSpan.textContent = '0';
        yesBtn.style.pointerEvents = 'auto';
        yesBtn.style.opacity = '1';
        yesBtn.innerHTML = `<span class="ls-choice-icon">✓</span> Yes, I genuinely need it`;
      } else {
        if (timerSpan) timerSpan.textContent = secondsLeft.toString();
      }
    }, 1000);
  } else if (yesBtn && timerSpan) {
    yesBtn.innerHTML = `<span class="ls-choice-icon">✓</span> Yes, I genuinely need it`;
  }

  gate.querySelectorAll('.ls-choice').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = btn as HTMLButtonElement;
      const q = el.dataset.q!;
      const val = el.dataset.val!;

      gate.querySelectorAll(`.ls-choice[data-q="${q}"]`).forEach((b) => b.classList.remove('ls-choice-selected'));
      el.classList.add('ls-choice-selected');
      answers[q] = val;

      setTimeout(() => advanceQuestion(gate, parseInt(q), val), 350);
    });
  });

  gate.querySelector('#ls-goback')?.addEventListener('click', () => {
    removeFocusGate();
    if (window.history.length > 1 && document.referrer) {
      history.back();
    } else {
      chrome.runtime.sendMessage({ type: 'LS_CLOSE_TAB' });
    }
  });

  gate.querySelector('#ls-proceed-purchase')?.addEventListener('click', () => {
    removeFocusGate();
  });
}

// ─── Show Focus Gate ─────────────────────────────────────────────────────────
export function showFocusGate() {
  if (state.focusGateShown || state.checkoutGateShown) return;
  state.focusGateShown = true;
  state.gateIsOpen = true;

  snapshotAndPauseAll();
  startGatePauseObserver();

  const gate = buildFocusGate();
  if (document.body) {
    document.body.appendChild(gate);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(gate));
  }
  attachGateEvents(gate);
}
