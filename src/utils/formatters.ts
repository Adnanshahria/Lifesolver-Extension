// ─── Shared utility formatters ────────────────────────────────────────────────

/**
 * Format milliseconds into a human-readable time string.
 * Examples: "12s", "5m", "1h 30m"
 */
export function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m === 0 && ms > 0) return `${Math.ceil(ms / 1000)}s`;
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
