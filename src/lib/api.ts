import { Draw, FrequencyEntry, TrendPoint } from './frequency';
import { TierSuggestion } from './recommend';

export interface DrawsFile {
  schemaVersion: 1;
  draws: Draw[];
}

export interface Meta {
  schemaVersion: 1;
  generatedAt: string;
  lastDrawDate: string | null;
  drawCount: number;
  lastRun: { at: string; status: 'ok' | 'partial' | 'failed'; newDraws: number; message: string | null };
}

export interface StatsPayload {
  schemaVersion: 1;
  windowDays: 30;
  drawCount: number;
  from: string;
  to: string;
  frequency: FrequencyEntry[];
  bonusFrequency: { n: number; count: number }[];
  top6: number[];
  trend: TrendPoint[];
}

export interface RecommendationsPayload {
  schemaVersion: 1;
  date: string;
  windowDays: 30;
  drawCount: number;
  tiers: TierSuggestion[];
}

const base = () => (import.meta.env.BASE_URL ?? '/') + 'data/';

/**
 * `bust` is a timestamp supplied when the user presses Refresh. It both changes
 * the URL and forces a network trip, so a static host or CDN (GitHub Pages
 * included) cannot answer with a cached copy of a file the cron has replaced.
 */
function get<T>(file: string, bust?: number): Promise<T> {
  const url = bust ? `${base()}${file}?t=${bust}` : base() + file;
  return fetch(url, { cache: bust ? 'reload' : 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`${file}: ${r.status}`);
    return r.json() as Promise<T>;
  });
}

export const getMeta = (bust?: number) => get<Meta>('meta.json', bust);
export const getDraws = (bust?: number) => get<DrawsFile>('draws.json', bust);
export const getStats = (bust?: number) => get<StatsPayload>('stats.json', bust);
export const getRecommendations = (bust?: number) =>
  get<RecommendationsPayload>('recommendations.json', bust);

const CACHE_PREFIX = 'lottery.cache.';

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}
