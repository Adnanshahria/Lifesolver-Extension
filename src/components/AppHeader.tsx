import { LogOut } from 'lucide-react';

interface AppHeaderProps {
  user: any;
  onLogout: () => void;
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg backdrop-blur-sm">
          <img src="/logo.svg" alt="Logo" className="h-full w-full opacity-90" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium tracking-tight text-white/90">{user.name}</span>
          <span className="text-[9px] font-medium tracking-[0.1em] text-cyan-400/80 uppercase">Active Session</span>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
      >
        <LogOut size={12} /> Logout
      </button>
    </header>
  );
}
