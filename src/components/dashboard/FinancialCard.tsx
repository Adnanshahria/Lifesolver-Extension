import { DollarSign, Target } from 'lucide-react';

interface FinancialCardProps {
  balance: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetTarget: number;
  primaryBudget: any;
}

export function FinancialCard({ balance, budgetSpent, budgetRemaining, budgetTarget, primaryBudget }: FinancialCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
          <DollarSign size={12} className="text-cyan-400" /> Financial
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Net Worth Card */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <DollarSign size={10} />
            </div>
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Net Worth</span>
          </div>
          <span className={`text-xl font-bold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ৳{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Monthly Budget Card */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                <Target size={10} />
              </div>
              <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Budget</span>
            </div>
          </div>
          {primaryBudget ? (
            <div className="flex flex-col gap-1 z-10">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-white/50">Spend</span>
                <span className="text-[11px] font-medium text-rose-400">
                  ৳{budgetSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-white/50">Left</span>
                <span className={`text-[12px] font-bold ${budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  ৳{budgetRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${budgetRemaining < 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                  style={{ width: `${Math.min((budgetSpent / Math.max(budgetTarget, 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-end">
                <span className="text-[9px] text-white/30">
                  Target: ৳{budgetTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 z-10 mt-1">
              <span className="text-xl font-bold tracking-tight text-amber-400/30">৳0</span>
              <span className="text-[9px] text-white/40">No active budget</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
