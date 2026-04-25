import { state } from './state';
import { attachGateEvents } from './focusGate';

// ─── Build Checkout Gate Modal ───────────────────────────────────────────────
function buildCheckoutGate(): HTMLDivElement {
  const hostname = window.location.hostname;
  const merchantName = hostname.replace(/^www\./, '').split('.')[0];
  const budgetStr = state.budgetLeft !== null ? `৳${state.budgetLeft.toLocaleString()}` : 'Not set';
  const isOverBudget = state.budgetLeft !== null && state.budgetLeft < 0;

  let budgetPct = 0;
  if (state.budgetLeft !== null) {
    budgetPct = isOverBudget ? 100 : 65;
  }

  const gate = document.createElement('div');
  gate.id = 'ls-focus-gate';
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

// ─── Show Checkout Gate ──────────────────────────────────────────────────────
export function showCheckoutGate() {
  if (state.checkoutGateShown || state.focusGateShown) return;
  state.checkoutGateShown = true;

  const gate = buildCheckoutGate();
  if (document.body) {
    document.body.appendChild(gate);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(gate));
  }
  attachGateEvents(gate);
}
