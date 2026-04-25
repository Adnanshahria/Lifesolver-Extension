interface LoginScreenProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loginErr: string;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => void;
}

export function LoginScreen({ email, setEmail, password, setPassword, loginErr, loading, handleLogin }: LoginScreenProps) {
  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] p-8 text-white">
      {/* Deep ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[200px] w-[200px] rounded-full bg-cyan-600/20 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[200px] w-[200px] rounded-full bg-indigo-600/20 blur-[80px]" />

      <div className="relative z-10 flex w-full flex-col items-center">
        <img
          src="/logo.svg"
          alt="LifeSolver"
          className="mb-6 h-20 w-20 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform duration-700 hover:scale-105"
        />

        <h1 className="mb-1 text-2xl font-light tracking-tight text-white/90">
          Life<span className="font-semibold text-cyan-400">Solver</span>
        </h1>
        <p className="mb-10 text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">Focus. Build. Achieve.</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="group relative">
            <input
              type="email"
              placeholder="Email Address"
              required
              className="peer w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm font-light text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="group relative">
            <input
              type="password"
              placeholder="Password"
              required
              className="peer w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm font-light text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {loginErr && <p className="text-center text-[11px] font-medium text-rose-400 opacity-90">{loginErr}</p>}

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#09090b] py-3.5 transition-colors group-hover:bg-transparent">
              <span className="text-sm font-semibold tracking-wide text-white">
                {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
              </span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
