import type { Draw } from '../src/lib/frequency';
import { computeBonusFrequency, computeFrequency, computeTrend, topSix } from '../src/lib/frequency';
import { buildRecommendations } from '../src/lib/recommend';
import { windowStart } from '../src/lib/dates';

export interface StatsPayload {
  schemaVersion: 1;
  windowDays: 30;
  drawCount: number;
  from: string;
  to: string;
  frequency: ReturnType<typeof computeFrequency>;
  bonusFrequency: ReturnType<typeof computeBonusFrequency>;
  top6: number[];
  trend: ReturnType<typeof computeTrend>;
}

export interface RecommendationsPayload {
  schemaVersion: 1;
  date: string;
  windowDays: 30;
  drawCount: number;
  tiers: ReturnType<typeof buildRecommendations>;
}

export function buildStatsPayload(draws: Draw[], todayIso: string): StatsPayload {
  const frequency = computeFrequency(draws);
  const top6 = topSix(frequency);
  const sortedOldestFirst = [...draws].sort((a, b) => (a.date > b.date ? 1 : -1));
  return {
    schemaVersion: 1,
    windowDays: 30,
    drawCount: draws.length,
    from: sortedOldestFirst[0]?.date ?? windowStart(todayIso),
    to: sortedOldestFirst[sortedOldestFirst.length - 1]?.date ?? todayIso,
    frequency,
    bonusFrequency: computeBonusFrequency(draws),
    top6,
    trend: computeTrend(draws, top6),
  };
}

export function buildRecommendationsPayload(draws: Draw[], todayIso: string): RecommendationsPayload {
  return {
    schemaVersion: 1,
    date: todayIso,
    windowDays: 30,
    drawCount: draws.length,
    tiers: buildRecommendations(draws, todayIso),
  };
}
