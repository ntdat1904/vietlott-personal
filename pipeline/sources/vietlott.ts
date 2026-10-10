import * as cheerio from 'cheerio';
import { setTimeout as sleep } from 'node:timers/promises';
import type { ParsedDraw, Source } from './Source';

export type { ParsedDraw, Source };

export class SourceUnavailableError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SourceUnavailableError';
  }
}

/**
 * vietlott.vn Power 6/55 results source.
 *
 * Selectors below were read from the live markup (see tests/fixtures/vietlott-*.html,
 * which are trimmed captures of the real pages). Keeping every site-specific detail in
 * this one config object means a redesign only requires changing this file.
 *
 * The site exposes the data across two pages:
 *  - the listing page: date, draw id, 6 main numbers + bonus for the most recent draws
 *  - a per-draw detail page: the Jackpot 1 / Jackpot 2 prize amounts
 */
const CONFIG = {
  listUrl: 'https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/winning-number-655',
  detailUrl: (drawId: string) =>
    `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/655?id=${encodeURIComponent(drawId)}&nocatche=1`,
  // The site rejects obviously-automated agents, so present a normal browser UA.
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Politeness: never issue requests faster than this. vietlott.vn returns
  // HTTP 429 to bursty clients, so keep a comfortable gap between requests.
  minRequestIntervalMs: 2500,
  timeoutMs: 15_000,
  retries: 3,
  backoffMs: [2000, 5000, 15_000],
  // 429/503 mean "slow down" rather than "broken", so they get their own,
  // much longer waits before we give up on the run.
  throttledBackoffMs: [15_000, 30_000, 60_000],
  maxRetryAfterMs: 120_000,
  selectors: {
    // The results listing lives in a single `.table-hover` inside `.doso_output_nd`.
    row: '.doso_output_nd table tbody tr',
    drawIdCell: 'td:nth-child(2)',
    dateCell: 'td:nth-child(1)',
    numbersCell: 'td:nth-child(3)',
    // `.bong_tron` matches only the result balls; the `|` divider carries the
    // distinct `bong_tron-sperator` class and is therefore not selected.
    ball: 'span.bong_tron',
    prizeRow: 'table.table-hover tbody tr',
  },
};

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + CONFIG.minRequestIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

class HttpStatusError extends Error {
  constructor(readonly status: number, readonly retryAfterMs?: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpStatusError';
  }
}

/** Reads a `Retry-After` header expressed either in seconds or as an HTTP date. */
function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, CONFIG.maxRetryAfterMs);
  }
  const at = Date.parse(header);
  if (!Number.isNaN(at)) {
    return Math.min(Math.max(at - Date.now(), 0), CONFIG.maxRetryAfterMs);
  }
  return undefined;
}

async function fetchWithRetry(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= CONFIG.retries; attempt++) {
    try {
      await throttle();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': CONFIG.userAgent,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'vi,en;q=0.8',
          },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new HttpStatusError(res.status, parseRetryAfter(res.headers.get('retry-after')));
        }
        return await res.text();
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      lastError = err;
      if (attempt >= CONFIG.retries) break;

      const throttled = err instanceof HttpStatusError && (err.status === 429 || err.status === 503);
      const wait = throttled
        ? (err as HttpStatusError).retryAfterMs ?? CONFIG.throttledBackoffMs[attempt]
        : CONFIG.backoffMs[attempt];

      if (throttled) {
        console.warn(`[vietlott] rate limited (HTTP ${(err as HttpStatusError).status}), waiting ${wait}ms`);
        // Push the shared throttle out too, so sibling requests also slow down.
        lastRequestAt = Date.now() + wait;
      }
      await sleep(wait);
    }
  }
  throw new SourceUnavailableError(
    `vietlott.vn unavailable after ${CONFIG.retries} retries: ${url}`,
    lastError,
  );
}

/** Turns "3.800.633.150" (vi-VN grouping) into 3800633150. */
function parseVndAmount(text: string): number | undefined {
  const digits = text.replace(/\D/g, '');
  if (!digits) return undefined;
  const value = Number(digits);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function toIsoDate(ddmmyyyy: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(ddmmyyyy.trim());
  if (!match) return '';
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

export function parseResultsHtml(html: string, from: string, to: string): ParsedDraw[] {
  const $ = cheerio.load(html);
  const draws: ParsedDraw[] = [];

  $(CONFIG.selectors.row).each((_, el) => {
    const $row = $(el);

    const drawId = $row.find(CONFIG.selectors.drawIdCell).text().trim();
    const date = toIsoDate($row.find(CONFIG.selectors.dateCell).text());

    const balls = $row
      .find(CONFIG.selectors.numbersCell)
      .find(CONFIG.selectors.ball)
      .map((_i, ballEl) => Number($(ballEl).text().trim()))
      .get()
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);

    // 6 main numbers followed by the bonus ball.
    if (!drawId || !date || balls.length !== 7) return;
    if (date < from || date > to) return;

    const numbers = balls.slice(0, 6);
    const bonus = balls[6];
    if (new Set(numbers).size !== 6) return;

    draws.push({
      drawId,
      date,
      numbers: [...numbers].sort((a, b) => a - b),
      bonus,
      sourceUrl: CONFIG.detailUrl(drawId),
    });
  });

  return draws;
}

/** Reads the Jackpot 1 / Jackpot 2 amounts from a single draw's detail page. */
export function parsePrizesHtml(html: string): {
  jackpot1Vnd?: number;
  jackpot2Vnd?: number;
} {
  const $ = cheerio.load(html);
  const result: { jackpot1Vnd?: number; jackpot2Vnd?: number } = {};

  $(CONFIG.selectors.prizeRow).each((_, el) => {
    const cells = $(el).find('td');
    if (cells.length < 2) return;

    const label = $(cells[0]).text().trim().toLowerCase();
    const amount = parseVndAmount($(cells[cells.length - 1]).text());
    if (amount === undefined) return;

    if (label === 'jackpot 1') result.jackpot1Vnd = amount;
    else if (label === 'jackpot 2') result.jackpot2Vnd = amount;
  });

  return result;
}

export const vietlottSource: Source = {
  async fetchDraws(from, to) {
    const html = await fetchWithRetry(CONFIG.listUrl);
    const draws = parseResultsHtml(html, from, to);

    // A page that loads but yields no parseable result (layout change, maintenance
    // page, or simply no draws in range) is treated as "nothing new", not a crash.
    // The caller decides whether that is an error based on how overdue a draw is.
    if (draws.length === 0) return [];

    // Prize amounts only exist on the per-draw page. They are optional, so a single
    // failing detail page degrades that draw rather than failing the whole run.
    for (const draw of draws) {
      try {
        const detail = await fetchWithRetry(CONFIG.detailUrl(draw.drawId));
        Object.assign(draw, parsePrizesHtml(detail));
      } catch (err) {
        if (!(err instanceof SourceUnavailableError)) throw err;
      }
    }

    return draws;
  },
};

// Exported for unit tests against saved HTML fixtures.
export const __testing__ = {
  parseResultsHtml,
  parsePrizesHtml,
  parseVndAmount,
  toIsoDate,
  parseRetryAfter,
  CONFIG,
};
