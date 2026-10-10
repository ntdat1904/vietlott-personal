import { describe, expect, it } from 'vitest';
import { buildRecommendations } from '../../src/lib/recommend';
import type { Draw } from '../../src/lib/frequency';
import { TIERS } from '../../src/config/game';

function makeDraws(count: number): Draw[] {
  const draws: Draw[] = [];
  for (let i = 0; i < count; i++) {
    const base = (i * 6) % 50;
    const numbers = Array.from({ length: 6 }, (_, k) => ((base + k * 7) % 55) + 1).sort((a, b) => a - b);
    draws.push({
      drawId: String(1000 + i),
      date: `2026-09-${String(10 + i).padStart(2, '0')}`,
      numbers: Array.from(new Set(numbers)).slice(0, 6).length === 6 ? numbers : [1, 2, 3, 4, 5, 6],
      bonus: ((base + 40) % 55) + 1,
      sourceUrl: 'x',
      fetchedAt: '2026-09-10T14:00:00Z',
    });
  }
  return draws;
}

describe('buildRecommendations', () => {
  const draws = makeDraws(13);

  it('is deterministic for a given date seed', () => {
    const a = buildRecommendations(draws, '2026-10-10');
    const b = buildRecommendations(draws, '2026-10-10');
    expect(a).toEqual(b);
  });

  it('produces 6 unique numbers per tier with the correct core size', () => {
    const result = buildRecommendations(draws, '2026-10-10');
    expect(result).toHaveLength(5);
    for (const tier of result) {
      expect(new Set(tier.numbers).size).toBe(6);
      const config = TIERS.find((c) => c.tierId === tier.tierId)!;
      expect(tier.core).toHaveLength(config.coreSize === 6 ? 6 : config.coreSize);
    }
  });

  it('bonus pick for jackpot2 is not inside the core', () => {
    const result = buildRecommendations(draws, '2026-10-10');
    const jackpot2 = result.find((t) => t.tierId === 'jackpot2')!;
    expect(jackpot2.bonusPick).toBeDefined();
    expect(jackpot2.core).not.toContain(jackpot2.bonusPick);
  });
});
