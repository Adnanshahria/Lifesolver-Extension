import { LayoutDashboard, MessageSquare, Shield, Zap } from 'lucide-react';

export type TabType = 'dashboard' | 'chat' | 'detox' | 'growth';

interface AppTabsProps {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export function AppTabs({ tab, setTab }: AppTabsProps) {
  return (
    <nav className="relative z-10 flex gap-4 border-b border-white/5 px-4">
      <button
        onClick={() => setTab('dashboard')}
        className={`relative py-3 text-xs font-medium tracking-wide transition-colors ${tab === 'dashboard' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      >
        <span className="flex items-center gap-1.5">
          <LayoutDashboard size={14} /> Overview
        </span>
        {tab === 'dashboard' && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        )}
      </button>
      <button
        onClick={() => setTab('chat')}
        className={`relative py-3 text-xs font-medium tracking-wide transition-colors ${tab === 'chat' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      >
        <span className="flex items-center gap-1.5">
          <MessageSquare size={14} /> Intelligence
        </span>
        {tab === 'chat' && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        )}
      </button>
      <button
        onClick={() => setTab('detox')}
        className={`relative py-3 text-xs font-medium tracking-wide transition-colors ${tab === 'detox' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      >
        <div className="flex items-center gap-1.5">
          <Shield size={14} className={tab === 'detox' ? 'text-purple-400' : ''} /> Detox
        </div>
        {tab === 'detox' && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
        )}
      </button>
      <button
        onClick={() => setTab('growth')}
        className={`relative py-3 text-xs font-medium tracking-wide transition-colors ${tab === 'growth' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
      >
        <div className="flex items-center gap-1.5">
          <Zap size={14} className={tab === 'growth' ? 'text-rose-400' : ''} /> Growth
        </div>
        {tab === 'growth' && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]" />
        )}
      </button>
    </nav>
  );
}
