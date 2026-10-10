import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../src/App';
import i18n from '../../src/i18n';
import draws from '../fixtures/draws.json';
import stats from '../fixtures/stats.json';
import recommendations from '../fixtures/recommendations.json';
import meta from '../fixtures/meta.json';
import { ResultsTable } from '../../src/components/ResultsTable';
import { todayIct } from '../../src/lib/dates';

// Mutable so a test can change what the server returns between refreshes.
let served: Record<string, unknown> = {};
let fetchedUrls: string[] = [];

function resetServed() {
  served = {
    'draws.json': structuredClone(draws),
    'stats.json': structuredClone(stats),
    'recommendations.json': structuredClone(recommendations),
    'meta.json': structuredClone(meta),
  };
  fetchedUrls = [];
}

beforeEach(async () => {
  await i18n.changeLanguage('vi');
  resetServed();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      fetchedUrls.push(url);
      // Match on the file name only; a manual refresh appends a `?t=` cache buster.
      const path = url.split('?')[0];
      const key = Object.keys(served).find((name) => path.endsWith(name));
      if (!key) throw new Error(`Unexpected fetch: ${url}`);
      return new Response(JSON.stringify(served[key]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App smoke', () => {
  it('renders the header, every prize tier and the history table', async () => {
    renderApp();

    expect(await screen.findByRole('banner')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByText(/Jackpot 1/i).length).toBeGreaterThan(0);
    });

    for (const tier of ['Giải Ba', 'Giải Nhì', 'Giải Nhất', 'Jackpot 2', 'Jackpot 1']) {
      expect(screen.getAllByText(new RegExp(tier, 'i')).length).toBeGreaterThan(0);
    }

    expect(screen.getByRole('table')).toBeTruthy();

    const latestDrawId = (draws as { draws: { drawId: string }[] }).draws[0].drawId;
    expect(screen.getAllByText(`#${latestDrawId}`).length).toBeGreaterThan(0);
  });

  it('renders six suggested numbers for every tier', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getAllByTestId('tier-card').length).toBe(5);
    });
    for (const card of screen.getAllByTestId('tier-card')) {
      expect(card.querySelectorAll('[data-testid="number-ball"]').length).toBeGreaterThanOrEqual(6);
    }
  });

  it('orders the tier cards from Jackpot 1 down to the easiest prize', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getAllByTestId('tier-card').length).toBe(5);
    });

    const headings = screen.getAllByTestId('tier-card').map((card) => card.textContent ?? '');
    expect(headings[0]).toContain('Jackpot 1');
    expect(headings[1]).toContain('Jackpot 2');
    expect(headings[2]).toContain('Giải Nhất');
    expect(headings[3]).toContain('Giải Nhì');
    expect(headings[4]).toContain('Giải Ba');
  });

  it('places the tier suggestions above the top 6 panel', async () => {
    const { container } = renderApp();

    await waitFor(() => {
      expect(screen.getAllByTestId('tier-card').length).toBe(5);
      expect(screen.getAllByTestId('top6-rank').length).toBeGreaterThan(0);
    });

    const hero = container.querySelector('#hero');
    const firstRank = screen.getAllByTestId('top6-rank')[0];
    expect(hero).toBeTruthy();

    const relation = hero!.compareDocumentPosition(firstRank);
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
})
describe('draw history search', () => {
  function renderHistory() {
    const recentDraws = draws.draws.map((draw) => ({ ...draw, date: todayIct() }));
    render(<ResultsTable draws={recentDraws} activeNumber={null} onClearActiveNumber={() => {}} />);
    return recentDraws[0].drawId;
  }

  it.each(['99', '0', 'abc'])('shows no results for an invalid search: %s', (search) => {
    const drawId = renderHistory();
    const input = screen.getByRole('textbox', { name: i18n.t('table.search') });
    expect(screen.getAllByText(`#${drawId}`).length).toBeGreaterThan(0);

    fireEvent.change(input, { target: { value: search } });

    expect(screen.queryByText(`#${drawId}`)).toBeNull();
    expect(screen.getAllByText(i18n.t('table.empty'))).toHaveLength(2);

    fireEvent.change(input, { target: { value: '' } });

    expect(screen.getAllByText(`#${drawId}`).length).toBeGreaterThan(0);
    expect(screen.queryByText(i18n.t('table.empty'))).toBeNull();
  });

  it('shows no results when valid numbers do not match any draw', () => {
    const drawId = renderHistory();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('table.match.all') }));
    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('table.search') }), {
      target: { value: '1 2 3 4 5 6 7 8' },
    });

    expect(screen.queryByText(`#${drawId}`)).toBeNull();
    expect(screen.getAllByText(i18n.t('table.empty'))).toHaveLength(2);
  });

  it('keeps all rows for a whitespace-only search', () => {
    const drawId = renderHistory();
    fireEvent.change(screen.getByRole('textbox', { name: i18n.t('table.search') }), {
      target: { value: '   ' },
    });

    expect(screen.getAllByText(`#${drawId}`).length).toBeGreaterThan(0);
    expect(screen.queryByText(i18n.t('table.empty'))).toBeNull();
  });
});

