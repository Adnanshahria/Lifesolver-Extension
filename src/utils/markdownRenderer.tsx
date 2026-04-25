import { Check } from 'lucide-react';
import type React from 'react';

// ─── Inline markdown formatting: **bold**, *italic*, progress, graphs, checklists ──

export function renderFormattedText(text: string): React.ReactNode {
  if (typeof text !== 'string') return text;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Header: ### text
    const headerMatch = remaining.match(/^(#{1,6})\s+(.*)/s);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const headerText = headerMatch[2];
      const className =
        level === 1
          ? 'text-lg font-bold text-white mt-4 mb-2'
          : level === 2
            ? 'text-base font-bold text-white mt-3 mb-1'
            : 'text-[13px] font-semibold text-cyan-400 mt-2 mb-1 uppercase tracking-wide';

      const HeaderTag = `h${level}` as any;
      parts.push(
        <HeaderTag key={key++} className={className}>
          {renderFormattedText(headerText)}
        </HeaderTag>,
      );
      remaining = '';
      continue;
    }
    // Bold: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {boldMatch[2]}
        </strong>,
      );
      remaining = boldMatch[3];
      continue;
    }
    // Italic: *text*
    const italicMatch = remaining.match(/^(.*?)(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)(.*)/s);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(
        <em key={key++} className="italic text-white/80">
          {italicMatch[2]}
        </em>,
      );
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
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>,
      );
      remaining = progressMatch[3];
      continue;
    }
    // Graph: [graph: 10, 20, 30]
    const graphMatch = remaining.match(/^(.*?)\[graph:\s*([\d,\s]+)\](.*)/is);
    if (graphMatch) {
      if (graphMatch[1]) parts.push(<span key={key++}>{graphMatch[1]}</span>);
      const values = graphMatch[2]
        .split(',')
        .map((v) => parseInt(v.trim()))
        .filter((v) => !isNaN(v));
      const maxVal = Math.max(1, ...values);
      parts.push(
        <div
          key={key++}
          className="my-3 flex items-end gap-[2px] h-12 w-full max-w-[200px] border-b border-white/10 pb-0.5 px-1"
        >
          {values.map((v, i) => {
            const heightPct = Math.min(100, (v / maxVal) * 100);
            return (
              <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
                <div
                  className="w-full min-w-[8px] rounded-t-sm bg-gradient-to-t from-cyan-600/50 to-indigo-500 transition-all hover:brightness-125"
                  style={{ height: `${Math.max(5, heightPct)}%` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded bg-[#09090b] border border-white/10 px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap">
                  {v}
                </div>
              </div>
            );
          })}
        </div>,
      );
      remaining = graphMatch[3];
      continue;
    }
    // Checklist: - [ ] or - [x]
    const checkMatch = remaining.match(/^(.*?)[-*]\s*\[([ xX])\]\s*(.*?)(?=\n|[-*]\s*\[|$)(.*)/s);
    if (checkMatch) {
      if (checkMatch[1]) parts.push(<span key={key++}>{checkMatch[1]}</span>);
      const checked = checkMatch[2].toLowerCase() === 'x';
      parts.push(
        <div key={key++} className="flex items-start gap-2 py-0.5 select-none my-1">
          <div
            className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
              checked
                ? 'bg-cyan-500 border-cyan-500 shadow-sm'
                : 'border-white/30 bg-white/5'
            }`}
          >
            {checked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
          </div>
          <span
            className={`text-[12px] transition-all duration-300 ${checked ? 'line-through text-white/50 italic' : 'text-white/90'}`}
          >
            {renderFormattedText(checkMatch[3])}
          </span>
        </div>,
      );
      remaining = checkMatch[4];
      continue;
    }
    // No more formatting
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ─── Full message content renderer (tables, markdown, etc.) ──────────────────

export function renderMessageContent(rawContent: string): React.ReactNode[] {
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
      const headers = tableBuffer[0]
        .split('|')
        .slice(1, -1)
        .map((s) => s.trim());
      const dataRows = tableBuffer
        .slice(2)
        .map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((s) => s.trim()),
        );

      parts.push(
        <div key={`table-${index}`} className="my-3 w-full overflow-x-auto rounded-md border border-white/10">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white/[0.02] [&_tr]:border-b border-white/10">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="h-9 px-3 text-left align-middle font-medium text-white/60">
                    {renderFormattedText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {dataRows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  {row.map((cell, j) => (
                    <td key={j} className="p-3 align-middle text-white/80">
                      {renderFormattedText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else {
      tableBuffer.forEach((line, i) => {
        parts.push(
          <p key={`notable-${index}-${i}`}>{renderFormattedText(line)}</p>,
        );
      });
    }
    tableBuffer = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
      tableBuffer.push(line);
    } else if (trimmed === '' && tableBuffer.length > 0) {
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
}
