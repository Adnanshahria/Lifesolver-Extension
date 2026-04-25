import { Shield, Clock, Zap, Plus, X } from 'lucide-react';
import { DETOX_PRESETS, BUILTIN_BLOCKED } from '../../hooks/useDetox';
import { PornBlockerToggle } from './PornBlockerToggle';

interface DetoxSetupProps {
  detoxSelectedPreset: string | null;
  setDetoxSelectedPreset: (v: string | null) => void;
  detoxCustomMinutes: string;
  setDetoxCustomMinutes: (v: string) => void;
  detoxCustomSites: string[];
  detoxNewSite: string;
  setDetoxNewSite: (v: string) => void;
  onAddCustomSite: () => void;
  onRemoveCustomSite: (site: string) => void;
  onStartDetox: () => void;
  pornBlockerActive: boolean;
  onTogglePornBlocker: () => void;
}

export function DetoxSetup({
  detoxSelectedPreset,
  setDetoxSelectedPreset,
  detoxCustomMinutes,
  setDetoxCustomMinutes,
  detoxCustomSites,
  detoxNewSite,
  setDetoxNewSite,
  onAddCustomSite,
  onRemoveCustomSite,
  onStartDetox,
  pornBlockerActive,
  onTogglePornBlocker,
}: DetoxSetupProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
          <Shield size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/90">Dopamine Detox</h2>
          <p className="text-[10px] text-white/40">Block distractions. Reclaim focus.</p>
        </div>
      </div>

      {/* Duration Picker */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase mb-3">
          <Clock size={12} className="text-purple-400" /> Duration
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {DETOX_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setDetoxSelectedPreset(p.label);
                setDetoxCustomMinutes('');
              }}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                detoxSelectedPreset === p.label
                  ? 'border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setDetoxSelectedPreset('custom')}
            className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
              detoxSelectedPreset === 'custom'
                ? 'border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
            }`}
          >
            Custom
          </button>
        </div>
        {detoxSelectedPreset === 'custom' && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min="1"
              placeholder="Minutes"
              value={detoxCustomMinutes}
              onChange={(e) => setDetoxCustomMinutes(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
            />
            <span className="text-[10px] text-white/40">min</span>
          </div>
        )}
      </div>

      {/* Blocked Sites */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase mb-3">
          <Zap size={12} className="text-purple-400" /> Blocked Sites
        </h3>

        {/* Built-in badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BUILTIN_BLOCKED.map((d) => (
            <span
              key={d}
              className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[9px] font-medium text-purple-300"
            >
              {d.replace('.com', '')}
            </span>
          ))}
        </div>

        {/* Custom sites */}
        {detoxCustomSites.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {detoxCustomSites.map((site) => (
              <div key={site} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                <span className="text-[11px] text-white/70">{site}</span>
                <button
                  onClick={() => onRemoveCustomSite(site)}
                  className="rounded p-0.5 text-white/30 hover:text-rose-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new site */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add domain (e.g. netflix.com)"
            value={detoxNewSite}
            onChange={(e) => setDetoxNewSite(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddCustomSite()}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
          />
          <button
            onClick={onAddCustomSite}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/30 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStartDetox}
        disabled={!detoxSelectedPreset || (detoxSelectedPreset === 'custom' && !detoxCustomMinutes)}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
      >
        <div className="flex h-full w-full items-center justify-center gap-2 rounded-2xl bg-[#09090b] py-3.5 transition-colors group-hover:bg-transparent">
          <Shield size={16} className="text-purple-300" />
          <span className="text-sm font-bold tracking-wide text-white">ACTIVATE DETOX</span>
        </div>
      </button>

      {/* Always-On Protections */}
      <PornBlockerToggle active={pornBlockerActive} onToggle={onTogglePornBlocker} />
    </>
  );
}
