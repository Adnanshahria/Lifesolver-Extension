import { useState, useEffect } from 'react';
import { API } from '../lib/api';

export function useDashboardData(user: any) {
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [hourlyUsage, setHourlyUsage] = useState<Record<string, number>>({});
  const [showGraph, setShowGraph] = useState(false);
  const [hiddenDomains, setHiddenDomains] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [financeEntries, setFinanceEntries] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  const loadData = async () => {
    chrome.runtime.sendMessage({ type: 'LS_GET_USAGE' }, (res) => {
      if (res?.usage) {
        setUsage(res.usage);
        chrome.storage.local.set({ ls_cached_usage: res.usage });
      }
      if (res?.hourly) setHourlyUsage(res.hourly);
    });

    const tasksData = await API.fetchTasks();
    setTasks(tasksData);
    chrome.storage.local.set({ ls_cached_tasks: tasksData });

    const habitsData = await API.fetchHabits();
    setHabits(habitsData);
    chrome.storage.local.set({ ls_cached_habits: habitsData });

    const financeData = await API.fetchFinance();
    setFinanceEntries(financeData);
    chrome.storage.local.set({ ls_cached_finance: financeData });

    const budgetsData = await API.fetchBudgets();
    setBudgets(budgetsData);
    chrome.storage.local.set({ ls_cached_budgets: budgetsData });
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
    chrome.storage.local.get(['ls_hidden_domains']).then((data) => {
      if (Array.isArray(data.ls_hidden_domains)) {
        setHiddenDomains(data.ls_hidden_domains as string[]);
      }
    });
  }, [user]);

  const handleHideDomain = (domain: string) => {
    const updated = [...hiddenDomains, domain];
    setHiddenDomains(updated);
    chrome.storage.local.set({ ls_hidden_domains: updated });
  };

  // Derived Data
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const today = new Date().toISOString().split('T')[0];
  const pendingHabits = habits.filter((h) => h.last_completed_date !== today);
  const totalSpentMs = Object.values(usage).reduce((a, b) => a + b, 0);
  const peakHourEntry = Object.entries(hourlyUsage).sort((a, b) => b[1] - a[1])[0];
  const peakHour = peakHourEntry && peakHourEntry[1] > 0 ? parseInt(peakHourEntry[0]) : null;

  const regularFinance = financeEntries.filter((e: any) => !e.is_special);
  const totalIncome = regularFinance
    .filter((e: any) => e.type === 'income')
    .reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalExpenses = regularFinance
    .filter((e: any) => e.type === 'expense')
    .reduce((sum: number, e: any) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Monthly Budget Logic
  const regularBudgets = budgets.filter((b: any) => !b.is_special);
  const budgetGoals = regularBudgets.filter((b: any) => b.type === 'budget');
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const primaryBudget =
    budgetGoals.find((b: any) => b.period === 'monthly' && b.start_date?.startsWith(currentMonthStr)) ||
    budgetGoals.find((b: any) => b.period === 'monthly' && !b.start_date) ||
    budgetGoals.find((b: any) => b.period === 'monthly') ||
    budgetGoals[0];

  let budgetSpent = 0;
  let budgetRemaining = 0;
  let budgetTarget = 0;

  if (primaryBudget) {
    const budgetStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const budgetEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const periodExpenses = regularFinance.filter((e: any) => {
      if (e.type !== 'expense') return false;
      const expenseDate = new Date(e.date);
      if (expenseDate < budgetStart || expenseDate > budgetEnd) return false;
      if (primaryBudget.category && e.category !== primaryBudget.category) return false;
      return true;
    });
    budgetSpent = periodExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    budgetTarget = primaryBudget.target_amount;
    budgetRemaining = budgetTarget - budgetSpent;
  }

  return {
    usage,
    hourlyUsage,
    showGraph,
    setShowGraph,
    hiddenDomains,
    handleHideDomain,
    tasks,
    habits,
    financeEntries,
    budgets,
    pendingTasks,
    pendingHabits,
    totalSpentMs,
    peakHour,
    balance,
    budgetSpent,
    budgetRemaining,
    budgetTarget,
    primaryBudget,
    loadData,
  };
}
