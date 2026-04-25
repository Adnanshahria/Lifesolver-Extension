import { Send, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import type { RefObject } from 'react';

interface ChatTabProps {
  messages: { role: string; content: string }[];
  input: string;
  setInput: (v: string) => void;
  chatLoading: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onSend: () => void;
  onClear: () => void;
  userName: string;
}

export function ChatTab({ messages, input, setInput, chatLoading, chatEndRef, onSend, onClear, userName }: ChatTabProps) {
  return (
    <div className="flex h-full flex-col pb-2">
      <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pb-4 pr-1">
        {/* Welcome message */}
        <div className="flex w-full items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md">
            <img src="/logo.svg" className="h-4 w-4" alt="AI" />
          </div>
          <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] p-3 text-[12px] font-light text-white/90 shadow-lg backdrop-blur-md max-w-[85%]">
            LifeSolver Protocol initiated. How can I assist your focus today?
          </div>
        </div>

        {messages
          .filter((m) => m.role !== 'system')
          .map((msg, i) => (
            <ChatMessage key={i} msg={msg} userName={userName} />
          ))}

        {chatLoading && (
          <div className="flex w-full items-end gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md">
              <img src="/logo.svg" className="h-4 w-4 opacity-50" alt="AI" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500/70"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500/70" style={{ animationDelay: '0.15s' }}></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500/70" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="relative mt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Query Intelligence..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-4 pr-12 text-[12px] font-light text-white placeholder-white/30 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
          />
          <button
            disabled={chatLoading || !input.trim()}
            onClick={onSend}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            <Send size={12} className="-ml-0.5 mt-0.5" />
          </button>
        </div>
        <button
          onClick={onClear}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
          title="Clear Chat"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
