import { LogOut, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface AppHeaderProps {
  user: any;
  onLogout: () => void;
  onSync: () => Promise<void>;
}

export function AppHeader({ user, onLogout, onSync }: AppHeaderProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const handleSync = useCallback(async () => {
    setSyncing(true);
    await onSync();
    setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setSyncing(false), 500);
  }, [onSync]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleSync();
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [handleSync]);

  return (
    <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg backdrop-blur-sm">
          <img src="/logo.svg" alt="Logo" className="h-full w-full opacity-90" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-white/90" style={{ fontFamily: "'EB Garamond', serif" }}>{user.name}</span>
          <span className="text-[9px] font-medium tracking-[0.1em] text-cyan-400/80 uppercase">Active Session</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-white/30 font-medium mr-1">Synced {lastSynced}</span>
        <button
          onClick={handleSync}
          title="Force DB Sync"
          className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white ${syncing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={12} />
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/50 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut size={10} /> Logout
        </button>
      </div>
    </header>
  );
}
