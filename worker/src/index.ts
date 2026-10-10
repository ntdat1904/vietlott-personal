import { WINDOW_MS, hashIp, matchOrigin, rankTop, validateTicket } from './picks';
import type { NumberCount } from './picks';

export interface Env {
  DB: D1Database;
  IP_SALT: string;
  ALLOWED_ORIGINS: string;
}

/**
 * Routes:
 *   POST /api/picks       { numbers: number[6] } -> stores the caller's ticket (one per IP; replaces the previous one)
 *   GET  /api/picks/top   -> top 6 most-picked numbers over the last 24h, ticket count, and the caller's own ticket
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = matchOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGINS ?? '');
    const cors: Record<string, string> = origin
      ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        }
      : { Vary: 'Origin' };
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!env.IP_SALT) return json({ error: 'server misconfigured: IP_SALT is not set' }, 500);

    // CF-Connecting-IP is set by Cloudflare's edge and cannot be spoofed by the client.
    // `wrangler dev` sets it too (to the loopback address).
    const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
    const ipHash = await hashIp(ip, env.IP_SALT);
    const path = new URL(request.url).pathname.replace(/\/$/, '');

    try {
      if (path === '/api/picks' && request.method === 'POST') {
        if (!origin) return json({ error: 'origin not allowed' }, 403);
        const body = (await request.json().catch(() => null)) as { numbers?: unknown } | null;
        const result = validateTicket(body?.numbers);
        if (!result.ok) return json({ error: result.error }, 400);

        const now = Date.now();
        const ua = (request.headers.get('User-Agent') ?? '').slice(0, 300);
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO picks (ip_hash, numbers, user_agent, created_at) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(ip_hash) DO UPDATE SET numbers = ?2, user_agent = ?3, created_at = ?4`,
          ).bind(ipHash, JSON.stringify(result.numbers), ua, now),
          env.DB.prepare('DELETE FROM pick_numbers WHERE ip_hash = ?1').bind(ipHash),
          ...result.numbers.map((n) =>
            env.DB.prepare('INSERT INTO pick_numbers (ip_hash, n, created_at) VALUES (?1, ?2, ?3)').bind(
              ipHash,
              n,
              now,
            ),
          ),
        ]);
        return json({ numbers: result.numbers, submittedAt: new Date(now).toISOString() }, 201);
      }

      if (path === '/api/picks/top' && request.method === 'GET') {
        const since = Date.now() - WINDOW_MS;
        const [counts, total, mine] = await env.DB.batch<Record<string, unknown>>([
          env.DB.prepare(
            'SELECT n, COUNT(*) AS count FROM pick_numbers WHERE created_at > ?1 GROUP BY n',
          ).bind(since),
          env.DB.prepare('SELECT COUNT(*) AS total FROM picks WHERE created_at > ?1').bind(since),
          env.DB.prepare('SELECT numbers, created_at FROM picks WHERE ip_hash = ?1 AND created_at > ?2').bind(
            ipHash,
            since,
          ),
        ]);
        const mineRow = mine.results[0] as { numbers: string; created_at: number } | undefined;
        return json({
          windowHours: 24,
          totalTickets: Number((total.results[0] as { total: number } | undefined)?.total ?? 0),
          top6: rankTop(counts.results as unknown as NumberCount[]),
          mine: mineRow
            ? { numbers: JSON.parse(mineRow.numbers) as number[], submittedAt: new Date(mineRow.created_at).toISOString() }
            : null,
        });
      }

      return json({ error: 'not found' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'internal error' }, 500);
    }
  },

  // Purge tickets that have left the 24h window.
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    const cutoff = Date.now() - WINDOW_MS;
    await env.DB.batch([
      env.DB.prepare('DELETE FROM pick_numbers WHERE created_at <= ?1').bind(cutoff),
      env.DB.prepare('DELETE FROM picks WHERE created_at <= ?1').bind(cutoff),
    ]);
  },
};
