import { test, expect, type Page } from '@playwright/test';
import draws from '../fixtures/draws.json' with { type: 'json' };
import stats from '../fixtures/stats.json' with { type: 'json' };
import recommendations from '../fixtures/recommendations.json' with { type: 'json' };
import meta from '../fixtures/meta.json' with { type: 'json' };

async function mockData(page: Page) {
  await page.route('**/data/draws.json', (route) => route.fulfill({ json: draws }));
  await page.route('**/data/stats.json', (route) => route.fulfill({ json: stats }));
  await page.route('**/data/recommendations.json', (route) => route.fulfill({ json: recommendations }));
  await page.route('**/data/meta.json', (route) => route.fulfill({ json: meta }));
}

test('E2E-06: the top 6 panel states how many draws it is based on', async ({ page }) => {
  await mockData(page);
  await page.goto('/?lang=en');

  await expect(page.getByText(/Top 6 most frequent numbers/i)).toBeVisible();
  await expect(page.getByText(/In the last \d+ draws/i)).toBeVisible();
});

test('E2E-07: selecting a top 6 number filters the history table', async ({ page }) => {
  await mockData(page);
  await page.goto('/?lang=en');

  const rowsBefore = await page.locator('tbody tr').count();
  await page.getByTestId('top6-rank').first().click();

  await expect
    .poll(async () => page.locator('tbody tr').count())
    .toBeLessThanOrEqual(rowsBefore);
});

test('E2E-08: the history table can be reordered', async ({ page }) => {
  await mockData(page);
  await page.goto('/?lang=en');

  const firstBefore = await page.locator('tbody tr td').first().innerText();
  await page.getByRole('button', { name: /Newest first|Oldest first/ }).click();

  await expect.poll(async () => page.locator('tbody tr td').first().innerText()).not.toBe(firstBefore);
});

test('E2E-09: mobile layout has no horizontal page scroll', async ({ page }) => {
  await mockData(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(noOverflow).toBe(true);
});

test('frequency sort controls occupy the next row on mobile', async ({ page }) => {
  await mockData(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en');

  const panel = page.locator('.panel').filter({ has: page.getByRole('heading', { name: 'Number frequency', exact: true }) });
  const datasetButton = panel.getByRole('button', { name: 'Main numbers', exact: true });
  const sortButton = panel.getByRole('button', { name: 'By frequency', exact: true });
  await expect(sortButton).toBeVisible();

  const datasetBounds = await datasetButton.boundingBox();
  const sortBounds = await sortButton.boundingBox();
  const panelBounds = await panel.boundingBox();
  const subtitleBounds = await panel.getByText('How many times each number 01–55 was drawn. Click a bar to filter the history.', { exact: true }).boundingBox();
  expect(datasetBounds).not.toBeNull();
  expect(sortBounds).not.toBeNull();
  expect(panelBounds).not.toBeNull();
  expect(subtitleBounds).not.toBeNull();
  expect(datasetBounds!.y).toBeGreaterThanOrEqual(subtitleBounds!.y + subtitleBounds!.height);
  expect(sortBounds!.y).toBeGreaterThanOrEqual(datasetBounds!.y + datasetBounds!.height);
  expect(sortBounds!.x + sortBounds!.width).toBeLessThanOrEqual(panelBounds!.x + panelBounds!.width);
  await sortButton.click();
  await expect(sortButton).toHaveAttribute('aria-pressed', 'true');
});
