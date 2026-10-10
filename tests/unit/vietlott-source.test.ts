import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { __testing__ } from '../../pipeline/sources/vietlott';

const { parseResultsHtml, parsePrizesHtml, toIsoDate, parseRetryAfter, CONFIG } = __testing__;

const listHtml = readFileSync(join(__dirname, '../fixtures/vietlott-list.html'), 'utf-8');
const detailHtml = readFileSync(join(__dirname, '../fixtures/vietlott-detail.html'), 'utf-8');

const ALL = { from: '1900-01-01', to: '2999-12-31' };

describe('vietlott listing parser', () => {
  it('parses every result row from the real markup', () => {
    const draws = parseResultsHtml(listHtml, ALL.from, ALL.to);
    expect(draws.length).toBe(8);
  });

  it('parses the newest draw exactly', () => {
    const [newest] = parseResultsHtml(listHtml, ALL.from, ALL.to);
    expect(newest.drawId).toBe('01408');
    expect(newest.date).toBe('2026-10-08');
    expect(newest.numbers).toEqual([1, 7, 12, 27, 31, 52]);
    expect(newest.bonus).toBe(6);
    expect(newest.sourceUrl).toContain('id=01408');
  });

  it('never confuses the bonus ball with a main number', () => {
    for (const draw of parseResultsHtml(listHtml, ALL.from, ALL.to)) {
      expect(draw.numbers).toHaveLength(6);
      expect(new Set(draw.numbers).size).toBe(6);
      expect(draw.numbers.every((n) => n >= 1 && n <= 55)).toBe(true);
      expect(draw.bonus).toBeGreaterThanOrEqual(1);
      expect(draw.bonus).toBeLessThanOrEqual(55);
      expect([...draw.numbers]).toEqual([...draw.numbers].sort((a, b) => a - b));
    }
  });

  it('honours the requested date window', () => {
    const draws = parseResultsHtml(listHtml, '2026-10-01', '2026-10-06');
    expect(draws.map((d) => d.date)).toEqual(['2026-10-06', '2026-10-03', '2026-10-01']);
  });

  it('returns nothing rather than throwing when the layout changes', () => {
    expect(parseResultsHtml('<html><body><p>maintenance</p></body></html>', ALL.from, ALL.to)).toEqual([]);
  });
});

describe('vietlott detail parser', () => {
  it('reads both jackpot amounts from the real prize table', () => {
    expect(parsePrizesHtml(detailHtml)).toEqual({
      jackpot1Vnd: 129_672_825_150,
      jackpot2Vnd: 3_800_633_150,
    });
  });

  it('ignores non-jackpot prize rows', () => {
    const prizes = parsePrizesHtml(detailHtml);
    expect(Object.values(prizes)).not.toContain(40_000_000);
    expect(Object.values(prizes)).not.toContain(50_000);
  });

  it('degrades gracefully on an unexpected page', () => {
    expect(parsePrizesHtml('<html><body></body></html>')).toEqual({});
  });
});

describe('toIsoDate', () => {
  it('converts dd/mm/yyyy to ISO', () => {
    expect(toIsoDate('08/10/2026')).toBe('2026-10-08');
    expect(toIsoDate('1/2/2026')).toBe('2026-02-01');
  });

  it('rejects junk', () => {
    expect(toIsoDate('not a date')).toBe('');
    expect(toIsoDate('2026-10-08')).toBe('');
  });
});

describe('rate limiting', () => {
  it('reads Retry-After given in seconds', () => {
    expect(parseRetryAfter('30')).toBe(30_000);
  });

  it('reads Retry-After given as an HTTP date', () => {
    const at = new Date(Date.now() + 20_000).toUTCString();
    const ms = parseRetryAfter(at)!;
    expect(ms).toBeGreaterThan(10_000);
    expect(ms).toBeLessThanOrEqual(21_000);
  });

  it('caps absurd Retry-After values', () => {
    expect(parseRetryAfter('99999')).toBe(CONFIG.maxRetryAfterMs);
  });

  it('never returns a negative wait for a past date', () => {
    expect(parseRetryAfter(new Date(Date.now() - 60_000).toUTCString())).toBe(0);
  });

  it('ignores a missing or unparseable header', () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter('soon')).toBeUndefined();
  });

  it('keeps a polite gap between requests', () => {
    expect(CONFIG.minRequestIntervalMs).toBeGreaterThanOrEqual(2000);
  });
});
