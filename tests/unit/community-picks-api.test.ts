import { describe, expect, it } from 'vitest';
import { hashIp, matchOrigin, rankTop, validateTicket } from '../../worker/src/picks';

describe('validateTicket', () => {
  it('accepts 6 distinct numbers in range and sorts them', () => {
    expect(validateTicket([55, 3, 12, 1, 40, 7])).toEqual({ ok: true, numbers: [1, 3, 7, 12, 40, 55] });
  });

  it.each([
    ['not an array', '1,2,3,4,5,6'],
    ['too few', [1, 2, 3, 4, 5]],
    ['too many', [1, 2, 3, 4, 5, 6, 7]],
    ['duplicates', [1, 1, 2, 3, 4, 5]],
    ['zero', [0, 1, 2, 3, 4, 5]],
    ['above 55', [1, 2, 3, 4, 5, 56]],
    ['non-integer', [1, 2, 3, 4, 5, 6.5]],
    ['string numbers', ['1', 2, 3, 4, 5, 6]],
  ])('rejects %s', (_label, input) => {
    expect(validateTicket(input).ok).toBe(false);
  });
});

describe('rankTop', () => {
  it('orders by count desc, then lower number first, and keeps 6', () => {
    const counts = [
      { n: 9, count: 2 },
      { n: 4, count: 5 },
      { n: 2, count: 2 },
      { n: 30, count: 1 },
      { n: 11, count: 3 },
      { n: 50, count: 1 },
      { n: 7, count: 1 },
    ];
    expect(rankTop(counts).map((c) => c.n)).toEqual([4, 11, 2, 9, 7, 30]);
  });
});

describe('hashIp', () => {
  it('is deterministic per salt and never contains the raw IP', async () => {
    const a = await hashIp('203.0.113.5', 'salt');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashIp('203.0.113.5', 'salt')).toBe(a);
    expect(await hashIp('203.0.113.5', 'other')).not.toBe(a);
    expect(await hashIp('203.0.113.6', 'salt')).not.toBe(a);
  });
});

describe('matchOrigin', () => {
  it('echoes only listed origins', () => {
    const allowed = 'http://localhost:5173, https://me.github.io/';
    expect(matchOrigin('https://me.github.io', allowed)).toBe('https://me.github.io');
    expect(matchOrigin('https://evil.example', allowed)).toBeNull();
    expect(matchOrigin(null, allowed)).toBeNull();
  });
});
