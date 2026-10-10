import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../src/i18n';
import { CommunityPicks } from '../../src/components/CommunityPicks';
import type { CommunityTop } from '../../src/lib/picksApi';

let topResponse: CommunityTop;
let posted: unknown[] = [];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  posted = [];
  topResponse = {
    windowHours: 24,
    totalTickets: 4,
    top6: [
      { n: 7, count: 4 },
      { n: 12, count: 3 },
      { n: 1, count: 2 },
      { n: 33, count: 2 },
      { n: 40, count: 1 },
      { n: 55, count: 1 },
    ],
    mine: null,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/picks/top')) return Response.json(topResponse);
      if (url.endsWith('/api/picks') && init?.method === 'POST') {
        const { numbers } = JSON.parse(String(init.body)) as { numbers: number[] };
        posted.push(numbers);
        topResponse = { ...topResponse, mine: { numbers, submittedAt: new Date().toISOString() } };
        return Response.json({ numbers, submittedAt: new Date().toISOString() }, { status: 201 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPicks() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CommunityPicks />
    </QueryClientProvider>,
  );
}

describe('CommunityPicks', () => {
  it('shows the 24h community top 6 with ticket count', async () => {
    renderPicks();
    const list = await screen.findByTestId('community-top6');
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('4 tickets submitted in the last 24 hours')).toBeTruthy();
  });

  it('only enables submit at exactly 6 numbers, caps the selection, and posts them sorted', async () => {
    renderPicks();
    await screen.findByTestId('community-top6');
    const balls = screen.getAllByTestId('pick-number');
    expect(balls).toHaveLength(55);

    const submit = screen.getByTestId('submit-pick') as HTMLButtonElement;
    for (const n of [30, 2, 18, 5, 44]) fireEvent.click(balls[n - 1]);
    expect(submit.disabled).toBe(true);
    fireEvent.click(balls[9]); // 10
    expect(submit.disabled).toBe(false);
    // A 7th number cannot be added.
    expect((balls[49] as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(submit);
    await waitFor(() => expect(posted).toEqual([[2, 5, 10, 18, 30, 44]]));
    const mine = await screen.findByTestId('my-pick');
    expect(within(mine).getAllByTestId('number-ball').map((b) => b.textContent)).toEqual([
      '02', '05', '10', '18', '30', '44',
    ]);
    expect(screen.getByTestId('submit-pick').textContent).toContain('Replace my ticket');
  });
});
