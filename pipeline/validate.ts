import { POOL_MAX, POOL_MIN, MAIN_NUMBERS_COUNT } from '../src/config/game';
import { isDrawDay } from '../src/lib/dates';
import type { ParsedDraw } from './sources/vietlott';

export type ValidatedDraw = ParsedDraw;

export function isValidDraw(draw: ParsedDraw, todayIso: string): { ok: true } | { ok: false; reason: string } {
  const unique = new Set(draw.numbers);
  if (unique.size !== MAIN_NUMBERS_COUNT) return { ok: false, reason: 'numbers must have 6 unique values' };
  for (const n of draw.numbers) {
    if (n < POOL_MIN || n > POOL_MAX || !Number.isInteger(n)) {
      return { ok: false, reason: `number ${n} out of range 1-55` };
    }
  }
  if (draw.bonus < POOL_MIN || draw.bonus > POOL_MAX || !Number.isInteger(draw.bonus)) {
    return { ok: false, reason: `bonus ${draw.bonus} out of range 1-55` };
  }
  if (unique.has(draw.bonus)) return { ok: false, reason: 'bonus must not be among the 6 main numbers' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draw.date)) return { ok: false, reason: 'invalid date format' };
  if (!isDrawDay(draw.date)) return { ok: false, reason: 'date is not a draw day (Tue/Thu/Sat)' };
  if (draw.date > todayIso) return { ok: false, reason: 'date is in the future' };
  return { ok: true };
}

export function validateDraws(draws: ParsedDraw[], todayIso: string): { valid: ValidatedDraw[]; rejected: { draw: ParsedDraw; reason: string }[] } {
  const valid: ValidatedDraw[] = [];
  const rejected: { draw: ParsedDraw; reason: string }[] = [];
  for (const draw of draws) {
    const result = isValidDraw(draw, todayIso);
    if (result.ok) valid.push(draw);
    else rejected.push({ draw, reason: result.reason });
  }
  return { valid, rejected };
}

/** No duplicate drawId within the same array. */
export function hasDuplicateDrawIds(draws: { drawId: string }[]): boolean {
  const seen = new Set<string>();
  for (const d of draws) {
    if (seen.has(d.drawId)) return true;
    seen.add(d.drawId);
  }
  return false;
}
