// ─── Friction Analytics Engine ───────────────────────────────────────────────
// Tracks every friction event so we can compute a daily "Friction Score" and
// surface a recap to the user.

export interface FrictionEvent {
  type:
    | 'gate_shown'
    | 'gate_went_back'
    | 'gate_bypassed'
    | 'bumper_shown'
    | 'bumper_continued'
    | 'pay_blocked'
    | 'feed_hidden'
    | 'journal_entry';
  domain: string;
  timestamp: number;
  meta?: string; // optional extra context (e.g. journal text)
}

export interface DailyFrictionSummary {
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  gatesShown: number;
  gatesWentBack: number;
  gatesBypassed: number;
  bumpersShown: number;
  bumpersContinued: number;
  payBlocked: number;
  feedHidden: number;
  journalEntries: number;
  events: FrictionEvent[];
}

const STORAGE_KEY = 'ls_friction_events';
const SCORE_KEY = 'ls_friction_score';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Record a friction event ────────────────────────────────────────────────

export async function recordFrictionEvent(
  type: FrictionEvent['type'],
  domain: string,
  meta?: string,
): Promise<void> {
  const event: FrictionEvent = { type, domain, timestamp: Date.now(), meta };

  const data = await chrome.storage.local.get([STORAGE_KEY]);
  const allEvents: Record<string, FrictionEvent[]> = (data[STORAGE_KEY] as Record<string, FrictionEvent[]>) || {};

  const key = todayKey();
  if (!allEvents[key]) allEvents[key] = [];
  allEvents[key].push(event);

  // Keep only last 14 days of events
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffKey = cutoff.toISOString().split('T')[0];
  for (const dateKey of Object.keys(allEvents)) {
    if (dateKey < cutoffKey) delete allEvents[dateKey];
  }

  // Compute and store today's score
  const todaySummary = computeSummary(key, allEvents[key] || []);

  await chrome.storage.local.set({
    [STORAGE_KEY]: allEvents,
    [SCORE_KEY]: todaySummary.score,
  });
}

// ─── Compute daily summary ──────────────────────────────────────────────────

export function computeSummary(date: string, events: FrictionEvent[]): DailyFrictionSummary {
  const counts = {
    gatesShown: 0,
    gatesWentBack: 0,
    gatesBypassed: 0,
    bumpersShown: 0,
    bumpersContinued: 0,
    payBlocked: 0,
    feedHidden: 0,
    journalEntries: 0,
  };

  for (const e of events) {
    switch (e.type) {
      case 'gate_shown':
        counts.gatesShown++;
        break;
      case 'gate_went_back':
        counts.gatesWentBack++;
        break;
      case 'gate_bypassed':
        counts.gatesBypassed++;
        break;
      case 'bumper_shown':
        counts.bumpersShown++;
        break;
      case 'bumper_continued':
        counts.bumpersContinued++;
        break;
      case 'pay_blocked':
        counts.payBlocked++;
        break;
      case 'feed_hidden':
        counts.feedHidden++;
        break;
      case 'journal_entry':
        counts.journalEntries++;
        break;
    }
  }

  // Score algorithm:
  // Base: 50 points (you showed up)
  // +5 per gate where user went back (max +25)
  // -5 per gate bypassed without going back (max -25)
  // +3 per bumper acknowledged (max +15)
  // +2 per journal entry (max +10)
  // -3 per pay-to-play block (means you ran out of credits)
  // Clamp to 0-100

  let score = 50;
  score += Math.min(25, counts.gatesWentBack * 5);
  score -= Math.min(25, counts.gatesBypassed * 5);
  score += Math.min(15, counts.bumpersShown * 3);
  score += Math.min(10, counts.journalEntries * 2);
  score -= Math.min(15, counts.payBlocked * 3);
  score = Math.max(0, Math.min(100, score));

  // If no friction events at all, score is 0 (no data)
  if (events.length === 0) score = 0;

  return {
    date,
    score,
    ...counts,
    events,
  };
}

// ─── Get all summaries (for popup) ──────────────────────────────────────────

export async function getAllSummaries(): Promise<DailyFrictionSummary[]> {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  const allEvents: Record<string, FrictionEvent[]> = (data[STORAGE_KEY] as Record<string, FrictionEvent[]>) || {};

  return Object.entries(allEvents)
    .map(([date, events]) => computeSummary(date, events))
    .sort((a, b) => b.date.localeCompare(a.date));
}
