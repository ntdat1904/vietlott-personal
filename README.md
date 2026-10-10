# 6/55 Lottery Jackpot Insight

A single-page React app for **Vietlott Power 6/55** results: a rolling 30-day history stored as
plain JSON files in this repo, tier-based number suggestions, frequency/trend charts, and a
sortable results table. Built per [`6-55-lottery-jackpot-insight-BUILD.md`](../6-55-lottery-jackpot-insight-BUILD.md),
with the visual design taken from [`mockup.png`](../mockup.png).

> ⚠️ **Disclaimer:** Lottery draws are random and independent. The suggestions shown are based only
> on past frequency and do **not** improve your chance of winning. For entertainment only. 18+.

## UI

The interface follows `mockup.png`: a dark slate theme with a red gradient header, a row of four
KPI stat cards, five tier suggestion cards (each with its own gradient header, badge, odds and
strategy note), a Top 6 panel with a ranked progress-bar list, a frequency chart with
main/bonus and natural/frequency toggles, and a filterable history table with day-range chips, a
number search and any/all match modes. Where `mockup.png` and the build spec disagree on styling,
the mockup wins — it is the newer source of truth.

Tier cards are ordered **Jackpot 1 first**, descending to the easiest prize, and the badges
(`T1`…`T5`) follow that left-to-right position. Display order is taken from `TIERS` in
`src/config/game.ts` rather than from the stored JSON, so a snapshot written before an ordering
change still renders correctly.

Every icon carries a tooltip (`IconTooltip` / `ControlTooltip` / `InfoTooltip` in
`src/components/InfoTooltip.tsx`), so nothing in the UI relies on the user guessing what a glyph
means.

The app is bilingual (Vietnamese default, English via the header switcher or `?lang=en`). The
frequency chart's toggle buttons and header block have reserved widths/heights so switching
language does not reflow the panel.

### Refresh

The header's Refresh button re-fetches `draws/stats/recommendations/meta.json` with a `?t=<now>`
cache buster and `cache: 'reload'`, so a static host or CDN cannot answer with a copy the cron has
already replaced. Once the fetch succeeds the app **re-forecasts** the tier suggestions in the
browser from the freshly fetched draws — using `buildRecommendations()`, the exact pure function
the pipeline uses — rather than trusting the stored snapshot, and stamps the footer with the
refresh time.

Note the button refreshes *the published data*, it does not scrape vietlott.vn from the browser:
this is a static site with no backend, and the operator's site sends no CORS headers (and rate
limits aggressively). Fetching new draws from vietlott.vn is the cron job's responsibility; see
below.

## Community picks (24h)

A panel where visitors pick 6 numbers (01–55) and submit them, plus a live ranking of the **6 most
picked numbers over the last 24 hours**. Because the site itself is static, this one feature talks
to a small **Cloudflare Worker + D1** API in `worker/`:

| Route | Does |
| --- | --- |
| `POST /api/picks` `{ "numbers": [6 ints] }` | Validates (6 distinct, 1–55) and stores the caller's ticket |
| `GET /api/picks/top` | Top 6 numbers + ticket count for the last 24h, and the caller's own ticket |

- **One ticket per IP.** The IP comes from Cloudflare's `CF-Connecting-IP` header (set by the
  edge, not spoofable by the browser). Submitting again from the same IP replaces the earlier
  ticket and restarts its 24h window, so one person cannot stack votes.
- **Privacy.** The raw IP is never stored, only `SHA-256(IP_SALT + ip)`. The user agent is kept
  (truncated) for abuse review. An hourly cron deletes tickets older than 24h.
- `POST` is only accepted from origins in `ALLOWED_ORIGINS` (`worker/wrangler.toml`).
- The panel only renders when `VITE_PICKS_API_URL` is set at build time, so the site still works
  without the Worker.
- Note that users behind the same NAT (an office, a mobile carrier) share an IP and therefore
  share one ticket.

### Local development

```bash
cd worker && npm install
cp .dev.vars.example .dev.vars         # local IP_SALT
npm run db:migrate:local
npm run dev                            # API on http://127.0.0.1:8787
# in the repo root, .env.development already points Vite at that URL:
npm run dev
```

### Deploying the Worker (one-time)

```bash
cd worker
npx wrangler login
npx wrangler d1 create community-picks     # paste the database_id into wrangler.toml
npm run db:migrate:remote
npx wrangler secret put IP_SALT            # any long random string
# add your Pages origin (e.g. https://<user>.github.io) to ALLOWED_ORIGINS in wrangler.toml
npm run deploy                             # prints https://power655-community-picks.<you>.workers.dev
```

