import { addDays, formatISO, isAfter, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { DRAW_DAYS, DRAW_HOUR_ICT, TIMEZONE, WINDOW_DAYS } from '../config/game';

/** Today's calendar date in ICT, as YYYY-MM-DD. */
export function todayIct(now: Date = new Date()): string {
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
}

export function dateIsoDaysAgo(isoDate: string, days: number): string {
  const d = parseISO(isoDate);
  return formatISO(addDays(d, -days), { representation: 'date' });
}

/** Inclusive 30-day window: [today - WINDOW_DAYS, today]. */
export function windowStart(today: string = todayIct()): string {
  return dateIsoDaysAgo(today, WINDOW_DAYS);
}

export function isWithinWindow(date: string, today: string = todayIct()): boolean {
  return date >= windowStart(today) && date <= today;
}

export function isDrawDay(isoDate: string): boolean {
  const d = toZonedTime(parseISO(isoDate), TIMEZONE);
  return (DRAW_DAYS as readonly number[]).includes(d.getDay());
}

/** List of expected draw dates (Tue/Thu/Sat) within [from, to], inclusive. */
export function expectedDrawDates(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = parseISO(from);
  const end = parseISO(to);
  while (!isAfter(cursor, end)) {
    const iso = formatISO(cursor, { representation: 'date' });
    if (isDrawDay(iso)) dates.push(iso);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/** Next draw's date+time in ICT, computed client-side from the draw days. */
export function nextDrawAt(now: Date = new Date()): Date {
  let cursor = toZonedTime(now, TIMEZONE);
  for (let i = 0; i < 8; i++) {
    const iso = formatInTimeZone(cursor, TIMEZONE, 'yyyy-MM-dd');
    if (isDrawDay(iso)) {
      const candidate = toZonedTime(parseISO(`${iso}T${String(DRAW_HOUR_ICT).padStart(2, '0')}:00:00`), TIMEZONE);
      if (isAfter(candidate, now) || i > 0) return candidate;
    }
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

/** Deterministic PRNG (mulberry32) seeded by YYYYMMDD so suggestions are stable all day. */
export function seededRandom(seedDate: string): () => number {
  let seed = Number(seedDate.replaceAll('-', ''));
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
