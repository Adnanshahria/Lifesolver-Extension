import { UsageCard } from './UsageCard';
import { TasksCard } from './TasksCard';
import { HabitsCard } from './HabitsCard';
import { FinancialCard } from './FinancialCard';

interface DashboardTabProps {
  usage: Record<string, number>;
  hourlyUsage: Record<string, number>;
  totalSpentMs: number;
  peakHour: number | null;
  showGraph: boolean;
  setShowGraph: (v: boolean) => void;
  hiddenDomains: string[];
  onHideDomain: (domain: string) => void;
  pendingTasks: any[];
  pendingHabits: any[];
  balance: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetTarget: number;
  primaryBudget: any;
}

export function DashboardTab(props: DashboardTabProps) {
  return (
    <div className="space-y-4 pb-4">
      <UsageCard
        usage={props.usage}
        hourlyUsage={props.hourlyUsage}
        totalSpentMs={props.totalSpentMs}
        peakHour={props.peakHour}
        showGraph={props.showGraph}
        setShowGraph={props.setShowGraph}
        hiddenDomains={props.hiddenDomains}
        onHideDomain={props.onHideDomain}
      />
      <div className="grid grid-cols-2 gap-3">
        <TasksCard pendingTasks={props.pendingTasks} />
        <HabitsCard pendingHabits={props.pendingHabits} />
      </div>
      <FinancialCard
        balance={props.balance}
        budgetSpent={props.budgetSpent}
        budgetRemaining={props.budgetRemaining}
        budgetTarget={props.budgetTarget}
        primaryBudget={props.primaryBudget}
      />
    </div>
  );
}
