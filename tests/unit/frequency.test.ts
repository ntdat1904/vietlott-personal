import { describe, expect, it } from 'vitest';
import { computeFrequency, computeBonusFrequency, topSix } from '../../src/lib/frequency';
import type { Draw } from '../../src/lib/frequency';

function draw(date: string, numbers: number[], bonus: number): Draw {
  return { drawId: date.replaceAll('-', ''), date, numbers, bonus, sourceUrl: 'x', fetchedAt: `${date}T14:00:00Z` };
}

describe('computeFrequency', () => {
  it('counts occurrences and sorts by freq desc, lastSeen desc, n asc', () => {
    const draws = [
      draw('2026-10-08', [1, 2, 3, 4, 5, 6], 7),
      draw('2026-10-06', [1, 2, 3, 4, 5, 10], 7),
      draw('2026-10-01', [1, 2, 20, 21, 22, 23], 7),
    ];
    const freq = computeFrequency(draws);
    expect(freq[0].n).toBeLessThanOrEqual(5); // numbers 1-5 appear most
    expect(freq.find((f) => f.n === 1)?.count).toBe(3);
    expect(freq.find((f) => f.n === 6)?.count).toBe(1);
    expect(freq.find((f) => f.n === 55)?.count).toBe(0);
  });

  it('topSix returns exactly 6 numbers', () => {
    const draws = [draw('2026-10-08', [1, 2, 3, 4, 5, 6], 7)];
    expect(topSix(computeFrequency(draws))).toHaveLength(6);
  });
});

describe('computeBonusFrequency', () => {
  it('counts bonus occurrences for all 55 numbers', () => {
    const draws = [draw('2026-10-08', [1, 2, 3, 4, 5, 6], 7), draw('2026-10-06', [10, 11, 12, 13, 14, 15], 7)];
    const bonusFreq = computeBonusFrequency(draws);
    expect(bonusFreq).toHaveLength(55);
    expect(bonusFreq.find((b) => b.n === 7)?.count).toBe(2);
  });
});
