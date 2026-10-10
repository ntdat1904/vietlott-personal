// Pure helpers for the community-picks API. No Worker/D1 types here, so the
// root Vitest suite can import and test this file directly.

export const POOL_MIN = 1;
export const POOL_MAX = 55;
export const TICKET_SIZE = 6;
export const WINDOW_MS = 24 * 60 * 60 * 1000;

export type ValidationResult = { ok: true; numbers: number[] } | { ok: false; error: string };

/** Accepts exactly 6 distinct integers in 1..55; returns them sorted ascending. */
export function validateTicket(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return { ok: false, error: 'numbers must be an array' };
  if (input.length !== TICKET_SIZE) return { ok: false, error: `pick exactly ${TICKET_SIZE} numbers` };
  if (!input.every((n) => Number.isInteger(n) && n >= POOL_MIN && n <= POOL_MAX)) {
    return { ok: false, error: `numbers must be integers ${POOL_MIN}-${POOL_MAX}` };
  }
  if (new Set(input).size !== TICKET_SIZE) return { ok: false, error: 'numbers must be distinct' };
  return { ok: true, numbers: [...(input as number[])].sort((a, b) => a - b) };
}

/**
 * SHA-256 of salt + IP. The raw IP is never stored; the salt keeps the hash
 * from being reversed by brute-forcing the IPv4 space.
 */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface NumberCount {
  n: number;
  count: number;
}

/** Most-picked first; ties go to the lower number so the order is stable. */
export function rankTop(counts: NumberCount[], limit = TICKET_SIZE): NumberCount[] {
  return [...counts].sort((a, b) => b.count - a.count || a.n - b.n).slice(0, limit);
}

/** Returns the allowed origin to echo back, or null if the origin is not allowed. */
export function matchOrigin(origin: string | null, allowed: string): string | null {
  if (!origin) return null;
  const list = allowed
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return list.includes(origin) ? origin : null;
}
