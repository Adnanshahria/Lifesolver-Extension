import { useState, useEffect, useCallback } from 'react';

export interface FrictionEvent {
  type: string;
  domain: string;
  timestamp: number;
  meta?: string;
}

export interface DailyFrictionSummary {
  date: string;
  score: number;
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

function computeSummary(date: string, events: FrictionEvent[]): DailyFrictionSummary {
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
      case 'gate_shown': counts.gatesShown++; break;
      case 'gate_went_back': counts.gatesWentBack++; break;
      case 'gate_bypassed': counts.gatesBypassed++; break;
      case 'bumper_shown': counts.bumpersShown++; break;
      case 'bumper_continued': counts.bumpersContinued++; break;
      case 'pay_blocked': counts.payBlocked++; break;
      case 'feed_hidden': counts.feedHidden++; break;
      case 'journal_entry': counts.journalEntries++; break;
    }
  }

  let score = 50;
  score += Math.min(25, counts.gatesWentBack * 5);
  score -= Math.min(25, counts.gatesBypassed * 5);
  score += Math.min(15, counts.bumpersShown * 3);
  score += Math.min(10, counts.journalEntries * 2);
  score -= Math.min(15, counts.payBlocked * 3);
  score = Math.max(0, Math.min(100, score));
  if (events.length === 0) score = 0;

  return { date, score, ...counts, events };
}

export function useFrictionAnalytics() {
  const [todaySummary, setTodaySummary] = useState<DailyFrictionSummary | null>(null);
  const [weekSummaries, setWeekSummaries] = useState<DailyFrictionSummary[]>([]);
  const [streak, setStreak] = useState(0);

  const loadAnalytics = useCallback(async () => {
    const data = await chrome.storage.local.get(['ls_friction_events']);
    const allEvents: Record<string, FrictionEvent[]> = (data.ls_friction_events as Record<string, FrictionEvent[]>) || {};

    const dToday = new Date();
    const today = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`;
    const todayEvents = allEvents[today] || [];
    setTodaySummary(computeSummary(today, todayEvents));

    // Last 7 days
    const summaries: DailyFrictionSummary[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const events = allEvents[key] || [];
      summaries.push(computeSummary(key, events));
    }
    setWeekSummaries(summaries);

    // Calculate streak (consecutive days with score >= 50)
    let currentStreak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const events = allEvents[key] || [];
      if (events.length === 0 && i > 0) break; // no data — streak ends
      const summary = computeSummary(key, events);
      if (summary.score >= 50) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    setStreak(currentStreak);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    todaySummary,
    weekSummaries,
    streak,
    loadAnalytics,
  };
}