describe('refresh', () => {
  async function clickRefresh() {
    const button = await screen.findByRole('button', { name: /Làm mới/i });
    await act(async () => {
      fireEvent.click(button);
    });
    return button;
  }

  it('re-fetches every data file with a cache buster', async () => {
    renderApp();
    await screen.findAllByTestId('tier-card');

    fetchedUrls = [];
    await clickRefresh();

    await waitFor(() => {
      expect(fetchedUrls.filter((u) => u.includes('?t=')).length).toBeGreaterThanOrEqual(4);
    });

    for (const file of ['draws.json', 'stats.json', 'recommendations.json', 'meta.json']) {
      expect(fetchedUrls.some((u) => u.includes(file) && u.includes('?t='))).toBe(true);
    }
  });

  it('updates the existing last updated line after a successful refresh', async () => {
    renderApp();
    await screen.findAllByTestId('tier-card');

    const initialStamp = screen.getByTestId('footer-generated-at').textContent;
    expect(initialStamp).toContain(
      new Date(meta.generatedAt).toLocaleString('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    );
    expect(screen.queryByTestId('footer-refreshed-at')).toBeNull();

    await clickRefresh();

    await waitFor(() => {
      expect(screen.getByTestId('footer-generated-at').textContent).not.toBe(initialStamp);
    });
    expect(screen.getAllByTestId('footer-generated-at')).toHaveLength(1);
    expect(screen.getByTestId('footer-generated-at').textContent).toMatch(/Cập nhật lúc/);
    expect(screen.queryByTestId('footer-refreshed-at')).toBeNull();
    expect(screen.queryByText(/Đã làm mới lúc|Refreshed at/)).toBeNull();
  });

  it('re-forecasts the suggestions from newly fetched draws', async () => {
    renderApp();
    await screen.findAllByTestId('tier-card');

    const before = screen
      .getAllByTestId('tier-card')
      .map((c) => c.textContent)
      .join('|');

    // Serve a different draw history, as the daily cron would after a new draw.
    const next = structuredClone(draws) as { draws: Record<string, unknown>[] };
    next.draws[0] = {
      ...next.draws[0],
      drawId: '09999',
      date: '2026-10-11',
      numbers: [2, 3, 5, 8, 13, 21],
      bonus: 34,
    };
    served['draws.json'] = next;

    await clickRefresh();

    await waitFor(() => {
      expect(screen.getAllByText('#09999').length).toBeGreaterThan(0);
    });

    const after = screen
      .getAllByTestId('tier-card')
      .map((c) => c.textContent)
      .join('|');
    expect(after).not.toBe(before);
  });

  it('still shows five tier cards after re-forecasting', async () => {
    renderApp();
    await screen.findAllByTestId('tier-card');
    await clickRefresh();
    await waitFor(() => {
      expect(screen.getAllByTestId('tier-card').length).toBe(5);
    });
  });
});

describe('frequency chart layout', () => {
  it('keeps the toggle buttons the same width in both languages', async () => {
    const { container } = renderApp();
    await screen.findAllByTestId('tier-card');

    const widthsFor = () =>
      Array.from(container.querySelectorAll('[data-testid="chart-toggle"]')).map((b) => b.className);

    const vietnamese = widthsFor();
    expect(vietnamese.length).toBe(4);

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    const english = widthsFor();
    expect(english).toEqual(vietnamese);
  });
});
