import { POOL_MAX, POOL_MIN, TIERS, TierId } from '../config/game';
import { Draw, computeBonusFrequency, computeFrequency, drawsSinceLastSeen, pairScore } from './frequency';
import { seededRandom } from './dates';

export interface TierSuggestion {
  tierId: TierId;
  order: 1 | 2 | 3 | 4 | 5;
  numbers: number[]; // 6 numbers, ascending
  core: number[]; // highlighted numbers
  bonusPick?: number; // jackpot2 only
  rationale: { key: string; params: Record<string, string | number> };
}

function normalize(values: Map<number, number>): Map<number, number> {
  const max = Math.max(1e-9, ...values.values());
  const out = new Map<number, number>();
  for (const [k, v] of values) out.set(k, v / max);
  return out;
}

/**
 * Builds scores for every number in the pool given the current chosen set
 * (used for the pair-affinity term, which depends on numbers picked so far).
 */
function scoreAll(
  draws: Draw[],
  freqMap: Map<number, number>,
  chosenSoFar: number[],
  weights: { freq: number; recency: number; pair: number },
): Map<number, number> {
  const freqNorm = normalize(freqMap);
  const recencyRaw = new Map<number, number>();
  const pairRaw = new Map<number, number>();
  for (let n = POOL_MIN; n <= POOL_MAX; n++) {
    recencyRaw.set(n, 1 / (1 + drawsSinceLastSeen(draws, n)));
    pairRaw.set(n, weights.pair > 0 ? pairScore(draws, n, chosenSoFar) : 0);
  }
  const recencyNorm = normalize(recencyRaw);
  const pairNorm = normalize(pairRaw);

  const scores = new Map<number, number>();
  for (let n = POOL_MIN; n <= POOL_MAX; n++) {
    scores.set(
      n,
      weights.freq * (freqNorm.get(n) ?? 0) +
        weights.recency * (recencyNorm.get(n) ?? 0) +
        weights.pair * (pairNorm.get(n) ?? 0),
    );
  }
  return scores;
}

function topN(scores: Map<number, number>, n: number, exclude: Set<number>, rng: () => number): number[] {
  const candidates = Array.from(scores.entries()).filter(([num]) => !exclude.has(num));
  // tie-break with the seeded PRNG by adding a tiny deterministic jitter
  candidates.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return rng() - 0.5;
  });
  return candidates.slice(0, n).map(([num]) => num);
}

function buildTierTicket(
  draws: Draw[],
  freqMap: Map<number, number>,
  coreSize: number,
  weights: { freq: number; recency: number; pair: number },
  rng: () => number,
): { core: number[]; numbers: number[] } {
  // Step 1: core = top `coreSize` by score (pair term relative to already-picked core members).
  let core: number[] = [];
  const scoresForCore = scoreAll(draws, freqMap, core, weights);
  core = topN(scoresForCore, coreSize, new Set(), rng);

  // Step 2: fill to 6 total using pairScore against the core.
  const fillCount = 6 - coreSize;
  const fillScores = scoreAll(draws, freqMap, core, { freq: 0, recency: 0, pair: 1 });
  const fillers = topN(fillScores, fillCount, new Set(core), rng);

  const numbers = [...core, ...fillers].sort((a, b) => a - b);
  return { core, numbers };
}

/** Builds the 5 tier suggestions for a given calendar date (YYYYMMDD seed). */
export function buildRecommendations(draws: Draw[], dateIso: string): TierSuggestion[] {
  const rng = seededRandom(dateIso.replaceAll('-', ''));
  const freq = computeFrequency(draws);
  const freqMap = new Map(freq.map((f) => [f.n, f.count]));
  const bonusFreq = computeBonusFrequency(draws);

  const results: TierSuggestion[] = [];
  let previousTicket: number[] = [];

  for (const tier of TIERS) {
    const { core, numbers } = buildTierTicket(draws, freqMap, tier.coreSize, tier.weights, rng);
    let finalNumbers = numbers;
    let bonusPick: number | undefined;

    if (tier.hasBonusPick) {
      const pick = bonusFreq.find((b) => !core.includes(b.n));
      bonusPick = pick?.n ?? bonusFreq[0]?.n;
    }

    // Avoid an identical ticket to the previous tier: swap the lowest-scoring
    // non-core number for the next best candidate outside the current ticket.
    if (
      previousTicket.length === finalNumbers.length &&
      finalNumbers.every((n) => previousTicket.includes(n))
    ) {
      const scores = scoreAll(draws, freqMap, core, tier.weights);
      const nonCore = finalNumbers.filter((n) => !core.includes(n));
      const lowest = nonCore.sort((a, b) => (scores.get(a) ?? 0) - (scores.get(b) ?? 0))[0];
      const replacement = topN(scores, 1, new Set(finalNumbers), rng)[0];
      if (lowest !== undefined && replacement !== undefined) {
        finalNumbers = finalNumbers
          .filter((n) => n !== lowest)
          .concat(replacement)
          .sort((a, b) => a - b);
      }
    }

    const coreLabel = core
      .slice()
      .sort((a, b) => a - b)
      .map((n) => String(n).padStart(2, '0'))
      .join(', ');

    results.push({
      tierId: tier.tierId,
      order: tier.order,
      numbers: finalNumbers,
      core,
      bonusPick,
      rationale: {
        key: 'rationale.topFreq',
        params: { k: tier.coreSize, draws: draws.length, nums: coreLabel },
      },
    });

    previousTicket = finalNumbers;
  }

  return results;
}
