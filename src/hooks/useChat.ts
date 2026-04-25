import { useState, useEffect, useRef } from 'react';
import { API } from '../lib/api';
import { formatTime } from '../utils/formatters';

interface UseChatOptions {
  pendingTasks: any[];
  pendingHabits: any[];
  balance: number;
  budgetRemaining: number;
  totalSpentMs: number;
}

export function useChat({ pendingTasks, pendingHabits, balance, budgetRemaining, totalSpentMs }: UseChatOptions) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from storage
  useEffect(() => {
    chrome.storage.local.get(['ls_chat_history']).then((data) => {
      if (Array.isArray(data.ls_chat_history)) {
        setMessages(data.ls_chat_history as { role: string; content: string }[]);
      }
    });
  }, []);

  // Persist chat history
  useEffect(() => {
    if (messages.length > 0) {
      chrome.storage.local.set({ ls_chat_history: messages });
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSendChat = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
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
- Tasks: ${pendingTasks.length > 0 ? pendingTasks.map((t) => t.title).join(', ') : 'None'}
- Habits: ${pendingHabits.length > 0 ? pendingHabits.map((h) => h.habit_name).join(', ') : 'None'}
- Net Worth: ৳${balance.toLocaleString()} | Budget: ৳${budgetRemaining.toLocaleString()}
- Time: ${formatTime(totalSpentMs)}`;

    const history = [{ role: 'system', content: systemPrompt }, ...newMsgs.filter((m) => m.role !== 'system')];

    const res = await API.sendAIMessage(history);
    setChatLoading(false);
    if (res.success && res.content) {
      setMessages([...newMsgs, { role: 'assistant', content: res.content }]);
    } else {
      setMessages([...newMsgs, { role: 'assistant', content: 'Systems offline. Focus on the task at hand.' }]);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    chrome.storage.local.set({ ls_chat_history: [] });
  };

  return {
    messages,
    input,
    setInput,
    chatLoading,
    chatEndRef,
    handleSendChat,
    handleClearChat,
  };
}
