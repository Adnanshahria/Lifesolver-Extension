import { useState } from 'react';
import { Zap, TrendingUp, BookOpen } from 'lucide-react';
import type { useFriction } from '../../hooks/useFriction';
import type { useFrictionAnalytics } from '../../hooks/useFrictionAnalytics';
import type { useJournal } from '../../hooks/useJournal';

type FrictionHook = ReturnType<typeof useFriction>;
type AnalyticsHook = ReturnType<typeof useFrictionAnalytics>;
type JournalHook = ReturnType<typeof useJournal>;

interface GrowthTabProps {
  friction: FrictionHook;
  analytics: AnalyticsHook;
  journal: JournalHook;
}

// ─── Friction Score Ring (SVG) ───────────────────────────────────────────────
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size > 60 ? 20 : 14} fontWeight={800}
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Mini bar for weekly chart ───────────────────────────────────────────────
function WeekBar({ score, label, isToday }: { score: number; label: string; isToday: boolean }) {
  const height = Math.max(4, (score / 100) * 36);
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : score > 0 ? '#f87171' : 'rgba(255,255,255,0.08)';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[40px] w-3 flex items-end">
        <div
          className="w-full rounded-full"
          style={{
            height: `${height}px`,
            backgroundColor: color,
            transition: 'height 0.6s ease',
            boxShadow: score > 0 ? `0 0 8px ${color}40` : 'none',
          }}
        />
      </div>
      <span className={`text-[8px] font-bold tracking-wider uppercase ${isToday ? 'text-cyan-400' : 'text-white/30'}`}>
        {label}
      </span>
    </div>
  );
}

