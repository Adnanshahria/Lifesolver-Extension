import { Shield } from 'lucide-react';

interface PornBlockerToggleProps {
  active: boolean;
  onToggle: () => void;
}

export function PornBlockerToggle({ active, onToggle }: PornBlockerToggleProps) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
            <Shield size={12} className="text-rose-400" /> Adult Content Blocker
          </h3>
          <p className="mt-1 text-[9px] text-white/40">Always-on protection against adult websites.</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" checked={active} onChange={onToggle} />
          <div className="peer h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/70 after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:translate-x-full peer-checked:after:bg-white peer-focus:outline-none"></div>
        </label>
      </div>
    </div>
  );
}
