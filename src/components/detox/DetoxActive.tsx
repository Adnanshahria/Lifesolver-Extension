import { Shield, Zap } from 'lucide-react';
import { BUILTIN_BLOCKED } from '../../hooks/useDetox';
import { DetoxOtpFlow } from './DetoxOtpFlow';

interface DetoxActiveProps {
  detoxTimeLeft: string;
  detoxProgress: number;
  detoxCustomSites: string[];
  detoxOtpRequested: boolean;
  detoxOtpLoading: boolean;
  detoxOtp: string;
  setDetoxOtp: (v: string) => void;
  detoxOtpError: string;
  setDetoxOtpError: (v: string) => void;
  detoxMathProblem: { a: number; b: number; op: string };
  detoxMathAnswer: string;
  setDetoxMathAnswer: (v: string) => void;
  setDetoxOtpRequested: (v: boolean) => void;
  onRequestEnd: () => void;
  onVerifyEnd: () => void;
}

export function DetoxActive(props: DetoxActiveProps) {
  return (
    <>
      {/* Animated Header */}
      <div className="flex flex-col items-center pt-2">
        <div className="relative mb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.3)]"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          >
            <Shield size={28} className="text-purple-400" />
          </div>
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-400 animate-ping" />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-400" />
        </div>
        <h2
          className="text-lg font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Detox Active
        </h2>
        <p className="text-[10px] text-white/40 mt-0.5">Stay strong. You've got this.</p>
      </div>

      {/* Timer */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4 text-center backdrop-blur-xl">
        <div
          className="text-4xl font-extrabold tracking-wider text-white tabular-nums"
          style={{ textShadow: '0 0 30px rgba(147,51,234,0.4)' }}
        >
          {props.detoxTimeLeft}
        </div>
        <div className="mt-1 text-[10px] font-semibold tracking-[2px] uppercase text-white/30">Time Remaining</div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(147,51,234,0.5)] transition-all duration-1000"
            style={{ width: `${props.detoxProgress}%` }}
          />
        </div>
      </div>

      {/* Blocked Sites Summary */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase mb-2">
          <Zap size={12} className="text-purple-400" /> Blocked ({BUILTIN_BLOCKED.length + props.detoxCustomSites.length})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {BUILTIN_BLOCKED.map((d) => (
            <span
              key={d}
              className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-medium text-rose-300"
            >
              🚫 {d.replace('.com', '')}
            </span>
          ))}
          {props.detoxCustomSites.map((d) => (
            <span
              key={d}
              className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-medium text-rose-300"
            >
              🚫 {d}
            </span>
          ))}
        </div>
      </div>

      {/* End Early OTP Flow */}
      <DetoxOtpFlow
        detoxOtpRequested={props.detoxOtpRequested}
        detoxOtpLoading={props.detoxOtpLoading}
        detoxOtp={props.detoxOtp}
        setDetoxOtp={props.setDetoxOtp}
        detoxOtpError={props.detoxOtpError}
        setDetoxOtpError={props.setDetoxOtpError}
        detoxMathProblem={props.detoxMathProblem}
        detoxMathAnswer={props.detoxMathAnswer}
        setDetoxMathAnswer={props.setDetoxMathAnswer}
        setDetoxOtpRequested={props.setDetoxOtpRequested}
        onRequestEnd={props.onRequestEnd}
        onVerifyEnd={props.onVerifyEnd}
      />
    </>
  );
}
