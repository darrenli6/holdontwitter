/** Beijing is UTC+8 all year (no daylight saving), so a fixed offset is exact. */
export const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The Beijing calendar date (YYYY-MM-DD) for a moment in time. */
export function beijingDateKey(at: number | Date = Date.now()): string {
  const ms = typeof at === "number" ? at : at.getTime();
  return new Date(ms + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}

export function isDateKey(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** [start, end) in epoch ms for a Beijing calendar day. */
export function beijingDayRange(dateKey: string): { start: number; end: number } {
  const match = DATE_PATTERN.exec(dateKey);
  if (!match || !isDateKey(dateKey)) throw new Error(`Invalid date: ${dateKey}`);
  const [, y, m, d] = match.map(Number);
  const start = Date.UTC(y, m - 1, d) - BEIJING_OFFSET_MS;
  return { start, end: start + DAY_MS };
}

/** Moves a date key by whole days. */
export function shiftDateKey(dateKey: string, days: number): string {
  const { start } = beijingDayRange(dateKey);
  return beijingDateKey(start + days * DAY_MS);
}

/** Days from `dateKey` back to today (0 = today, 1 = yesterday). */
export function daysAgo(dateKey: string, now: number = Date.now()): number {
  return Math.round(
    (beijingDayRange(beijingDateKey(now)).start - beijingDayRange(dateKey).start) / DAY_MS,
  );
}

/** HH:mm in Beijing time. */
export function beijingClock(at: number): string {
  return new Date(at + BEIJING_OFFSET_MS).toISOString().slice(11, 16);
}
