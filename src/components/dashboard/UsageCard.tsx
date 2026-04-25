import { Globe, BarChart2, Trash2 } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

interface UsageCardProps {
  usage: Record<string, number>;
  hourlyUsage: Record<string, number>;
  totalSpentMs: number;
  peakHour: number | null;
  showGraph: boolean;
  setShowGraph: (v: boolean) => void;
  hiddenDomains: string[];
  onHideDomain: (domain: string) => void;
}

export function UsageCard({
  usage,
  hourlyUsage,
  totalSpentMs,
  peakHour,
  showGraph,
  setShowGraph,
  hiddenDomains,
  onHideDomain,
}: UsageCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl font-stats shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
          <Globe size={12} className="text-cyan-400" /> Digital Footprint
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-white/70">Total: {formatTime(totalSpentMs)}</span>
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`rounded bg-white/5 p-1 transition-colors hover:bg-white/10 ${showGraph ? 'text-cyan-400' : 'text-white/50'}`}
          >
            <BarChart2 size={12} />
          </button>
        </div>
      </div>

      {showGraph ? (
        <div className="flex flex-col gap-2">
          <div className="flex h-[60px] items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.01] p-1.5">
            {Array.from({ length: 24 }).map((_, i) => {
              const val = hourlyUsage[i] || 0;
              const maxHourly = Math.max(1, ...Object.values(hourlyUsage));
              const heightPct = Math.min(100, (val / maxHourly) * 100);
              return (
                <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600/50 to-indigo-500 transition-all hover:brightness-125"
                    style={{ height: `${Math.max(4, heightPct)}%`, opacity: val > 0 ? 1 : 0.2 }}
                  />
                  {val > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded bg-[#09090b] border border-white/10 px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap">
                      {i}:00 - {formatTime(val)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {peakHour !== null ? (
            <p className="text-center text-[9px] text-white/40">Peak usage around {peakHour}:00</p>
          ) : (
            <p className="text-center text-[9px] text-white/40">No significant usage yet.</p>
          )}
        </div>
      ) : Object.keys(usage).length === 0 ? (
        <div className="flex h-12 items-center justify-center rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-white/30">Zero distractions tracked.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[80px] overflow-y-auto pr-2 scrollbar-hide">
          {Object.entries(usage)
            .filter(([domain]) => !hiddenDomains.includes(domain))
            .sort((a, b) => b[1] - a[1])
            .map(([domain, ms]) => (
              <div key={domain} className="group flex items-center gap-2">
                <span className="w-16 truncate text-[10px] text-white/60 group-hover:text-white/90 transition-colors">
                  {domain.replace('.com', '')}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${Math.min((ms / 3600000) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right text-[10px] font-medium tabular-nums text-white/80">
                  {formatTime(ms)}
                </span>
                <button
                  onClick={() => onHideDomain(domain)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-white/30 hover:text-rose-500 transition-all shrink-0"
                  title="Hide from view (time is still counted in total)"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
