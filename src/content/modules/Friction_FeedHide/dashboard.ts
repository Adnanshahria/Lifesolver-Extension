import { state } from '../state';
import { findFeedContainer, formatTime } from '../platform';
import { recordFrictionEvent } from '../frictionAnalytics';

export const dashboardId = 'ls-feed-dashboard';

export function injectDashboard() {
  let dashboardEl = document.getElementById(dashboardId);
  if (dashboardEl) return;

  const container = findFeedContainer();
  if (!container) return;

  container.classList.add('ls-feed-container');

  const dashboard = document.createElement('div');
  dashboard.id = dashboardId;
  const shadow = dashboard.attachShadow({ mode: 'open' });

  const usage = state.cachedUsage || {};
  const totalWasted = Object.values(usage).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
  
  const finance = state.cachedFinance || [];
  const netWorth = finance.reduce(
    (acc, curr) => (curr?.type === 'income' ? acc + (curr.amount || 0) : acc - (curr.amount || 0)),
    0,
  );

  shadow.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400..800&family=Outfit:wght@100..900&family=Plus+Jakarta+Sans:wght@200..800&display=swap');

      :host {
        display: block;
        width: 100%;
        max-width: 700px;
        margin: 40px auto;
        padding: 24px;
        position: relative;
        z-index: 9999;
      }
      #ls-feed-dashboard {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: rgba(9, 9, 11, 0.95);
        backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 40px;
        color: #f1f5f9;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .quote {
        font-family: 'EB Garamond', serif;
        font-size: 42px;
        font-weight: 800;
        color: #f43f5e;
        line-height: 1.1;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: -0.02em;
      }
      .sub-quote {
        font-size: 15px;
        color: #94a3b8;
        margin-bottom: 32px;
        font-weight: 500;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 40px;
      }
      .stat-card {
        font-family: 'Outfit', sans-serif;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 20px;
        border-radius: 16px;
        text-align: center;
      }
      .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
      .card-value { font-size: 20px; font-weight: 700; color: #f1f5f9; }
      .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #06b6d4; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
      .item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
      .dot { width: 6px; height: 6px; border-radius: 50%; }
      .item-text { font-size: 13px; font-weight: 500; color: #cbd5e1; }
      .item-meta { font-size: 11px; color: #64748b; margin-left: auto; }
    </style>
    
    <div id="ls-feed-dashboard">
      <div class="quote">To Shine expect the pain</div>
      <div class="sub-quote">LifeSolver has eradicated your feed. Time to get back to work.</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="card-label">Wasted Today</div>
          <div class="card-value">${formatTime(totalWasted)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-inner">
            <div class="card-label">Net Worth</div>
            <div class="card-value">৳${netWorth.toLocaleString()}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-label">Budget Left</div>
          <div class="card-value">৳${(state.budgetLeft || 0).toLocaleString()}</div>
        </div>
      </div>

      <div class="sections">
        <div class="list-container">
          <div class="section-title">Pending Tasks</div>
          ${state.cachedTasks.filter(t => !t.completed).slice(0, 4).map(t => `
            <div class="item">
              <div class="dot" style="background: ${t.priority === 'urgent' ? '#f43f5e' : t.priority === 'high' ? '#f59e0b' : '#10b981'}"></div>
              <div class="item-text">${t.title}</div>
            </div>
          `).join('') || '<div class="item-text" style="opacity: 0.3">No pending tasks</div>'}
        </div>
        <div class="list-container">
          <div class="section-title">Active Habits</div>
          ${(state.cachedHabits || [])
            .filter(h => h.last_completed_date !== new Date().toISOString().split('T')[0])
            .slice(0, 4)
            .map(h => `
            <div class="item">
              <div class="dot" style="background: #06b6d4"></div>
              <div class="item-text">${h.title}</div>
              <div class="item-meta">${h.streak_count || 0}d</div>
            </div>
          `).join('') || '<div class="item-text" style="opacity: 0.3">No active habits</div>'}
        </div>
      </div>
    </div>
  `;

  container.prepend(dashboard);
  recordFrictionEvent('feed_hidden', state.currentDomain);
}

export function removeDashboard() {
  const dashboardEl = document.getElementById(dashboardId);
  if (dashboardEl) dashboardEl.remove();

  const containers = document.querySelectorAll('.ls-feed-container');
  containers.forEach(c => c.classList.remove('ls-feed-container'));
}
