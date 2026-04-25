import { state } from './state';
import { detectPlatform, formatTime } from './platform';
import { snapshotAndPauseAll, startGatePauseObserver, stopGatePauseObserver, restoreVideos } from './videoController';
import { recordFrictionEvent } from './frictionAnalytics';

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

// ─── Breathing Exercise (4-7-8) ──────────────────────────────────────────────
// Inhale 4s → Hold 7s → Exhale 8s = 19 seconds total

function startBreathingExercise(gate: HTMLDivElement, onComplete: () => void) {
  const qBox = gate.querySelector('#ls-q1') as HTMLElement;
  if (!qBox) { onComplete(); return; }

  // Circumference of the SVG ring (radius = 70, C = 2πr ≈ 440)
  const CIRCUMFERENCE = 440;
  const INHALE = 4, HOLD = 7, EXHALE = 8;
  const TOTAL = INHALE + HOLD + EXHALE;

  qBox.innerHTML = `
    <div id="ls-breathing-gate">
      <div class="ls-breath-instruction" id="ls-breath-text">Breathe in…</div>
      <div class="ls-breath-subtitle">Complete one 4-7-8 breathing cycle to proceed</div>

      <div class="ls-breath-circle-wrap">
        <div class="ls-breath-ring">
          <svg viewBox="0 0 160 160">
            <circle class="ls-ring-bg" cx="80" cy="80" r="70"/>
            <circle class="ls-ring-progress" id="ls-ring-prog" cx="80" cy="80" r="70"/>
          </svg>
        </div>
        <div class="ls-breath-orb" id="ls-breath-orb"></div>
        <div class="ls-breath-timer" id="ls-breath-countdown">${TOTAL}</div>
      </div>
    </div>
  `;

  const orb = gate.querySelector('#ls-breath-orb') as HTMLElement;
  const text = gate.querySelector('#ls-breath-text') as HTMLElement;
  const ring = gate.querySelector('#ls-ring-prog') as SVGCircleElement;
  const countdown = gate.querySelector('#ls-breath-countdown') as HTMLElement;
  if (!orb || !text || !ring || !countdown) { onComplete(); return; }

  let elapsed = 0;
  let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';

  // Start inhale immediately
  orb.className = 'ls-breath-orb ls-inhale';
  text.textContent = 'Breathe in…';
  ring.classList.add('ls-phase-inhale');

  const interval = setInterval(() => {
    elapsed++;
    const remaining = TOTAL - elapsed;
    countdown.textContent = remaining.toString();

    // Update ring progress
    const progress = elapsed / TOTAL;
    const offset = CIRCUMFERENCE * (1 - progress);
    ring.style.strokeDashoffset = offset.toString();

    // Phase transitions
    if (elapsed === INHALE && phase === 'inhale') {
      phase = 'hold';
      orb.className = 'ls-breath-orb ls-hold';
      text.textContent = 'Hold…';
      ring.classList.remove('ls-phase-inhale');
      ring.classList.add('ls-phase-hold');
    } else if (elapsed === INHALE + HOLD && phase === 'hold') {
      phase = 'exhale';
      orb.className = 'ls-breath-orb ls-exhale';
      text.textContent = 'Breathe out…';
      ring.classList.remove('ls-phase-hold');
      ring.classList.add('ls-phase-exhale');
    }

    if (elapsed >= TOTAL) {
      clearInterval(interval);
      text.textContent = '✓ Mindful moment complete';
      orb.className = 'ls-breath-orb ls-breath-complete';
      countdown.textContent = '✓';
      setTimeout(onComplete, 800);
    }
  }, 1000);
}

// ─── Journal Prompt ──────────────────────────────────────────────────────────

function showJournalPrompt(gate: HTMLDivElement, onDone: () => void) {
  const questionsContainer = gate.querySelector('#ls-questions') as HTMLElement;
  if (!questionsContainer) { onDone(); return; }

  const journalDiv = document.createElement('div');
  journalDiv.id = 'ls-journal-prompt';
  journalDiv.innerHTML = `
    <div class="ls-question" style="border-color: rgba(56, 189, 248, 0.15);">
      <div class="ls-journal-label">
        <span style="font-size: 18px;">📝</span>
        Why are you here? (one honest sentence)
      </div>
      <textarea
        class="ls-journal-textarea"
        id="ls-journal-input"
        placeholder="e.g. I'm stressed and avoiding my assignment…"
        maxlength="300"
      ></textarea>
      <div class="ls-journal-actions">
        <button class="ls-journal-skip" id="ls-journal-skip">Skip</button>
        <button class="ls-journal-submit" id="ls-journal-save">Save & Continue</button>
      </div>
    </div>
  `;
  questionsContainer.appendChild(journalDiv);

  // Focus the textarea
  setTimeout(() => {
    const textarea = gate.querySelector('#ls-journal-input') as HTMLTextAreaElement;
    textarea?.focus();
  }, 400);

  // Save handler
  gate.querySelector('#ls-journal-save')?.addEventListener('click', async () => {
    const textarea = gate.querySelector('#ls-journal-input') as HTMLTextAreaElement;
    const text = textarea?.value?.trim();
    if (text) {
      // Store journal entry
      const entry = {
        text,
        domain: state.currentDomain || window.location.hostname,
        timestamp: Date.now(),
      };
      const data = await chrome.storage.local.get(['ls_journal_entries']);
      const entries = (data.ls_journal_entries as any[]) || [];
      entries.push(entry);
      // Keep last 100
      if (entries.length > 100) entries.splice(0, entries.length - 100);
      await chrome.storage.local.set({ ls_journal_entries: entries });

      // Record analytics event
      recordFrictionEvent('journal_entry', state.currentDomain, text);
    }
    onDone();
  });

  // Skip handler
  gate.querySelector('#ls-journal-skip')?.addEventListener('click', () => {
    onDone();
  });
}

// ─── Advance Question Logic ──────────────────────────────────────────────────
function advanceQuestion(gate: HTMLDivElement, currentQ: number, val: string) {
  if (currentQ === 1) {
    if (val === 'yes') {
      // Record analytics: bypassed
      recordFrictionEvent('gate_bypassed', state.currentDomain);

      // If temporal friction is on, start breathing exercise instead of just a timer
      if (state.frictionSettings.temporal) {
        startBreathingExercise(gate, () => {
          // After breathing, show journal prompt
          showJournalPrompt(gate, () => {
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
            // Remove journal div if still present
            gate.querySelector('#ls-journal-prompt')?.remove();
            setTimeout(removeFocusGate, 1200);
          });
        });
      } else {
        // No temporal friction: just show journal then proceed
        showJournalPrompt(gate, () => {
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
          gate.querySelector('#ls-journal-prompt')?.remove();
          setTimeout(removeFocusGate, 1200);
        });
      }
    } else {
      // User said "No, just scrolling" → record went_back
      recordFrictionEvent('gate_went_back', state.currentDomain);

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
  // No longer need timer countdown — breathing exercise replaces it
  const yesBtn = gate.querySelector('#ls-focus-yes-btn') as HTMLButtonElement | null;

  // Remove the old timer text from the button
  if (yesBtn) {
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

  // Record analytics: gate shown
  recordFrictionEvent('gate_shown', state.currentDomain);

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
