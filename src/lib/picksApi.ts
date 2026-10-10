// Client for the community-picks Worker (worker/). The feature is hidden when
// VITE_PICKS_API_URL is not set, so the static site still works on its own.

export interface CommunityTop {
  windowHours: number;
  totalTickets: number;
  top6: { n: number; count: number }[];
  mine: { numbers: number[]; submittedAt: string } | null;
}

export const PICKS_API_URL: string = (import.meta.env.VITE_PICKS_API_URL ?? '').replace(/\/$/, '');

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(PICKS_API_URL + path, { cache: 'no-store', ...init });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export const getCommunityTop = () => call<CommunityTop>('/api/picks/top');

export const submitPick = (numbers: number[]) =>
  call<{ numbers: number[]; submittedAt: string }>('/api/picks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numbers }),
  });
