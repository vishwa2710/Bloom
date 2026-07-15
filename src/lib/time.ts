/** Format a duration in seconds as e.g. "1h 04m", "12m 30s", "45s". */
export function formatDuration(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/** Midnight (local) for a given epoch-ms timestamp, as epoch ms. */
export function startOfLocalDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole days between two epoch-ms timestamps, by local calendar day. */
export function calendarDaysBetween(fromMs: number, toMs: number): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfLocalDay(toMs) - startOfLocalDay(fromMs)) / MS_PER_DAY);
}

/** Human relative label for a past timestamp, e.g. "Today", "3 days ago". */
export function relativeDay(epochMs: number, now: number): string {
  const days = calendarDaysBetween(epochMs, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(epochMs).toLocaleDateString();
}
