import { Activity } from 'lucide-react';

interface HabitsCardProps {
  pendingHabits: any[];
}

export function HabitsCard({ pendingHabits }: HabitsCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl font-lists">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
          <Activity size={12} className="text-cyan-400" /> Habits
        </h3>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white">
          {pendingHabits.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-hide pr-1">
        {pendingHabits.length === 0 ? (
          <p className="text-center text-[10px] text-white/30 mt-4">All complete.</p>
        ) : (
          pendingHabits.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-1.5">
              <span className="truncate text-[11px] text-white/70">{h.habit_name}</span>
              <span className="ml-2 flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                🔥 {h.streak_count}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
