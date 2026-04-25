import { renderMessageContent } from '../../utils/markdownRenderer';

interface ChatMessageProps {
  msg: { role: string; content: string };
  userName: string;
}

export function ChatMessage({ msg, userName }: ChatMessageProps) {
  return (
    <div className={`flex w-full items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-lg transition-all ${msg.role === 'user' ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-cyan-400/30' : 'bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md'}`}
      >
        {msg.role === 'user' ? (
          <span className="text-[10px] font-bold text-white">{(userName || 'U')[0].toUpperCase()}</span>
        ) : (
          <img src="/logo.svg" className="h-4 w-4" alt="AI" />
        )}
      </div>
      <div
        className={`rounded-2xl p-3 text-[12px] font-light shadow-lg backdrop-blur-md max-w-[85%] ${msg.role === 'user' ? 'rounded-br-sm border border-cyan-500/20 bg-cyan-900/30 text-white' : 'rounded-bl-sm border border-white/10 bg-white/[0.03] text-white/90'}`}
      >
        <div className="space-y-2 leading-relaxed">{renderMessageContent(msg.content)}</div>
      </div>
    </div>
  );
}
