import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDashboardData } from './hooks/useDashboardData';
import { useDetox } from './hooks/useDetox';
import { useFriction } from './hooks/useFriction';
import { useChat } from './hooks/useChat';
import { useFrictionAnalytics } from './hooks/useFrictionAnalytics';
import { useJournal } from './hooks/useJournal';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { AppTabs, type TabType } from './components/AppTabs';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ChatTab } from './components/chat/ChatTab';
import { DetoxTab } from './components/detox/DetoxTab';
import { GrowthTab } from './components/growth/GrowthTab';

export default function App() {
  const auth = useAuth();
  const [tab, setTab] = useState<TabType>('dashboard');
  const dashboard = useDashboardData(auth.user);
  const detox = useDetox();
  const friction = useFriction();
  const chat = useChat({
    pendingTasks: dashboard.pendingTasks,
    pendingHabits: dashboard.pendingHabits,
    balance: dashboard.balance,
    budgetRemaining: dashboard.budgetRemaining,
    totalSpentMs: dashboard.totalSpentMs,
  });
  const frictionAnalytics = useFrictionAnalytics();
  const journal = useJournal();

  // Load friction state on mount
  useEffect(() => {
    friction.loadFrictionState();
  }, []);

  if (auth.loading && !auth.user) {
    return <LoadingSkeleton />;
  }

  if (!auth.user) {
    return (
      <LoginScreen
        email={auth.email}
        setEmail={auth.setEmail}
        password={auth.password}
        setPassword={auth.setPassword}
        loginErr={auth.loginErr}
        loading={auth.loading}
        handleLogin={auth.handleLogin}
      />
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-[#09090b] text-slate-100 font-sans overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute left-1/2 top-0 h-[150px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-900/20 blur-[100px] pointer-events-none" />

      <AppHeader user={auth.user} onLogout={auth.handleLogout} />
      <AppTabs tab={tab} setTab={setTab} />

      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
        {tab === 'dashboard' && (
          <DashboardTab
            usage={dashboard.usage}
            hourlyUsage={dashboard.hourlyUsage}
            totalSpentMs={dashboard.totalSpentMs}
            peakHour={dashboard.peakHour}
            showGraph={dashboard.showGraph}
            setShowGraph={dashboard.setShowGraph}
            hiddenDomains={dashboard.hiddenDomains}
            onHideDomain={dashboard.handleHideDomain}
            pendingTasks={dashboard.pendingTasks}
            pendingHabits={dashboard.pendingHabits}
            balance={dashboard.balance}
            budgetSpent={dashboard.budgetSpent}
            budgetRemaining={dashboard.budgetRemaining}
            budgetTarget={dashboard.budgetTarget}
            primaryBudget={dashboard.primaryBudget}
          />
        )}
        {tab === 'chat' && (
          <ChatTab
            messages={chat.messages}
            input={chat.input}
            setInput={chat.setInput}
            chatLoading={chat.chatLoading}
            chatEndRef={chat.chatEndRef}
            onSend={chat.handleSendChat}
            onClear={chat.handleClearChat}
            userName={auth.user?.name || ''}
          />
        )}
        {tab === 'detox' && (
          <DetoxTab
            detox={detox}
            pornBlockerActive={friction.pornBlockerActive}
            handleTogglePornBlocker={friction.handleTogglePornBlocker}
          />
        )}
        {tab === 'growth' && <GrowthTab friction={friction} analytics={frictionAnalytics} journal={journal} />}
      </main>
    </div>
  );
}
