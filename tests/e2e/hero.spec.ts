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

// Left-to-right display order: biggest prize first.
const TIER_NAMES = {
  vi: ['Jackpot 1', 'Jackpot 2', 'Giải Nhất', 'Giải Nhì', 'Giải Ba'],
  en: ['Jackpot 1', 'Jackpot 2', 'First Prize', 'Second Prize', 'Third Prize'],
} as const;

test.describe.parallel('hero and tier suggestions', () => {
  for (const lang of ['vi', 'en'] as const) {
    test(`[${lang}] E2E-01/02: hero is first and tiers run Jackpot 1 to easiest`, async ({ page }) => {
      await mockData(page);
      await page.goto(`/?lang=${lang}`);

      const hero = page.locator('#hero');
      await expect(hero).toBeVisible();

      const cards = hero.getByTestId('tier-card');
      await expect(cards).toHaveCount(5);

      for (const [index, name] of TIER_NAMES[lang].entries()) {
        await expect(cards.nth(index)).toContainText(name);
      }
    });

    test(`[${lang}] E2E-05: each tier card shows at least 6 number balls`, async ({ page }) => {
      await mockData(page);
      await page.goto(`/?lang=${lang}`);

      const cards = page.locator('#hero').getByTestId('tier-card');
      await expect(cards).toHaveCount(5);

      for (let i = 0; i < 5; i += 1) {
        const count = await cards.nth(i).getByTestId('number-ball').count();
        expect(count).toBeGreaterThanOrEqual(6);
      }
    });
  }
});

test('E2E-04: the Jackpot 2 card includes a bonus ball', async ({ page }) => {
  await mockData(page);
  await page.goto('/?lang=en');

  const jackpot2 = page.locator('#hero').getByTestId('tier-card').nth(1);
  await expect(jackpot2.getByLabel(/bonus pick/i).first()).toBeVisible();
});

test('E2E-11: the randomness disclaimer is visible', async ({ page }) => {
  await mockData(page);
  await page.goto('/?lang=en');
  await expect(page.getByText(/independent and random/i)).toBeVisible();
});
