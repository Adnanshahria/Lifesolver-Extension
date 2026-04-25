export function LoadingSkeleton() {
  return (
    <div className="relative flex h-screen flex-col bg-[#09090b] text-slate-100 font-sans overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute left-1/2 top-0 h-[150px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-900/10 blur-[100px] pointer-events-none" />

      {/* HEADER SKELETON */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-white/10 animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-2 w-16 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="h-7 w-16 rounded-lg bg-white/5 animate-pulse" />
      </header>

      {/* TABS SKELETON */}
      <nav className="relative z-10 flex gap-4 border-b border-white/5 px-4">
        <div className="flex h-10 items-center py-3">
          <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="flex h-10 items-center py-3">
          <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
        </div>
      </nav>

      {/* CONTENT SKELETON */}
      <main className="relative z-10 flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-hide">
        {/* Usage Card Skeleton */}
        <div className="flex h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-1.5 w-full rounded-full bg-white/5 animate-pulse" />
            <div className="h-1.5 w-[80%] rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex h-32 flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
            </div>
            <div className="space-y-2.5">
              <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-[90%] rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-[75%] rounded bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="flex h-32 flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
            </div>
            <div className="space-y-2.5">
              <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-[85%] rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-[60%] rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
