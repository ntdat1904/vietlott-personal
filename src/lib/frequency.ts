import { POOL_MAX, POOL_MIN } from '../config/game';

export interface Draw {
  drawId: string;
  date: string; // YYYY-MM-DD, ICT calendar date
  numbers: number[]; // 6 main numbers, ascending
  bonus: number;
  jackpot1Vnd?: number;
  jackpot2Vnd?: number;
  sourceUrl: string;
  fetchedAt: string;
}

export interface FrequencyEntry {
  n: number;
  count: number;
  lastSeen: string | null;
}

/**
 * Frequency of each main number across the window.
 * Sort rule: freq desc -> lastSeen desc (more recent wins) -> n asc.
 */
export function computeFrequency(draws: Draw[]): FrequencyEntry[] {
  const counts = new Map<number, number>();
  const lastSeen = new Map<number, string>();
  for (let n = POOL_MIN; n <= POOL_MAX; n++) counts.set(n, 0);

  for (const draw of draws) {
    for (const n of draw.numbers) {
      counts.set(n, (counts.get(n) ?? 0) + 1);
      const prev = lastSeen.get(n);
      if (!prev || draw.date > prev) lastSeen.set(n, draw.date);
    }
  }

  const entries: FrequencyEntry[] = [];
  for (let n = POOL_MIN; n <= POOL_MAX; n++) {
    entries.push({ n, count: counts.get(n) ?? 0, lastSeen: lastSeen.get(n) ?? null });
  }

  return entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const aLast = a.lastSeen ?? '';
    const bLast = b.lastSeen ?? '';
    if (bLast !== aLast) return bLast > aLast ? 1 : -1;
    return a.n - b.n;
  });
}

export function computeBonusFrequency(draws: Draw[]): { n: number; count: number }[] {
  const counts = new Map<number, number>();
  for (let n = POOL_MIN; n <= POOL_MAX; n++) counts.set(n, 0);
  for (const draw of draws) counts.set(draw.bonus, (counts.get(draw.bonus) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([n, count]) => ({ n, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.n - b.n));
}

export function topSix(frequency: FrequencyEntry[]): number[] {
  return frequency.slice(0, 6).map((e) => e.n);
}

/** draws since this number last appeared (0 = appeared in the most recent draw). */
export function drawsSinceLastSeen(draws: Draw[], n: number): number {
  // draws is expected newest-first
  const idx = draws.findIndex((d) => d.numbers.includes(n));
  return idx === -1 ? draws.length : idx;
}

/** co-occurrence count of n with any number already in `withNumbers`. */
export function pairScore(draws: Draw[], n: number, withNumbers: number[]): number {
  if (withNumbers.length === 0) return 0;
  let score = 0;
  for (const draw of draws) {
    if (!draw.numbers.includes(n)) continue;
    for (const m of withNumbers) {
      if (m !== n && draw.numbers.includes(m)) score++;
    }
  }
  return score;
}

export interface TrendPoint {
  date: string;
  cumulative: Record<number, number>;
}

/** cumulative appearance count per draw date, oldest to newest, for the given numbers. */
export function computeTrend(draws: Draw[], numbers: number[]): TrendPoint[] {
  const oldestFirst = [...draws].sort((a, b) => (a.date > b.date ? 1 : -1));
  const running: Record<number, number> = {};
  for (const n of numbers) running[n] = 0;
  return oldestFirst.map((draw) => {
    for (const n of numbers) {
      if (draw.numbers.includes(n)) running[n] = (running[n] ?? 0) + 1;
    }
    return { date: draw.date, cumulative: { ...running } };
  });
}