Then in the GitHub repo settings add the variable `PICKS_API_URL` (the Worker URL) and the secrets
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`. `deploy.yml` bakes the URL into the site build,
and `deploy-worker.yml` redeploys the Worker (and applies migrations) whenever `worker/**` changes.

## How it works

- **No backend, no database.** Data lives as static JSON files in `public/data/` (`draws.json`,
  `stats.json`, `recommendations.json`, `meta.json`).
- A **GitHub Actions cron job** (`.github/workflows/fetch-data.yml`) runs once a day, fetches new
  draws from vietlott.vn (the only source), merges/prunes the 30-day window, recomputes stats and
  tier suggestions, commits the JSON files, and redeploys the site.
- The React SPA (`src/`) just fetches those JSON files with React Query — fast, static, and free
  to host on GitHub Pages (also works unmodified on Vercel/Netlify).

See the build spec for the full architecture, data contracts, UI spec, and test plan.

## Scraping vietlott.vn

`pipeline/sources/vietlott.ts` reads the real site. The data is split across two pages:

| Page | URL | Provides |
| --- | --- | --- |
| Results listing | `/vi/trung-thuong/ket-qua-trung-thuong/winning-number-655` | date, draw id, 6 main numbers + bonus |
| Draw detail | `/vi/trung-thuong/ket-qua-trung-thuong/655?id=<drawId>` | Jackpot 1 / Jackpot 2 amounts |

Parsing notes, all confirmed against the live markup:

- Rows live in a single `.doso_output_nd table tbody tr`.
- The seven balls in a row are `span.bong_tron`: the first six are the main numbers and the
  seventh is the bonus. The `|` divider uses the separate `bong_tron-sperator` class, so it is
  never selected. Scoping to the results table also avoids the hundreds of
  `.bong_tron.chua_chon` balls belonging to the site's number-picker modals.
- Amounts use vi-VN grouping (`3.800.633.150`), so every non-digit is stripped before parsing.

**Rate limiting matters.** vietlott.vn answers bursty clients with `HTTP 429`. The source therefore
keeps a 2.5 s minimum gap between requests, honours `Retry-After` (seconds or HTTP date, capped at
2 minutes), and escalates its own backoff for 429/503. If it still cannot get through, the run is
logged as `partial` and the previously committed JSON is left untouched — the site never loses data
because a scrape failed.

Trimmed captures of both real pages are committed as `tests/fixtures/vietlott-list.html` and
`tests/fixtures/vietlott-detail.html`, and `tests/unit/vietlott-source.test.ts` parses them, so a
site redesign fails the test suite instead of silently producing empty data.

Note the listing page only exposes the ~8 most recent draws. That is ample for the daily cron
(which fetches incrementally), but a cold start therefore begins with 8 draws rather than a full
30-day window, and fills out as the cron runs.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev              # starts Vite dev server
npm run build             # type-check + production build to dist/
npm run preview           # serve the production build locally

npm run lint               # ESLint
npm run test:unit          # Vitest (frequency/recommend/i18n-parity, etc.)
npm run test:e2e           # Playwright (desktop/tablet/mobile), against npm run preview

npm run pipeline            # run the data pipeline once, locally (writes public/data/*.json)
npm run pipeline -- --backfill-days=30   # manual repair/backfill
```

### First-time data load

`public/data/*.json` already ships with **sample data** (13 synthetic draws spanning the last 30
days) so the UI works out of the box. To fetch real data:

1. Confirm the vietlott.vn result-page URL and CSS selectors in `pipeline/sources/vietlott.ts`
   (`CONFIG` object) against the live site — they are placeholders.
2. Push to GitHub, then run **Actions → fetch-data → Run workflow** once (first run loads the last
   30 days). After that it runs automatically every day at 21:00 ICT.

## Deploying

- **GitHub Pages (default):** `vite.config.ts` sets `base: '/6-55-lottery-jackpot-insight/'`.
  `deploy.yml` builds and publishes `dist/` on every push to `main` (and is also called by
  `fetch-data.yml` after a data commit, since commits made with `GITHUB_TOKEN` don't retrigger the
  `push` event).
- **Vercel/Netlify:** connect the repo, build command `npm run build`, output `dist`, and set
  `BASE_PATH=/` as an environment variable (or drop the `deploy` job in `fetch-data.yml` — their
  Git integration redeploys on every push automatically).

## Project layout

```
pipeline/     Node/TS data pipeline (fetch → validate → merge/prune → stats/recommendations)
public/data/  The static JSON data store served to the browser
src/          React app (config, shared analytics lib, i18n, hooks, components)
tests/        Playwright e2e specs + fixtures, Vitest unit tests
.github/workflows/  fetch-data (cron), ci (PR checks), deploy (GitHub Pages)
```

## Verified in this build

Node 20 was sourced manually in the sandbox (not preinstalled) and used to verify:
`npm install`, `npx tsc -b` (clean), `npm run build` (Vite production build), `npm run lint`
(ESLint, 0 errors), and `npm run test:unit` (Vitest, 32/32 passing). That includes a jsdom smoke
test that renders the whole app against the fixtures and asserts the header, all five tier cards
with their number balls, the Jackpot-1-first ordering and the history table actually render, plus
parser tests that run against the committed real-HTML captures of vietlott.vn. The Refresh
button is covered too: tests assert it re-requests all four files with a cache buster, re-forecasts
the tier cards when the served draws change, and only stamps the footer after a successful fetch.

The scraper was also run **against the live site**: `npm run pipeline` fetched the real draws and
their real Jackpot 1 / Jackpot 2 amounts, and `public/data/*.json` now holds genuine results
(draw `01408`, 08/10/2026 → 01 07 12 27 31 52, bonus 06). The rate-limit handling was exercised
for real — vietlott.vn returned `HTTP 429` after a burst, the backoff escalated as designed and
the run degraded to `partial` without touching the committed data.

The Vite dev server was started and `/data/*.json` + `index.html` were confirmed to serve
correctly. Playwright's browser download could not complete in this sandbox (blocked network
egress to its CDN), so the e2e specs in `tests/e2e/` are written but **not executed here** — run
`npm run test:e2e` on a normal machine/CI to verify them (the `ci.yml` workflow does this on
every PR).

## Known limitations

- The listing page only exposes the ~8 most recent draws, so a cold start holds 8 draws rather
  than a full 30-day window (see "Scraping vietlott.vn" above).
- The header's "live data" badge is static rather than reflecting real fetch state.
- The scraper depends on vietlott.vn's current markup. The committed HTML fixtures mean a
  redesign breaks the test suite loudly rather than silently yielding empty data, but the
  selectors in `CONFIG.selectors` will then need updating.
