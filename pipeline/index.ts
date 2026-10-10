import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { todayIct, expectedDrawDates, dateIsoDaysAgo } from '../src/lib/dates';
import { vietlottSource, SourceUnavailableError } from './sources/vietlott';
import { validateDraws } from './validate';
import { mergeDraws, pruneOldDraws, readDrawsFile, writeJsonAtomic } from './store';
import { buildRecommendationsPayload, buildStatsPayload } from './snapshot';
import { WINDOW_DAYS } from '../src/config/game';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const DRAWS_PATH = path.join(DATA_DIR, 'draws.json');
const STATS_PATH = path.join(DATA_DIR, 'stats.json');
const RECOMMENDATIONS_PATH = path.join(DATA_DIR, 'recommendations.json');
const META_PATH = path.join(DATA_DIR, 'meta.json');
const FETCH_LOG_PATH = path.join(ROOT, 'data', 'fetch-log.json');

interface FetchLogEntry {
  at: string;
  status: 'ok' | 'partial' | 'failed';
  newDraws: number;
  message: string | null;
}

async function readFetchLog(): Promise<FetchLogEntry[]> {
  try {
    const raw = await readFile(FETCH_LOG_PATH, 'utf-8');
    return (JSON.parse(raw).runs ?? []) as FetchLogEntry[];
  } catch {
    return [];
  }
}

function parseArgs(argv: string[]): { backfillDays: number } {
  const arg = argv.find((a) => a.startsWith('--backfill-days='));
  const backfillDays = arg ? Number(arg.split('=')[1]) : 0;
  return { backfillDays: Number.isFinite(backfillDays) ? backfillDays : 0 };
}

async function main(): Promise<void> {
  const today = todayIct();
  const { backfillDays } = parseArgs(process.argv.slice(2));

  const existing = await readDrawsFile(DRAWS_PATH);
  const isFirstRun = existing.draws.length === 0;

  let from: string;
  if (backfillDays > 0) {
    from = dateIsoDaysAgo(today, backfillDays);
  } else if (isFirstRun) {
    from = dateIsoDaysAgo(today, WINDOW_DAYS);
  } else {
    const newestDate = existing.draws.reduce((max, d) => (d.date > max ? d.date : max), existing.draws[0].date);
    from = dateIsoDaysAgo(newestDate, -1); // newestDate + 1 day
  }
  const to = today;

  const expected = expectedDrawDates(from, to);

  let fetched: Awaited<ReturnType<typeof vietlottSource.fetchDraws>> = [];
  let runStatus: FetchLogEntry['status'] = 'ok';
  let runMessage: string | null = null;

  try {
    fetched = await vietlottSource.fetchDraws(from, to);
  } catch (err) {
    if (err instanceof SourceUnavailableError) {
      runStatus = 'partial';
      runMessage = err.message;
      fetched = [];
    } else {
      throw err;
    }
  }

  const { valid, rejected } = validateDraws(fetched, today);
  for (const r of rejected) {
    console.warn(`[pipeline] rejected draw ${r.draw.drawId ?? '(no id)'}: ${r.reason}`);
  }

  const fetchedAt = new Date().toISOString();
  const validWithFetchedAt = valid.map((d) => ({ ...d, fetchedAt }));

  const merged = mergeDraws(existing.draws, validWithFetchedAt);
  const pruned = pruneOldDraws(merged, today);

  await writeJsonAtomic(DRAWS_PATH, { schemaVersion: 1, draws: pruned });
  await writeJsonAtomic(STATS_PATH, buildStatsPayload(pruned, today));
  await writeJsonAtomic(RECOMMENDATIONS_PATH, buildRecommendationsPayload(pruned, today));

  const lastDrawDate = pruned[0]?.date ?? null;
  await writeJsonAtomic(META_PATH, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    lastDrawDate,
    drawCount: pruned.length,
    lastRun: { at: new Date().toISOString(), status: runStatus, newDraws: valid.length, message: runMessage },
  });

  const log = await readFetchLog();
  log.unshift({ at: new Date().toISOString(), status: runStatus, newDraws: valid.length, message: runMessage });
  await writeJsonAtomic(FETCH_LOG_PATH, { schemaVersion: 1, runs: log.slice(0, 30) });

  // Fail the workflow visibly only if the source was unavailable AND a draw is
  // overdue by more than 48 hours (so GitHub emails the repo owner).
  const mostOverdue = expected.find((d) => !pruned.some((draw) => draw.date === d));
  if (runStatus !== 'ok' && mostOverdue) {
    const hoursOverdue = (Date.parse(today) - Date.parse(mostOverdue)) / 36e5;
    if (hoursOverdue > 48) {
      console.error(`[pipeline] vietlott.vn unavailable and draw ${mostOverdue} is overdue by ${hoursOverdue.toFixed(0)}h`);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`[pipeline] ok. draws=${pruned.length} newDraws=${valid.length} status=${runStatus}`);
}

main().catch((err) => {
  console.error('[pipeline] fatal error', err);
  process.exitCode = 1;
});
