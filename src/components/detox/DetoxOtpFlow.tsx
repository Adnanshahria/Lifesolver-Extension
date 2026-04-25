interface DetoxOtpFlowProps {
  detoxOtpRequested: boolean;
  detoxOtpLoading: boolean;
  detoxOtp: string;
  setDetoxOtp: (v: string) => void;
  detoxOtpError: string;
  detoxMathProblem: { a: number; b: number; op: string };
  detoxMathAnswer: string;
  setDetoxMathAnswer: (v: string) => void;
  setDetoxOtpRequested: (v: boolean) => void;
  setDetoxOtpError: (v: string) => void;
  onRequestEnd: () => void;
  onVerifyEnd: () => void;
}

export function DetoxOtpFlow({
  detoxOtpRequested,
  detoxOtpLoading,
  detoxOtp,
  setDetoxOtp,
  detoxOtpError,
  detoxMathProblem,
  detoxMathAnswer,
  setDetoxMathAnswer,
  setDetoxOtpRequested,
  setDetoxOtpError,
  onRequestEnd,
  onVerifyEnd,
}: DetoxOtpFlowProps) {
  if (!detoxOtpRequested) {
    return (
      <button
        disabled={detoxOtpLoading}
        onClick={onRequestEnd}
        className="w-full rounded-xl border border-white/5 bg-white/[0.02] py-2.5 text-xs font-medium text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all disabled:opacity-50"
      >
        {detoxOtpLoading ? 'Sending Code...' : 'End Detox Early'}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-3">
      <div className="text-center">
        <p className="text-[11px] text-rose-300 font-medium">Verification Required</p>
        <p className="text-[9px] text-rose-300/60 mt-0.5">
          Solve the math problem and enter the code sent to your email to end your detox early.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-rose-500/30 bg-rose-900/20 px-3 py-2 text-center text-sm font-medium text-white">
            {detoxMathProblem.a} {detoxMathProblem.op} {detoxMathProblem.b} =
          </div>
          <input
            type="number"
            placeholder="Answer"
            value={detoxMathAnswer}
            onChange={(e) => setDetoxMathAnswer(e.target.value)}
            className="flex-1 w-full rounded-xl border border-rose-500/30 bg-rose-900/20 px-3 py-2 text-center text-sm font-medium text-white outline-none focus:border-rose-400/50"
          />
        </div>
        <input
          type="text"
          maxLength={6}
          placeholder="6-Digit Code"
          value={detoxOtp}
          onChange={(e) => setDetoxOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-xl border border-rose-500/30 bg-rose-900/20 px-3 py-2 text-center text-sm font-medium tracking-[0.5em] text-white outline-none focus:border-rose-400/50"
        />
        {detoxOtpError && <p className="text-center text-[9px] text-rose-400 mt-1">{detoxOtpError}</p>}
      </div>
      <div className="flex gap-2">
        <button
          disabled={detoxOtpLoading}
          onClick={() => {
            setDetoxOtpRequested(false);
            setDetoxOtp('');
            setDetoxOtpError('');
            setDetoxMathAnswer('');
          }}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/60 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          disabled={detoxOtpLoading || detoxOtp.length < 6 || detoxMathAnswer === ''}
          onClick={onVerifyEnd}
          className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
        >
          {detoxOtpLoading ? '...' : 'Verify & End'}
        </button>
      </div>
    </div>
  );
}
