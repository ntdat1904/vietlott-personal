// Single place for Power 6/55 domain facts. Verify against vietlott.vn before shipping.
export const POOL_MIN = 1;
export const POOL_MAX = 55;
export const MAIN_NUMBERS_COUNT = 6;
export const DRAW_DAYS = [2, 4, 6] as const; // JS getDay(): Tue=2, Thu=4, Sat=6
export const DRAW_HOUR_ICT = 18;
export const WINDOW_DAYS = 30;
export const TIMEZONE = 'Asia/Ho_Chi_Minh';

export type TierId = 'third' | 'second' | 'first' | 'jackpot2' | 'jackpot1';

export interface TierConfig {
  tierId: TierId;
  order: 1 | 2 | 3 | 4 | 5;
  badge: string; // T1..T5, shown on the card header
  matchRule: string; // translation key suffix, see locales
  coreSize: number; // k
  weights: { freq: number; recency: number; pair: number };
  hasBonusPick: boolean;
  indicativeValueVnd: number | null; // null = variable (jackpots)
  minJackpotVnd?: number; // for the variable tiers
  odds: string; // indicative odds for a single ticket
}

// Order follows the required display order: biggest prize (Jackpot 1) first,
// descending to the easiest tier. `badge` follows that same left-to-right position.
export const TIERS: TierConfig[] = [
  {
    tierId: 'third',
    order: 5,
    badge: 'T5',
    matchRule: 'match3',
    coreSize: 3,
    weights: { freq: 1.0, recency: 0.0, pair: 0.0 },
    hasBonusPick: false,
    indicativeValueVnd: 50_000,
    odds: '1/79',
  },
  {
    tierId: 'second',
    order: 4,
    badge: 'T4',
    matchRule: 'match4',
    coreSize: 4,
    weights: { freq: 0.8, recency: 0.2, pair: 0.0 },
    hasBonusPick: false,
    indicativeValueVnd: 500_000,
    odds: '1/1.643',
  },
  {
    tierId: 'first',
    order: 3,
    badge: 'T3',
    matchRule: 'match5',
    coreSize: 5,
    weights: { freq: 0.6, recency: 0.2, pair: 0.2 },
    hasBonusPick: false,
    indicativeValueVnd: 40_000_000,
    odds: '1/100.659',
  },
  {
    tierId: 'jackpot2',
    order: 2,
    badge: 'T2',
    matchRule: 'match5Bonus',
    coreSize: 5,
    weights: { freq: 0.6, recency: 0.2, pair: 0.2 },
    hasBonusPick: true,
    indicativeValueVnd: null,
    minJackpotVnd: 3_000_000_000,
    odds: '1/4.831.613',
  },
  {
    tierId: 'jackpot1',
    order: 1,
    badge: 'T1',
    matchRule: 'match6',
    coreSize: 6,
    weights: { freq: 0.5, recency: 0.25, pair: 0.25 },
    hasBonusPick: false,
    indicativeValueVnd: null,
    minJackpotVnd: 30_000_000_000,
    odds: '1/28.989.675',
  },
];

// Tier header gradients, sampled from the design mockup. Each tier gets its own
// hue so the five cards are distinguishable at a glance; white text meets WCAG AA
// contrast against all five backgrounds.
export const tierHeaderColors: Record<TierId, { gradient: string; text: string }> = {
  third: { gradient: 'from-[#00a6f3] to-[#00b5df]', text: 'text-white' },
  second: { gradient: 'from-[#00bc7e] to-[#00bb9f]', text: 'text-white' },
  first: { gradient: 'from-[#8e50ff] to-[#9623fc]', text: 'text-white' },
  jackpot2: { gradient: 'from-[#ffb600] to-[#ff7800]', text: 'text-white' },
  jackpot1: { gradient: 'from-[#fa2a37] to-[#ee003e]', text: 'text-white' },
};

export const SMALL_SAMPLE_THRESHOLD = 8; // draws
export const STALE_DATA_DAYS = 3;
