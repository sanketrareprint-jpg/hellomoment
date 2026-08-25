/**
 * All "is it their birthday today" logic runs in the BUSINESS's own
 * timezone (not the server's), so a business in Asia/Kolkata gets triggers
 * to fire at the right local moment regardless of where the app server
 * actually runs. Uses only Node's built-in Intl (no date-fns-tz
 * dependency) so timezone conversion never silently breaks.
 */

export interface MonthDay {
  month: number; // 1-12
  day: number; // 1-31
}

export function getTodayInTimezone(timezone: string): MonthDay & { year: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Compares only month+day, ignoring year — this is what makes a birthday
 * or anniversary stored with any historical year fire every year.
 *
 * DOB/anniversary values are stored as pure calendar dates (UTC
 * midnight, e.g. new Date(Date.UTC(1990, 5, 15))), so we always read the
 * UTC getters here regardless of server timezone.
 *
 * Handles the Feb 29 edge case: a Feb 29 birthday fires on Feb 28 in
 * non-leap years so nobody is skipped for three years running.
 */
export function isSameMonthDay(date: Date, today: MonthDay, todayYear: number): boolean {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if (month === today.month && day === today.day) return true;

  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  if (month === 2 && day === 29 && !isLeapYear(todayYear) && today.month === 2 && today.day === 28) {
    return true;
  }
  return false;
}

export function calculateAge(dob: Date, todayYear: number): number | null {
  const birthYear = dob.getUTCFullYear();
  if (!birthYear || birthYear < 1900) return null; // treat as "year unknown" placeholder
  return todayYear - birthYear;
}

export function calculateYears(anniversary: Date, todayYear: number): number | null {
  const startYear = anniversary.getUTCFullYear();
  if (!startYear || startYear < 1900) return null;
  return todayYear - startYear;
}

/** Formats a stored UTC calendar date as e.g. "25 August". */
export function formatDateForDisplay(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

/**
 * Days from "today" (in the business's timezone) until the next occurrence
 * of this month+day, 0 if it's today, wrapping to next year if it's
 * already passed this year. Used to show "upcoming this week" on the
 * dashboard.
 */
export function daysUntilNextOccurrence(monthDay: MonthDay, today: MonthDay & { year: number }): number {
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  let next = Date.UTC(today.year, monthDay.month - 1, monthDay.day);
  if (next < todayUtc) {
    next = Date.UTC(today.year + 1, monthDay.month - 1, monthDay.day);
  }
  return Math.round((next - todayUtc) / (1000 * 60 * 60 * 24));
}

/** Ordinal helper, e.g. 1 -> "1st", 2 -> "2nd" — handy for "Turns 25th!" style captions. */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
