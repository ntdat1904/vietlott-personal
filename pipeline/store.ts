import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Draw } from '../src/lib/frequency';
import { dateIsoDaysAgo } from '../src/lib/dates';
import { WINDOW_DAYS } from '../src/config/game';
import { hasDuplicateDrawIds } from './validate';

export interface DrawsFile {
  schemaVersion: 1;
  draws: Draw[];
}

export async function readDrawsFile(path: string): Promise<DrawsFile> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as DrawsFile;
  } catch {
    return { schemaVersion: 1, draws: [] };
  }
}

/** Atomic write: write to a temp file, then rename over the target. */
export async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  await rename(tmpPath, path);
}

/** Merge new draws into the existing file by drawId (replace, never duplicate), sort newest first. */
export function mergeDraws(existing: Draw[], incoming: Draw[]): Draw[] {
  const byId = new Map<string, Draw>();
  for (const d of existing) byId.set(d.drawId, d);
  for (const d of incoming) byId.set(d.drawId, d);
  const merged = Array.from(byId.values());
  if (hasDuplicateDrawIds(merged)) {
    throw new Error('merge produced duplicate drawId, aborting write');
  }
  return merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Keep only the last WINDOW_DAYS of draws, relative to today. */
export function pruneOldDraws(draws: Draw[], todayIso: string): Draw[] {
  const cutoff = dateIsoDaysAgo(todayIso, WINDOW_DAYS);
  return draws.filter((d) => d.date >= cutoff);
}
