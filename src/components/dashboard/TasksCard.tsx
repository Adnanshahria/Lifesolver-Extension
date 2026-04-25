import { CheckSquare } from 'lucide-react';

interface TasksCardProps {
  pendingTasks: any[];
}

export function TasksCard({ pendingTasks }: TasksCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl font-lists">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
          <CheckSquare size={12} className="text-cyan-400" /> Pending Tasks
        </h3>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white">
          {pendingTasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-hide pr-1">
        {pendingTasks.length === 0 ? (
          <p className="text-center text-[10px] text-white/30 mt-4">All clear.</p>
        ) : (
          pendingTasks.slice(0, 5).map((t, i) => (
            <div
              key={i}
              className="group flex items-start gap-2 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/[0.02] p-1.5 transition-colors"
            >
              <div
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full shadow-sm ${t.priority === 'urgent' ? 'bg-rose-500 shadow-rose-500/50' : t.priority === 'high' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}
              />
              <span className="truncate text-[11px] text-white/70 group-hover:text-white leading-tight">{t.title}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
