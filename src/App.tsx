import { useState, useEffect, useRef } from 'react';
import { API } from './lib/api';
import { 
  LogOut, LayoutDashboard, MessageSquare, 
  Globe, CheckSquare, Activity, Send, BarChart2, Trash2, DollarSign, Target, Check
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'dashboard'|'chat'>('dashboard');

  // Dashboard Data
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [hourlyUsage, setHourlyUsage] = useState<Record<string, number>>({});
  const [showGraph, setShowGraph] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [financeEntries, setFinanceEntries] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  // Chat Data
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);

  // Render inline markdown formatting: **bold**, *italic*, newlines, checklists, progress, graphs
  const renderFormattedText = (text: string) => {
    if (typeof text !== 'string') return text;
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Header: ### text
        const headerMatch = remaining.match(/^(#{1,6})\s+(.*)/s);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            const className = level === 1 ? "text-lg font-bold text-white mt-4 mb-2" :
                              level === 2 ? "text-base font-bold text-white mt-3 mb-1" :
                              "text-[13px] font-semibold text-cyan-400 mt-2 mb-1 uppercase tracking-wide";
            
            const HeaderTag = `h${level}` as any;
            parts.push(<HeaderTag key={key++} className={className}>{renderFormattedText(text)}</HeaderTag>);
            remaining = ""; // headers span the whole line
            continue;
        }
        // Bold: **text**
        const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
        if (boldMatch) {
            if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
            parts.push(<strong key={key++} className="font-semibold text-white">{boldMatch[2]}</strong>);
            remaining = boldMatch[3];
            continue;
        }
        // Italic: *text*
        const italicMatch = remaining.match(/^(.*?)(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)(.*)/s);
        if (italicMatch) {
            if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
            parts.push(<em key={key++} className="italic text-white/80">{italicMatch[2]}</em>);
            remaining = italicMatch[3];
            continue;
        }
        // Progress Bar: [progress: 75] or [progress: 75%]
        const progressMatch = remaining.match(/^(.*?)\[progress:\s*(\d+)%?\](.*)/is);
        if (progressMatch) {
            if (progressMatch[1]) parts.push(<span key={key++}>{progressMatch[1]}</span>);
            const pct = Math.min(100, Math.max(0, parseInt(progressMatch[2])));
            parts.push(
                <div key={key++} className="my-2 w-full max-w-[200px]">
                    <div className="flex justify-between text-[10px] mb-1 text-white/70">
                        <span>Progress</span>
                        <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 border border-white/5">
                        <div 
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" 
                            style={{width: `${pct}%`}} 
                        />
                    </div>
                </div>
            );
            remaining = progressMatch[3];
            continue;
        }
        // Graph: [graph: 10, 20, 30]
        const graphMatch = remaining.match(/^(.*?)\[graph:\s*([\d,\s]+)\](.*)/is);
        if (graphMatch) {
            if (graphMatch[1]) parts.push(<span key={key++}>{graphMatch[1]}</span>);
            const values = graphMatch[2].split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
            const maxVal = Math.max(1, ...values);
            parts.push(
                <div key={key++} className="my-3 flex items-end gap-[2px] h-12 w-full max-w-[200px] border-b border-white/10 pb-0.5 px-1">
                    {values.map((v, i) => {
                        const heightPct = Math.min(100, (v / maxVal) * 100);
                        return (
                            <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
                                <div 
                                    className="w-full min-w-[8px] rounded-t-sm bg-gradient-to-t from-cyan-600/50 to-indigo-500 transition-all hover:brightness-125" 
                                    style={{height: `${Math.max(5, heightPct)}%`}} 
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded bg-[#09090b] border border-white/10 px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap">
                                    {v}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
            remaining = graphMatch[3];
            continue;
        }
        // Checklist: - [ ] or - [x]
        const checkMatch = remaining.match(/^(.*?)[-*]\s*\[([ xX])\]\s*(.*?)(?=\n|[-*]\s*\[|$)(.*)/s);
        if (checkMatch) {
            if (checkMatch[1]) parts.push(<span key={key++}>{checkMatch[1]}</span>);
            const checked = checkMatch[2].toLowerCase() === "x";
            parts.push(
                <div key={key++} className="flex items-start gap-2 py-0.5 select-none my-1">
                    <div
                        className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                            checked
                                ? "bg-cyan-500 border-cyan-500 shadow-sm"
                                : "border-white/30 bg-white/5"
                        }`}
                    >
                        {checked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <span className={`text-[12px] transition-all duration-300 ${checked ? "line-through text-white/50 italic" : "text-white/90"}`}>
                        {renderFormattedText(checkMatch[3])}
                    </span>
                </div>
            );
            remaining = checkMatch[4];
            continue;
        }
        // No more formatting
        parts.push(<span key={key++}>{remaining}</span>);
        break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const renderMessageContent = (rawContent: string) => {
    // Pre-process: strip [table]/[/table] wrappers and decorative === lines
    const content = rawContent
      .replace(/\[\/?table\]/gi, '')
      .replace(/^=+$/gm, '')
      .replace(/\r/g, '');
    const lines = content.split('\n');
    const parts: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = (index: number) => {
      if (tableBuffer.length === 0) return;
      
      if (tableBuffer.length >= 2 && tableBuffer[1].includes('|-')) {
        const headers = tableBuffer[0].split('|').slice(1, -1).map(s => s.trim());
        const dataRows = tableBuffer.slice(2).map(r => r.split('|').slice(1, -1).map(s => s.trim()));
        
        parts.push(
          <div key={`table-${index}`} className="my-3 w-full overflow-x-auto rounded-md border border-white/10">
             <table className="w-full text-left text-[12px]">
                <thead className="bg-white/[0.02] [&_tr]:border-b border-white/10">
                   <tr>
                      {headers.map((h, i) => (
                         <th key={i} className="h-9 px-3 text-left align-middle font-medium text-white/60">{renderFormattedText(h)}</th>
                      ))}
                   </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                   {dataRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                         {row.map((cell, j) => (
                            <td key={j} className="p-3 align-middle text-white/80">{renderFormattedText(cell)}</td>
                         ))}
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        );
      } else {
        tableBuffer.forEach((line, i) => {
          parts.push(<p key={`notable-${index}-${i}`}>{renderFormattedText(line)}</p>);
        });
      }
      tableBuffer = [];
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
        tableBuffer.push(line);
      } else if (trimmed === "" && tableBuffer.length > 0) {
        // Ignore empty lines if we are currently building a table
        // This makes the parser resilient to double-spaced tables from the AI
      } else {
        flushTable(i);
        if (!trimmed) {
          parts.push(<div key={`space-${i}`} className="h-1" />);
        } else {
          parts.push(<p key={`text-${i}`}>{renderFormattedText(line)}</p>);
        }
      }
    });
    flushTable(lines.length);

    return parts;
  };

  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");

  useEffect(() => {
    API.verifyAuth().then(res => {
      if (res.authenticated && res.user) {
        setUser(res.user);
        loadData();
      }
      setLoading(false);
    });
    chrome.storage.local.get("ls_chat_history").then((data) => {
      if (Array.isArray(data.ls_chat_history)) {
        setMessages(data.ls_chat_history as {role: string, content: string}[]);
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      chrome.storage.local.set({ ls_chat_history: messages });
    }
  }, [messages]);

  const loadData = async () => {
    chrome.runtime.sendMessage({ type: "LS_GET_USAGE" }, res => {
      if (res?.usage) setUsage(res.usage);
      if (res?.hourly) setHourlyUsage(res.hourly);
    });
    setTasks(await API.fetchTasks());
    setHabits(await API.fetchHabits());
    setFinanceEntries(await API.fetchFinance());
    setBudgets(await API.fetchBudgets());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await API.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      loadData();
      chrome.runtime.sendMessage({ type: "LS_FORCE_SYNC" });
    } else {
      setLoginErr(res.error || "Login failed");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await API.clearAuth();
    setUser(null);
  };

  const handleClearChat = () => {
    setMessages([]);
    chrome.storage.local.set({ ls_chat_history: [] });
  };

  // Derived Data
  const pendingTasks = tasks.filter(t => t.status !== "done");
  const today = new Date().toISOString().split("T")[0];
  const pendingHabits = habits.filter(h => h.last_completed_date !== today);
  const totalSpentMs = Object.values(usage).reduce((a, b) => a + b, 0);
  const peakHourEntry = Object.entries(hourlyUsage).sort((a,b)=>b[1]-a[1])[0];
  const peakHour = peakHourEntry && peakHourEntry[1] > 0 ? parseInt(peakHourEntry[0]) : null;

  const regularFinance = financeEntries.filter((e: any) => !e.is_special);
  const totalIncome = regularFinance.filter((e: any) => e.type === "income").reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalExpenses = regularFinance.filter((e: any) => e.type === "expense").reduce((sum: number, e: any) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Monthly Budget Logic
  const regularBudgets = budgets.filter((b: any) => !b.is_special);
  const budgetGoals = regularBudgets.filter((b: any) => b.type === "budget");
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const primaryBudget = budgetGoals.find((b: any) => b.period === "monthly" && b.start_date?.startsWith(currentMonthStr))
      || budgetGoals.find((b: any) => b.period === "monthly" && !b.start_date)
      || budgetGoals.find((b: any) => b.period === "monthly")
      || budgetGoals[0];

  let budgetSpent = 0;
  let budgetRemaining = 0;
  let budgetTarget = 0;

  if (primaryBudget) {
      const budgetStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const budgetEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const periodExpenses = regularFinance.filter((e: any) => {
          if (e.type !== "expense") return false;
          const expenseDate = new Date(e.date);
          if (expenseDate < budgetStart || expenseDate > budgetEnd) return false;
          if (primaryBudget.category && e.category !== primaryBudget.category) return false;
          return true;
      });
      budgetSpent = periodExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      budgetTarget = primaryBudget.target_amount;
      budgetRemaining = budgetTarget - budgetSpent;
  }

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    if (m === 0 && ms > 0) return `${Math.ceil(ms / 1000)}s`;
    return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
  };

  const handleSendChat = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: "user", content: input }];
    setMessages(newMsgs);
    setInput("");
    setChatLoading(true);
    
    const systemPrompt = `LifeSolver AI: Luxury productivity assistant. Concise, sharp, motivating. No fluff.
RULES:
- TABLES: Mandatory for tasks/lists. | Task | Time |
- HEADERS: Use ###.
- CHECKLISTS: Only single next-steps (e.g. - [ ] Action).
- PROGRESS: [progress: 70%]
- GRAPH: [graph: 10, 20, 30]
- FORBIDDEN: Numbered lists, [table] tags, decoration lines (===), or checklists for multiple tasks.
CONTEXT:
- Tasks: ${pendingTasks.length > 0 ? pendingTasks.map(t => t.title).join(", ") : "None"}
- Habits: ${pendingHabits.length > 0 ? pendingHabits.map(h => h.habit_name).join(", ") : "None"}
- Net Worth: ৳${balance.toLocaleString()} | Budget: ৳${budgetRemaining.toLocaleString()}
- Time: ${formatTime(totalSpentMs)}`;

    const history = [
      { role: "system", content: systemPrompt },
      ...newMsgs.filter(m => m.role !== "system")
    ];
    
    const res = await API.sendAIMessage(history);
    setChatLoading(false);
    if (res.success && res.content) {
      setMessages([...newMsgs, { role: "assistant", content: res.content }]);
    } else {
      setMessages([...newMsgs, { role: "assistant", content: "Systems offline. Focus on the task at hand." }]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);



  if (loading && !user) {
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

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] p-8 text-white">
        {/* Deep ambient glows */}
        <div className="absolute top-[-10%] left-[-10%] h-[200px] w-[200px] rounded-full bg-cyan-600/20 blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[200px] w-[200px] rounded-full bg-indigo-600/20 blur-[80px]" />
        
        <div className="relative z-10 flex w-full flex-col items-center">
          <img src="/logo.svg" alt="LifeSolver" className="mb-6 h-20 w-20 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform duration-700 hover:scale-105" />
          
          <h1 className="mb-1 text-2xl font-light tracking-tight text-white/90">Life<span className="font-semibold text-cyan-400">Solver</span></h1>
          <p className="mb-10 text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">Focus. Build. Achieve.</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="group relative">
              <input 
                type="email" placeholder="Email Address" required
                className="peer w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm font-light text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="group relative">
              <input 
                type="password" placeholder="Password" required
                className="peer w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm font-light text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            {loginErr && (
              <p className="text-center text-[11px] font-medium text-rose-400 opacity-90">{loginErr}</p>
            )}
            
            <button 
              type="submit" disabled={loading} 
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

  // --- DASHBOARD SCREEN ---

  return (
    <div className="relative flex h-screen flex-col bg-[#09090b] text-slate-100 font-sans overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute left-1/2 top-0 h-[150px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-900/20 blur-[100px] pointer-events-none" />

      {/* HEADER */}
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
          onClick={handleLogout} 
          className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut size={12} /> Logout
        </button>
      </header>

      {/* TABS */}
      <nav className="relative z-10 flex gap-4 border-b border-white/5 px-4">
        <button 
          onClick={() => setTab('dashboard')}
          className={`relative py-3 text-xs font-medium tracking-wide transition-colors ${tab === 'dashboard' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <span className="flex items-center gap-1.5"><LayoutDashboard size={14} /> Overview</span>
          {tab === 'dashboard' && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
        </button>
        <button 
          onClick={() => setTab('chat')}
          className={`relative py-3 text-xs font-medium tracking-wide transition-colors ${tab === 'chat' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <span className="flex items-center gap-1.5"><MessageSquare size={14} /> Intelligence</span>
          {tab === 'chat' && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
        </button>
      </nav>

      {/* CONTENT */}
      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
        {tab === 'dashboard' && (
          <div className="space-y-4 pb-4">
            {/* Usage Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
                  <Globe size={12} className="text-cyan-400"/> Digital Footprint
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium text-white/70">Total: {formatTime(totalSpentMs)}</span>
                  <button 
                    onClick={() => setShowGraph(!showGraph)}
                    className={`rounded bg-white/5 p-1 transition-colors hover:bg-white/10 ${showGraph ? 'text-cyan-400' : 'text-white/50'}`}
                  >
                    <BarChart2 size={12} />
                  </button>
                </div>
              </div>
              
              {showGraph ? (
                <div className="flex flex-col gap-2">
                  <div className="flex h-[60px] items-end gap-[2px] rounded-xl border border-white/5 bg-white/[0.01] p-1.5">
                    {Array.from({length: 24}).map((_, i) => {
                      const val = hourlyUsage[i] || 0;
                      const maxHourly = Math.max(1, ...Object.values(hourlyUsage));
                      const heightPct = Math.min(100, (val / maxHourly) * 100);
                      return (
                        <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
                           <div 
                             className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600/50 to-indigo-500 transition-all hover:brightness-125" 
                             style={{height: `${Math.max(4, heightPct)}%`, opacity: val > 0 ? 1 : 0.2}} 
                           />
                           {val > 0 && (
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded bg-[#09090b] border border-white/10 px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap">
                               {i}:00 - {formatTime(val)}
                             </div>
                           )}
                        </div>
                      );
                    })}
                  </div>
                  {peakHour !== null ? (
                    <p className="text-center text-[9px] text-white/40">Peak usage around {peakHour}:00</p>
                  ) : (
                    <p className="text-center text-[9px] text-white/40">No significant usage yet.</p>
                  )}
                </div>
              ) : Object.keys(usage).length === 0 ? (
                <div className="flex h-12 items-center justify-center rounded-xl border border-white/5 bg-white/[0.01]">
                  <p className="text-[10px] text-white/30">Zero distractions tracked.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[80px] overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(usage).sort((a,b)=>b[1]-a[1]).map(([domain, ms]) => (
                    <div key={domain} className="group flex items-center gap-3">
                      <span className="w-16 truncate text-[10px] text-white/60 group-hover:text-white/90 transition-colors">{domain.replace('.com','')}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{width: `${Math.min((ms / 3600000)*100, 100)}%`}}></div>
                      </div>
                      <span className="w-10 text-right text-[10px] font-medium tabular-nums text-white/80">{formatTime(ms)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks & Habits Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Tasks Card */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
                    <CheckSquare size={12} className="text-cyan-400"/> Pending Tasks
                  </h3>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white">{pendingTasks.length}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-hide pr-1">
                  {pendingTasks.length === 0 ? (
                    <p className="text-center text-[10px] text-white/30 mt-4">All clear.</p>
                  ) : (
                    pendingTasks.slice(0, 5).map((t, i) => (
                      <div key={i} className="group flex items-start gap-2 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/[0.02] p-1.5 transition-colors">
                        <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full shadow-sm ${t.priority === 'urgent' ? 'bg-rose-500 shadow-rose-500/50' : t.priority === 'high' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                        <span className="truncate text-[11px] text-white/70 group-hover:text-white leading-tight">{t.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Habits Card */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
                    <Activity size={12} className="text-cyan-400"/> Habits
                  </h3>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white">{pendingHabits.length}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] scrollbar-hide pr-1">
                  {pendingHabits.length === 0 ? (
                    <p className="text-center text-[10px] text-white/30 mt-4">All complete.</p>
                  ) : (
                    pendingHabits.map((h, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-1.5">
                        <span className="truncate text-[11px] text-white/70">{h.habit_name}</span>
                        <span className="ml-2 flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                          🔥 {h.streak_count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Financial Card */}
            <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/80 uppercase">
                  <DollarSign size={12} className="text-cyan-400"/> Financial
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
                        <span className="text-[11px] font-medium text-rose-400">৳{budgetSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-white/50">Left</span>
                        <span className={`text-[12px] font-bold ${budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>৳{budgetRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${budgetRemaining < 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`} 
                          style={{width: `${Math.min((budgetSpent / Math.max(budgetTarget, 1)) * 100, 100)}%`}}
                        />
                      </div>
                      <div className="mt-0.5 flex justify-end">
                        <span className="text-[9px] text-white/30">Target: ৳{budgetTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
          </div>
        )}

        {tab === 'chat' && (
          <div className="flex h-full flex-col pb-2">

            <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pb-4 pr-1">
              <div className="flex w-full items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md">
                  <img src="/logo.svg" className="h-4 w-4" alt="AI" />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] p-3 text-[12px] font-light text-white/90 shadow-lg backdrop-blur-md max-w-[85%]">
                  LifeSolver Protocol initiated. How can I assist your focus today?
                </div>
              </div>
              
              {messages.filter(m=>m.role!=='system').map((msg, i) => (
                <div key={i} className={`flex w-full items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-lg transition-all ${msg.role === 'user' ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-cyan-400/30' : 'bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md'}`}>
                    {msg.role === 'user' ? <span className="text-[10px] font-bold text-white">{(user?.name || "U")[0].toUpperCase()}</span> : <img src="/logo.svg" className="h-4 w-4" alt="AI" />}
                  </div>
                  <div className={`rounded-2xl p-3 text-[12px] font-light shadow-lg backdrop-blur-md max-w-[85%] ${msg.role === 'user' ? 'rounded-br-sm border border-cyan-500/20 bg-cyan-900/30 text-white' : 'rounded-bl-sm border border-white/10 bg-white/[0.03] text-white/90'}`}>
                    <div className="space-y-2 leading-relaxed">
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex w-full items-end gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md">
                    <img src="/logo.svg" className="h-4 w-4 opacity-50" alt="AI" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500/70"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500/70" style={{animationDelay:'0.15s'}}></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500/70" style={{animationDelay:'0.3s'}}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="relative mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" placeholder="Query Intelligence..." 
                  className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-4 pr-12 text-[12px] font-light text-white placeholder-white/30 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                />
                <button 
                  disabled={chatLoading || !input.trim()} 
                  onClick={handleSendChat} 
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <Send size={12} className="-ml-0.5 mt-0.5" />
                </button>
              </div>
              <button 
                onClick={handleClearChat}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                title="Clear Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