export function GrowthTab({ friction, analytics, journal }: GrowthTabProps) {
  const [section, setSection] = useState<'controls' | 'journal'>('controls');

  const items = [
    {
      id: 'feed',
      title: 'Feed Hide (Eradicator)',
      desc: 'Hides the central home feed on Facebook, YouTube, and X to prevent mindless scrolling.',
      icon: '🙈',
      state: friction.feedHide,
      setter: friction.setFeedHide,
      key: 'ls_friction_feedhide',
    },
    {
      id: 'visual',
      title: 'Visual Friction (Dopamine Drain)',
      desc: 'Gradually turns social media sites grayscale over 5 minutes to reduce dopamine.',
      icon: '👁️',
      state: friction.visualFriction,
      setter: friction.setVisualFriction,
      key: 'ls_friction_visual',
    },
    {
      id: 'pay',
      title: 'Task-Driven Friction (Pay-to-Play)',
      desc: 'Costs 1 Focus Credit per minute to browse social sites. Earn credits by completing tasks.',
      icon: '💎',
      state: friction.payToPlay,
      setter: friction.setPayToPlay,
      key: 'ls_friction_pay',
    },
    {
      id: 'bumper',
      title: 'Doom-Scroll Bumper',
      desc: 'Freezes the page every 4 screen heights to break mindless scrolling loops.',
      icon: '🚧',
      state: friction.doomBumper,
      setter: friction.setDoomBumper,
      key: 'ls_friction_bumper',
    },
    {
      id: 'scroll',
      title: 'Heavy Scroll',
      desc: 'Makes scrolling physically harder and 60% slower on addictive sites.',
      icon: '⚓',
      state: friction.heavyScroll,
      setter: friction.setHeavyScroll,
      key: 'ls_friction_scroll',
    },
    {
      id: 'cognitive',
      title: 'Cognitive Bypass',
      desc: 'Requires typing a full sentence to temporarily unlock blocked adult content.',
      icon: '🧠',
      state: friction.cognitiveBypass,
      setter: friction.setCognitiveBypass,
      key: 'ls_friction_cognitive',
    },
    {
      id: 'temporal',
      title: 'Breathing Gate',
      desc: 'Requires a 4-7-8 breathing exercise (19s) before accessing content through Focus Gates.',
      icon: '🧘',
      state: friction.temporalFriction,
      setter: friction.setTemporalFriction,
      key: 'ls_friction_temporal',
    },
  ];

  const today = analytics.todaySummary;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 pb-4">

      {/* ── Friction Score Hero Card ────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <ScoreRing score={today?.score ?? 0} />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white/90">Friction Score</h2>
            <p className="text-[10px] text-white/40 mt-0.5">
              {today && today.score >= 70
                ? "You're resisting autopilot. Keep it up."
                : today && today.score >= 40
                ? 'Decent awareness. Room to improve.'
                : today && today.events.length > 0
                ? 'Autopilot is winning. Engage your friction.'
                : 'No friction data yet today.'}
            </p>
            {/* Streak badge */}
            {analytics.streak > 0 && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5">
                <span className="text-[10px]">🔥</span>
                <span className="text-[9px] font-bold text-amber-400">{analytics.streak} day streak</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's stats row */}
        {today && today.events.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5">
            <div className="text-center">
              <div className="text-xs font-bold text-cyan-400">{today.gatesShown}</div>
              <div className="text-[8px] text-white/30 uppercase">Gates</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-emerald-400">{today.gatesWentBack}</div>
              <div className="text-[8px] text-white/30 uppercase">Went Back</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-rose-400">{today.gatesBypassed}</div>
              <div className="text-[8px] text-white/30 uppercase">Bypassed</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-purple-400">{today.journalEntries}</div>
              <div className="text-[8px] text-white/30 uppercase">Journals</div>
            </div>
          </div>
        )}

        {/* Weekly chart */}
        <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/5 px-1">
          {analytics.weekSummaries.slice().reverse().map((s, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return (
              <WeekBar
                key={s.date}
                score={s.score}
                label={dayLabels[d.getDay()]}
                isToday={i === 6}
              />
            );
          })}
        </div>
      </div>

      {/* ── Header Row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20">
            <Zap size={20} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">Growth Hacker</h2>
            <p className="text-[10px] text-white/40">Advanced Intentional Friction</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-400">{friction.focusCredits}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wide">Focus Credits</div>
          <button
            onClick={() => {
              const newCredits = friction.focusCredits + 15;
              friction.setFocusCredits(newCredits);
              chrome.storage.local.set({ ls_focus_credits: newCredits });
            }}
            className="mt-1 text-[8px] font-bold border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-full hover:bg-amber-500/10 transition-colors"
          >
            Demo: Earn +15
          </button>
        </div>
      </div>

      {/* ── Section Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/5">
        <button
          onClick={() => setSection('controls')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            section === 'controls'
              ? 'bg-white/10 text-white/90 shadow-lg shadow-white/5'
              : 'text-white/30 hover:text-white/50'
          }`}
        >
          <TrendingUp size={12} />
          Controls
        </button>
        <button
          onClick={() => setSection('journal')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            section === 'journal'
              ? 'bg-white/10 text-white/90 shadow-lg shadow-white/5'
              : 'text-white/30 hover:text-white/50'
          }`}
        >
          <BookOpen size={12} />
          Journal ({journal.entries.length})
        </button>
      </div>

      {/* ── Controls Section ───────────────────────────────────────────── */}
      {section === 'controls' && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl flex items-center justify-between">
              <div className="flex gap-3 items-center pr-4">
                <div className="text-xl">{item.icon}</div>
                <div>
                  <h3 className="text-[11px] font-semibold text-white/90">{item.title}</h3>
                  <p className="mt-0.5 text-[9px] text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={item.state}
                  onChange={(e) => friction.updateFriction(item.key, e.target.checked, item.setter)}
                />
                <div className="peer h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/70 after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:translate-x-full peer-checked:after:bg-white peer-focus:outline-none"></div>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* ── Journal Section ────────────────────────────────────────────── */}
      {section === 'journal' && (
        <div className="space-y-3">
          {journal.entries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-sm font-semibold text-white/70">No reflections yet</h3>
              <p className="text-[10px] text-white/30 mt-1 max-w-[250px] mx-auto leading-relaxed">
                When you bypass a Focus Gate, you'll be asked "Why are you here?" — your answers will appear here.
              </p>
            </div>
          ) : (
            Object.entries(journal.groupedByDate).map(([date, entries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{date}</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/80 leading-relaxed italic">"{entry.text}"</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[8px] text-white/25 font-medium">
                              {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            <span className="text-[8px] text-cyan-500/60 font-semibold">{entry.domain}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
