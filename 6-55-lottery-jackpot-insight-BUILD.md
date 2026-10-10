# 6/55 Lottery Jackpot Insight: Phase 1 Build Spec

> **Status: built and shipped.** This document has been updated to describe what was actually
> implemented. Where the original plan was superseded during the build — by `mockup.png`, by the
> real vietlott.vn markup, or by explicit requirement changes — the current behaviour is written
> here and the reason is noted inline as **Changed:**.

> A single-page React app that collects **Vietlott Power 6/55** results, keeps a rolling **30-day** history in **plain JSON files in the GitHub repo**, and shows daily number suggestions for each prize tier, along with frequency charts and a sortable results table.

---

## 0. Read this first: constraints that shape the design

| # | Constraint | Decision |
|---|---|---|
| 1 | **GitHub Pages, Vercel and Netlify static hosting cannot run a server or a database.** | Store the data as **simple JSON files in the repo** (`public/data/*.json`). A **scheduled GitHub Actions job** fetches new draws, updates the files, commits them, and redeploys the site. The SPA reads the JSON files as static assets. No database, no extra service, no API keys. |
| 2 | **Single data source: vietlott.vn only.** No search engines and no third-party results sites are used. | If vietlott.vn is unavailable, the run stores nothing new and logs the problem. Because each run starts from the last stored draw (§5.2), the next successful run fills the gap automatically. |
| 3 | **Lottery draws are independent.** Frequency does not raise the chance of a number being drawn. | The app labels its picks as *"most frequent"* and never as *"highest probability"*. A permanent disclaimer appears in the hero section and the footer (see §7.7). |
| 4 | **Data collection rule:** the first run loads the **last 30 days** (about 13 draws, since Power 6/55 draws Tue/Thu/Sat). After that the job runs **once per day** and adds new draws. Only the **last 30 days** are kept; older draws are deleted. | Every analysis in the app (Top 6, charts, tier suggestions, table) uses this one **30-day window**. There is no 3-, 6- or 12-month filter. A 30-day window is a small sample (about 13 draws), so the frequencies move a lot from draw to draw; the UI says so (§7.8). |
---

## 1. Domain facts (Power 6/55)

> ⚠️ Check these against vietlott.vn before you ship. They are stored in `src/config/game.ts` so they can be changed in one place.

- **Pool:** numbers 01–55. Each draw picks **6 main numbers + 1 bonus ("Power") number** from the same pool.
- **Draw days:** Tuesday, Thursday and Saturday, around 18:00 ICT (UTC+7).
- **Ticket:** the player picks 6 numbers.
- **Prize tiers, ordered from lowest to highest value** (this is the display order everywhere):

| Order | Tier (VI) | Tier (EN) | Match rule | Indicative value |
|---|---|---|---|---|
| 1 | Giải Ba | Third Prize | 3 of the 6 main numbers | 50,000 VND (fixed) |
| 2 | Giải Nhì | Second Prize | 4 of the 6 main numbers | 500,000 VND (fixed) |
| 3 | Giải Nhất | First Prize | 5 of the 6 main numbers | 40,000,000 VND (fixed) |
| 4 | Jackpot 2 | Jackpot 2 | 5 main numbers + the bonus number | from 3 billion VND (variable) |
| 5 | Jackpot 1 | Jackpot 1 | all 6 main numbers | from 30 billion VND (variable) |

---

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Build tool | **Vite** + React 18 + TypeScript | `base` set for GitHub Pages sub-path |
| Styling | **Tailwind CSS** v3 | design tokens in §7.1 |
| Icons | **lucide-react** | |
| Tooltips | **@radix-ui/react-tooltip** | accessible (hover + keyboard focus + touch) |
| Charts | **Recharts** | responsive containers |
| Tables | plain React (`useMemo`) | **Changed:** the final table needs only range chips, a number search and a sort toggle, so TanStack Table was dropped as an unused dependency |
| Dates | **date-fns** + `date-fns-tz` (Asia/Ho_Chi_Minh) | `vi` and `enUS` locales |
| i18n | **i18next** + **react-i18next** + `i18next-browser-languagedetector` | EN + VI; see §7.11 |
| Data storage | **JSON files in the repo** (`public/data/`) | about 13 draws; Git keeps the full change history; see §5.0 |
| Data pipeline | Node 20 script + **cheerio** (HTML parsing) + `undici` fetch | runs only in CI |
| Data fetching (UI) | **@tanstack/react-query** + `fetch` | caching, retries, loading and error states |
| E2E tests | **Playwright** | desktop, tablet and mobile projects |
| Unit tests | **Vitest** + `@testing-library/react` + `jsdom` | algorithms, scraper parsers, i18n parity, and a DOM smoke test of the whole app |
| Lint/format | ESLint + Prettier | |
| Hosting | **GitHub Pages** (primary); Vercel and Netlify also work with no code changes | |
| Scheduler | **GitHub Actions cron** | |

---

## 3. Architecture

```
┌──────────────────── GitHub Actions (daily cron) ────────────────────┐
│                                                                      │
│  vietlott.vn ──► parser ──► validator                                │
│  (only source)   (cheerio)  (6 unique 1..55, valid date)             │
│       │ unavailable → log it, store nothing; next run fills the gap  │
│                                                        │             │
│                                                        ▼             │
│     read public/data/draws.json ──► merge new draws ──► prune > 30 d │
│                                                        │             │
│                                                        ▼             │
│     compute stats + recommendations ──► write JSON files             │
│     git commit "data: update YYYY-MM-DD" ──► push to main            │
│                                                        │             │
│                                                        ▼             │
│     deploy job (same workflow): build Vite ──► GitHub Pages          │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
          Browser SPA fetches /data/*.json (static files, no backend)

  Code push to main ──► Deploy workflow: build Vite ──► hosting
```

**Why precompute stats in the pipeline instead of in the browser?** The logic (frequency, tier suggestions) runs once a day in one place, and the files are tiny (a few KB in total). The browser loads **4 small static files** per visit, so the page is fast and there is nothing to keep running.

---

## 4. Repository layout

```
6-55-lottery-jackpot-insight/
├─ .github/workflows/
│  ├─ fetch-data.yml          # daily cron: fetch → validate → write JSON → commit → deploy
│  ├─ ci.yml                  # PR: lint, unit, build, playwright
│  └─ deploy.yml              # push to main or called by fetch-data: build → Pages
├─ pipeline/
│  ├─ index.ts                # orchestrator (first run: 30 days; then daily)
│  ├─ store.ts                # read/write the JSON files: merge, prune, atomic write
│  ├─ sources/
│  │  ├─ Source.ts            # interface: fetchDraws(from, to)
│  │  └─ vietlott.ts          # vietlott.vn fetcher + parser (the only source)
│  ├─ validate.ts
│  ├─ analytics.ts            # shared with frontend via src/lib (see §6)
│  └─ snapshot.ts             # builds stats + recommendations payloads
├─ public/
│  └─ data/                   # the data store (committed by the daily job)
│     ├─ draws.json
│     ├─ stats.json
│     ├─ recommendations.json
│     └─ meta.json
├─ data/
│  └─ fetch-log.json          # last 30 run results (not published to the site)
├─ src/
│  ├─ config/game.ts          # pool size, tiers, draw days, colors
│  ├─ lib/
│  │  ├─ frequency.ts
│  │  ├─ recommend.ts
│  │  ├─ dates.ts
│  │  └─ api.ts               # fetch the JSON files: getMeta, getDraws, getStats, getRecommendations
│  ├─ i18n/
│  │  ├─ index.ts             # i18next init, detector, fallback
│  │  ├─ format.ts            # number/currency/date helpers per locale
│  │  └─ locales/
│  │     ├─ en.json
│  │     └─ vi.json
│  ├─ hooks/useLotteryData.ts
│  ├─ components/
│  │  ├─ Header.tsx
│  │  ├─ LanguageSwitcher.tsx
│  │  ├─ StatCards.tsx        # 4 KPI cards (§7.2)
│  │  ├─ Banners.tsx          # stale / error banners (§7.8)
│  │  ├─ TierSuggestions/
│  │  │  ├─ TierSuggestions.tsx
│  │  │  └─ TierCard.tsx
│  │  ├─ NumberBall.tsx
│  │  ├─ TopSixPanel.tsx      # top 6 of the last 30 days
│  │  ├─ FrequencyChart.tsx
│  │  ├─ ResultsTable.tsx
│  │  ├─ InfoTooltip.tsx      # InfoTooltip / IconTooltip / ControlTooltip (§7.3)
│  │  ├─ Disclaimer.tsx
│  │  └─ Footer.tsx
│  ├─ App.tsx
│  └─ main.tsx
├─ tests/
│  ├─ e2e/*.spec.ts
│  ├─ fixtures/*.json         # deterministic data files for Playwright + jsdom tests
│  ├─ fixtures/vietlott-*.html # trimmed real captures of vietlott.vn (§5.3)
│  └─ unit/*.test.{ts,tsx}
├─ playwright.config.ts
├─ vite.config.ts
├─ tailwind.config.ts
└─ README.md
```

---

## 5. Data storage and pipeline

### 5.0 Why simple JSON files

With only the last 30 days kept (about 13 draws), the whole dataset is a few kilobytes. A database would add an account, keys and setup without adding value.

| Option | Verdict |
|---|---|
| **JSON files in the repo** ✅ **chosen** | No service, no keys, free. The site serves them as static files. Git history doubles as an audit log of every daily change. Easy to read and fix by hand. |
| SQLite file in the repo | Needs a library to read in the browser, and Git can't show readable diffs of a binary file. |
| Hosted database (Supabase, Turso, etc.) | More setup and secrets than this data size needs. Worth revisiting in Phase 2 if user accounts or saved tickets are added. |

### 5.1 File formats (`public/data/`)

All files are UTF-8 JSON, pretty-printed with 2-space indents and stable key order so Git diffs stay readable. Every file has a `schemaVersion` so the format can change safely later.

```jsonc
// draws.json — the source of truth; newest first; only the last 30 days
{
  "schemaVersion": 1,
  "draws": [
    {
      "drawId": "01234",
      "date": "2026-10-08",            // ICT calendar date
      "numbers": [7, 12, 19, 28, 33, 41], // 6 main numbers, ascending
      "bonus": 50,                     // Power number
      "jackpot1Vnd": 45000000000,      // optional
      "jackpot2Vnd": 3500000000,       // optional
      "sourceUrl": "https://vietlott.vn/...",
      "fetchedAt": "2026-10-08T14:00:12Z"
    }
  ]
}

// stats.json — StatsPayload (§5.4), rewritten every run
// recommendations.json — RecommendationsPayload (§5.4), rewritten every run

// meta.json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-10T14:00:30Z",
  "lastDrawDate": "2026-10-08",
  "drawCount": 13,
  "lastRun": { "at": "2026-10-10T14:00:30Z", "status": "ok", "newDraws": 0, "message": null }
}
```

`data/fetch-log.json` keeps the last 30 run results (`at`, `status: ok | partial | failed`, `newDraws`, `message`). It lives outside `public/`, so it is not published with the site.

**Write safety:**
- The pipeline writes each file to a temporary file and renames it, so a crash never leaves a half-written file.
- Before writing, it checks every draw against the validation rules (§5.2 step 4) and that `draws` has no duplicate `drawId`. If a check fails, it writes nothing and the run fails.
- Only the `fetch-data` workflow writes these files. The `concurrency` setting in §5.5 stops two runs from writing at once.

### 5.2 Fetch flow (`pipeline/index.ts`)

1. **Determine the range.**
   - **First run** (`draws.json` is missing or empty): `from = today − 30 days`, `to = today`. This loads about 13 draws.
   - **Every later run** (once per day): `from = last draw_date + 1`, `to = today`. Usually this is 0 or 1 new draw.
   - **Missed days** (e.g. the job failed for a few days): the same rule fills the gap automatically, because `from` always starts after the last stored draw.
   - `--backfill-days=N` is a manual override for repairs only. It is never used by the schedule.
2. **List expected draw dates** in the range (Tue/Thu/Sat). This list is used to detect gaps.
3. **Fetch from vietlott.vn** (the only source). Get the Power 6/55 results for the range from the official results pages. Use a polite User-Agent, 1 request per second, a 15 s timeout, and 3 retries with exponential backoff (2 s, 4 s, 8 s).
   vietlott.vn counts as **unavailable** when, after the retries, any of these happens:
   - a network error, timeout or HTTP 5xx / 403 / 429
   - the page loads but the parser finds no valid result (e.g. the layout changed or a maintenance page)
   In that case the run stores no new draws, logs the reason in `data/fetch-log.json` and `meta.json`, and still writes today's stats and recommendations from the data already stored. A draw whose results aren't published yet is not an error; the next day's run picks it up.
4. **Validate** each draw:
   - exactly 6 unique integers between 1 and 55, plus a bonus between 1 and 55 that is not among the 6
   - the date is a draw day and is not in the future
   - invalid draws are skipped and logged, never stored
5. **Merge** the new draws into `draws.json` by `drawId` (an existing draw is replaced, never duplicated), then sort newest first.
6. **Prune** (keep 30 days): remove draws where `date < today − 30 days`.
7. **Compute** stats and recommendations (§6) from `draws.json`, then write `stats.json`, `recommendations.json` and `meta.json`.
8. Add the run result to `data/fetch-log.json` (keeping the last 30). Exit non-zero only if vietlott.vn was unavailable **and** a draw is overdue by more than 48 hours. This makes the workflow fail visibly (GitHub emails the repo owner on failed scheduled runs).

### 5.3 vietlott.vn source (`pipeline/sources/vietlott.ts`)

```ts
export interface ParsedDraw {
  drawId: string; date: string; numbers: number[]; bonus: number;
  jackpot1Vnd?: number; jackpot2Vnd?: number; sourceUrl: string;
}

export interface Source {
  fetchDraws(from: string, to: string): Promise<ParsedDraw[]>;   // throws SourceUnavailableError
}
```

**Resolved against the live site.** The pages are plain server-rendered HTML, so cheerio is enough
and Playwright is not needed in the pipeline. All URLs and selectors live in one `CONFIG` object in
this file, so a redesign means changing one place.

The data is split across two pages:

| Page | URL | Provides |
|---|---|---|
| Results listing | `/vi/trung-thuong/ket-qua-trung-thuong/winning-number-655` | date, draw id, 6 main numbers + bonus |
| Draw detail | `/vi/trung-thuong/ket-qua-trung-thuong/655?id=<drawId>&nocatche=1` | Jackpot 1 / Jackpot 2 amounts |

Confirmed parsing rules:

- Result rows are `.doso_output_nd table tbody tr`; the cells are date (`dd/MM/yyyy`), a link whose
  text is the draw id, and the ball container.
- The seven balls in a row are `span.bong_tron`: **the first six are the main numbers and the
  seventh is the bonus.** The `|` divider carries the separate `bong_tron-sperator` class, so a
  `.bong_tron` selector never picks it up. Scoping to the results table is essential: the page also
  contains hundreds of `.bong_tron.chua_chon` balls belonging to the number-picker modals.
- Prize amounts are on the detail page only, in a `table.table-hover` whose first cell is the prize
  name (`Jackpot 1`, `Jackpot 2`, `Giải Nhất`, …) and whose last cell is the amount. Amounts use
  vi-VN grouping (`3.800.633.150`), so strip every non-digit before parsing.
- The listing page exposes only the **~8 most recent draws**. That is ample for the daily cron,
  which fetches incrementally, but a cold start begins with 8 draws rather than a full 30-day
  window and fills out as the cron runs.

**Rate limiting is mandatory, not optional.** vietlott.vn answers bursty clients with `HTTP 429`.
The source therefore:

- keeps a **2.5 s minimum gap** between every request (a shared throttle, not per-call);
- honours `Retry-After` in both forms (seconds or HTTP date), capped at 2 minutes;
- escalates its own backoff for 429/503 (15 s → 30 s → 60 s) separately from ordinary errors;
- pushes the shared throttle forward when throttled, so sibling requests slow down too;
- treats prize amounts as optional, so one failing detail page degrades that draw instead of
  failing the whole run.

If it still cannot get through, the run is logged as `partial` and the committed JSON is left
untouched — the site never loses data because a scrape failed.

**Fixtures.** Trimmed captures of both real pages are committed as `tests/fixtures/vietlott-list.html`
and `tests/fixtures/vietlott-detail.html`, and the parser unit tests run against them, so a site
redesign fails the test suite loudly instead of silently producing empty data.

### 5.4 Data contracts and frontend reads

The frontend reads the files through `src/lib/api.ts`, wrapped in React Query hooks:

```ts
const base = import.meta.env.BASE_URL + 'data/';
const get = <T>(file: string) =>
  fetch(base + file, { cache: 'no-cache' }).then(r => {
    if (!r.ok) throw new Error(`${file}: ${r.status}`);
    return r.json() as Promise<T>;
  });

export const getMeta            = () => get<Meta>('meta.json');
export const getDraws           = () => get<DrawsFile>('draws.json');
export const getStats           = () => get<StatsPayload>('stats.json');
export const getRecommendations = () => get<RecommendationsPayload>('recommendations.json');
// nextDrawAt is computed client-side from the draw days (Tue/Thu/Sat 18:00 ICT).
```

`cache: 'no-cache'` makes the browser check for a newer file on each visit, so visitors don't see yesterday's data from their cache. React Query settings: `staleTime` 10 minutes, 2 retries. The last successful response is also kept in `localStorage` (wrapped in try/catch), so the page can show last-known data if a file fails to load (§7.8).

**Payload shapes** (`stats.json` and `recommendations.json`):

```ts
// StatsPayload (stats.json)
{ schemaVersion: 1;
  windowDays: 30;
  drawCount: number;
  from: string; to: string;            // date range of the stored draws
  frequency: { n: number; count: number; lastSeen: string | null }[];  // 1..55
  bonusFrequency: { n: number; count: number }[];
  top6: number[];
  trend: { date: string; cumulative: Record<number, number> }[];  // per draw; retained in the
                                                                   // contract, no longer rendered (§7.5)
}

// RecommendationsPayload (recommendations.json)
{ schemaVersion: 1; date: string; windowDays: 30; drawCount: number;
  tiers: { tierId: 'third'|'second'|'first'|'jackpot2'|'jackpot1';
           order: 1|2|3|4|5;
           numbers: number[];        // 6 numbers, ascending
           core: number[];           // the k numbers the tier targets (highlighted)
           bonusPick?: number;       // jackpot2 only
           rationale: { key: string; params: Record<string, string | number> } }[] }
```

> **The stored data is language-neutral.** The pipeline never writes display text. `rationale` is a translation key plus parameters, e.g. `{ key: "rationale.topFreq", params: { k: 3, draws: 13, nums: "07, 19, 33" } }`. The SPA renders it in the active language.

### 5.5 Scheduled workflow (`.github/workflows/fetch-data.yml`)

```yaml
name: fetch-data
on:
  schedule:
    - cron: '0 14 * * *'    # once per day at 21:00 ICT (well after the ~18:00 draw)
  workflow_dispatch:          # manual run; also used for the very first 30-day load
    inputs:
      backfill_days: { description: 'Repair only: re-fetch N days (0 = normal run)', default: '0' }
permissions:
  contents: write           # to commit the updated JSON files
concurrency: { group: fetch-data, cancel-in-progress: false }
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run pipeline -- --backfill-days=${{ inputs.backfill_days || 0 }}
      - name: Commit data files
        run: |
          git config user.name "data-bot"
          git config user.email "data-bot@users.noreply.github.com"
          git add public/data data/fetch-log.json
          git diff --cached --quiet || git commit -m "data: update $(date -u +%F)"
          git push

  deploy:                     # redeploy so the site serves the new files
    needs: fetch
    permissions: { contents: read, pages: write, id-token: write }
    uses: ./.github/workflows/deploy.yml
```

> The pipeline runs **once per day, every day**, not only on draw days, so today's `recommendations.json` always exists and the UI can say "Today's suggestions" truthfully. The commit is small (a few KB of JSON).
> 21:00 ICT leaves time for official results to be published. If a draw's results are not out yet, the next day's run picks them up automatically (§5.2 step 1). GitHub may start scheduled jobs a few minutes late; that is fine here.
> **First run:** with no `draws.json`, a normal run loads the last 30 days. Trigger it once by hand after setup (*Actions → fetch-data → Run workflow*) instead of waiting for 21:00.
> **Why the deploy job is inside this workflow:** commits pushed with the built-in `GITHUB_TOKEN` do not trigger other workflows, so the `push` trigger in `deploy.yml` would not fire. Calling `deploy.yml` directly avoids needing a personal access token.
> On **Vercel or Netlify**, drop the `deploy` job: their Git integration redeploys on every push to `main`, including the data commit.

---

## 6. Analytics and recommendation logic (`src/lib`, shared with the pipeline)

### 6.1 Frequency

```
window = the last 30 days of draws (everything stored)
freq(n)  = number of draws in window whose 6 main numbers include n
bonusFreq(n) = number of draws in window whose bonus == n
Sort: freq desc → lastSeen desc (more recent wins) → n asc
Top6 = first 6
```

### 6.2 Tier-based suggestions (30-day window, recomputed daily)

Every tier produces a **full 6-number ticket**. Each tier also has a highlighted **core** of `k` numbers, which is the part of the ticket that tier is "aiming" to match.

Score for every number `n`:

```
score(n) = wF·norm(freq30(n)) + wR·norm(recency(n)) + wP·norm(pairScore(n, core))
recency(n)   = 1 / (1 + drawsSinceLastSeen(n))
pairScore(n) = Σ co-occurrence count of n with numbers already chosen
```

| Order | Tier | k (core) | wF | wR | wP | Rule |
|---|---|---|---|---|---|---|
| 1 | Third | 3 | 1.0 | 0.0 | 0.0 | core = top-3 by freq; fill 3 by highest pairScore with core |
| 2 | Second | 4 | 0.8 | 0.2 | 0.0 | core = top-4 by score; fill 2 by pairScore |
| 3 | First | 5 | 0.6 | 0.2 | 0.2 | greedy: add the highest-scoring n until 5; fill 1 |
| 4 | Jackpot 2 | 5 + bonus | 0.6 | 0.2 | 0.2 | core = 5 as in First; `bonusPick` = top bonusFreq not in core; ticket = core + bonusPick |
| 5 | Jackpot 1 | 6 | 0.5 | 0.25 | 0.25 | greedy 6 by combined score |

**Determinism and variety:**
- Ties are broken with a PRNG seeded by the date `YYYYMMDD`. Suggestions stay stable all day and change the next day.
- If a ticket is identical to the previous tier's ticket, swap its lowest-scoring non-core number for the next candidate.
- `rationale` is a translation key with parameters (see §5.4). It renders as:
  - EN: *"Core = 3 most frequent numbers in the last 13 draws (07, 19, 33)."*
  - VI: *"Bộ số chính = 3 số xuất hiện nhiều nhất trong 13 kỳ gần nhất (07, 19, 33)."*

All weights live in `src/config/game.ts` so they can be tuned without touching the logic.

---

## 7. UI specification (single page)

### 7.1 Design tokens

**Changed:** the original fading-red scheme was superseded by `mockup.png`, which is the newer
source of truth for all styling. The app uses a **dark theme**, and each tier gets its own hue so
the five cards are distinguishable at a glance.

| Token | Value |
|---|---|
| Page background | `#020617` (slate-950) |
| Panel / card background | `#0f172a` (slate-900) |
| Panel border | slate-800 |
| Header bar | gradient `#e9002a` → `#cd001e` |
| Accent red | `#f4053c` |
| Bonus ball | `#ff9300` (amber/orange) |
| Chart: top 6 / others / filtered | `#f4053c` / `#64748b` / `#10b981` |

```ts
// Per-tier header gradients, sampled from the mockup. White text meets WCAG AA on all five.
export const tierHeaderColors: Record<TierId, { gradient: string; text: string }> = {
  third:    { gradient: 'from-[#00a6f3] to-[#00b5df]', text: 'text-white' },  // blue
  second:   { gradient: 'from-[#00bc7e] to-[#00bb9f]', text: 'text-white' },  // teal
  first:    { gradient: 'from-[#8e50ff] to-[#9623fc]', text: 'text-white' },  // purple
  jackpot2: { gradient: 'from-[#ffb600] to-[#ff7800]', text: 'text-white' },  // orange
  jackpot1: { gradient: 'from-[#fa2a37] to-[#ee003e]', text: 'text-white' },  // red
};
```

Number balls come in `sm`/`md`/`lg` and four roles: `hot` (red gradient), `core` (dark with a red
ring), `filler` (dark), and `bonus` (amber/orange).

### 7.2 Page order (top to bottom)

1. **Header**: "Power 6/55 Insights", `55` logo, live-data badge, **Refresh** button, and the
   **language switcher (VI | EN)** at top right.
2. **KPI stat cards** (4): draws analyzed, latest draw, Jackpot 1, Jackpot 2. *(Added from the mockup.)*
3. **🔝 Today's suggestions by prize tier (hero)**: 5 cards, **Jackpot 1 first**, descending to the
   easiest prize.
4. **Top 6 most frequent** + **frequency bar chart**, side by side on desktop.
5. **Results table**.
6. **Disclaimer bar**.
7. **Footer**: data source, data timestamp, refresh timestamp, responsible-gaming note.

**Changed (tier order):** the hero originally listed tiers lowest-to-highest. The requirement is now
**biggest prize first** — Jackpot 1, Jackpot 2, First, Second, Third — reading left to right, and the
`T1`…`T5` badges follow that display position. Order is taken from `TIERS` in `src/config/game.ts`,
**not** from the stored JSON, so a snapshot written before an ordering change still renders correctly.

**Changed (trend chart):** removed from the page on request; see §7.5.

### 7.2a Refresh behaviour

The header's **Refresh** button:

1. re-fetches all four JSON files with a `?t=<now>` cache buster and `cache: 'reload'`, so a static
   host or CDN cannot answer with a copy the cron has already replaced;
2. **re-forecasts** the tier suggestions in the browser from the freshly fetched draws, using
   `buildRecommendations()` — the same pure function the pipeline uses — rather than trusting the
   stored snapshot, so new draws change the suggestions immediately;
3. stamps the footer with the refresh time **only after a successful fetch**;
4. shows a spinning icon and a "Refreshing…" label, and is disabled while in flight.

It refreshes *the published data*; it does not scrape vietlott.vn from the browser. This is a static
site with no backend, the operator sends no CORS headers, and it rate limits aggressively — fetching
new draws is the cron's job (§5.5).

### 7.3 Tier card (`TierCard.tsx`)

```
┌──────────────────────────────────────────┐
│ [icon] Jackpot 1 · Match 6     [T1] (i)  │ ← gradient header, hue by tier (§7.1)
├──────────────────────────────────────────┤
│  (07) (19) (33) (12) (28) (41)           │ ← core ringed, fillers plain
│  + (06)                                  │ ← bonus ball, Jackpot 2 only
│  Condition  Match all 6 numbers          │
│  Prize      From 30 billion VND          │
│  Odds       1/28.989.675                 │
│  ──────────────────────────────────────  │
│  Evenly spread: picked by frequency and  │ ← strategy note
│  balance, total in the usual range.      │
└──────────────────────────────────────────┘
```

- **Icons** (lucide): Third `Star`, Second `Award`, First `Medal`, Jackpot 2 `Gem`, Jackpot 1 `Crown`.
- **Every icon in the app has a tooltip**, not just the tier icons. Three Radix wrappers in
  `src/components/InfoTooltip.tsx` cover the cases: `InfoTooltip` (an `(i)` button with an
  explanation), `IconTooltip` (a decorative icon or badge that names itself), and `ControlTooltip`
  (an existing interactive control such as the Refresh or sort button). Tooltips open on hover,
  keyboard focus and tap, and the label doubles as the accessible name so the wrapped glyph stays
  `aria-hidden`.
- Tooltipped icons include: the tier icon and `T1`…`T5` badge on every card, all four section icons
  (hero, Top 6, frequency chart, history), the header logo, the live-data badge, the Refresh button,
  the table's sort toggle, and the disclaimer icon.
- The card body is a `<dl>` with Condition / Prize / Odds rows, plus a strategy note explaining how
  that tier's ticket was built.
- Card layout: 5 columns on ≥1280 px, 2 columns on ≥640 px, a stacked list on mobile. On mobile the
  cards are **not** collapsed, so the hero stays fully visible.

### 7.4 Top 6 panel

- A row of six large `hot` balls, followed by a **ranked list with progress bars**, each row showing
  rank, ball, bar, absolute count and percentage (per `mockup.png`).
- Always based on the last 30 days; there is no period filter.
- Shows "In the last N draws" as the panel subtitle.
- Each ranked row is a button: selecting a number filters the results table, and selecting it again
  clears the filter.
- An `(i)` tooltip on the title explains that only the last 30 days are kept, and that with about 13
  draws, ties and big day-to-day changes are normal. A note explains that ties are broken by the more
  recently drawn number.

### 7.5 Charts

- **Frequency bar chart**: x = 1–55, y = count over the last 30 days. The top 6 bars are red, others
  slate, and the currently filtered number is green. A dashed `ReferenceLine` marks the expected
  average appearances per number, and a four-item legend explains the colours. Clicking a bar filters
  the table to draws containing that number.
- Two toggle groups: dataset (**Main numbers** / **Bonus**) and sort order (**1→55** / **By frequency**).
- **Hover text is white.** Recharts tints a tooltip row with the hovered bar's own fill by default,
  which is unreadable against the dark panel for the grey "other numbers" bars, so `itemStyle`,
  `labelStyle` and `contentStyle` all pin the colour to `#ffffff`.
- **The layout must not move when the language changes.** VI and EN labels differ in length, so the
  toggle buttons have a fixed `min-w` with centred text, the toggle row is `flex-nowrap shrink-0` so
  it cannot re-wrap, and the subtitle and legend have reserved minimum heights.
- **Changed — trend chart removed.** The cumulative-appearances step chart was built as specified and
  then removed from the page on request. With only ~13 stored draws it added little over the
  frequency chart. Its i18n keys were removed with it.
- Uses `ResponsiveContainer`. On mobile the bar chart scrolls horizontally inside its card
  (min-width 720 px) so the page itself never scrolls horizontally.

### 7.6 Results table

**Changed:** implemented with plain `useMemo` filtering rather than TanStack Table. With a 30-day
window (~13 rows) pagination is pointless and the remaining needs are small, so the dependency was
dropped.

| Column | Notes |
|---|---|
| Draw # | rendered as `#01408` |
| Date | with weekday; sort toggle, newest first by default |
| Numbers (balls) | matched numbers highlighted |
| Bonus | bonus-styled ball |
| Jackpot 1 / 2 value | short money format |

Controls: **day-range chips** (7 / 14 / 30), a **newest/oldest sort toggle**, a **number search**
(e.g. `7 23`) with **any / all** match modes, and a chip showing the active number filter coming from
the Top 6 panel or the frequency chart, which clears on click. A "showing N/M draws" count sits in
the header. On mobile the table turns into a card list.

### 7.7 Disclaimer (required)

Shown under the hero and in the footer:

> Every Vietlott draw is random and independent. These suggestions are based only on how often numbers appeared in past draws. They do **not** improve your chance of winning. For entertainment only. Play responsibly; 18+.

### 7.8 States

- **Loading**: skeleton balls and cards.
- **Error**: banner with a retry button. Show the last-known data if it is cached.
- **Stale data**: if `lastDrawDate` is more than 3 days old, show a yellow banner: "Results may be out of date."
- **Small sample**: if the 30-day window has fewer than 8 draws, show a note on the hero.

### 7.9 Responsive breakpoints

| Device | Width | Hero cards | Charts | Table |
|---|---|---|---|---|
| Mobile | < 768 | stacked | full width, scrollable bar chart | card list |
| Tablet | 768–1279 | 3 + 2 grid | stacked | table |
| Desktop | ≥ 1280 | 5 in a row | side by side | table |

### 7.10 Accessibility

- All colors meet WCAG AA contrast.
- Balls carry an `aria-label` (e.g. "Number 7, core pick").
- Tooltips are reachable by keyboard.
- Respect `prefers-reduced-motion`.
- Dark mode via the `media` strategy (optional in Phase 1).

### 7.11 Multi-language (EN / VI)

**Supported languages:** `vi` (Tiếng Việt) and `en` (English).

**Choosing the language**, in priority order:
1. `?lang=vi|en` in the URL, so a link can be shared in a given language
2. the user's saved choice in `localStorage` (`app.lang`), wrapped in try/catch
3. the browser language (`navigator.language` starting with `vi` → `vi`)
4. fallback: **`vi`** (the main audience is Vietnamese players)

**Switcher (`LanguageSwitcher.tsx`)**
- A segmented toggle `VI | EN` in the header. On mobile it shrinks to an icon (`Languages` from lucide) that opens a 2-item menu.
- Switching changes all text instantly, with no page reload.
- It updates `<html lang>`, `document.title` and the `?lang` parameter (`history.replaceState`).

**What gets translated**: every piece of UI text, including:
- section titles, tier names, the "Match N to win" lines
- **all icon tooltips** and the `(i)` tooltips
- table headers, search placeholders, pagination text, empty, loading and error states
- banners (stale data, small sample) and the **disclaimer**
- chart axis titles, tooltips and legends
- `aria-label`s (e.g. "Số 7, số chính" and "Number 7, core pick")
- generated `rationale` strings (§6.2)

**Tier names:**

| tierId | VI | EN |
|---|---|---|
| third | Giải Ba | Third Prize |
| second | Giải Nhì | Second Prize |
| first | Giải Nhất | First Prize |
| jackpot2 | Jackpot 2 | Jackpot 2 |
| jackpot1 | Jackpot 1 | Jackpot 1 |

**Formatting per locale** (`src/i18n/format.ts`, built on `Intl`):

| Item | VI | EN |
|---|---|---|
| Date | `10/10/2026` (dd/MM/yyyy) | `Oct 10, 2026` |
| Weekday | `Thứ Bảy` | `Saturday` |
| Money | `30.000.000.000 ₫` and the short form `30 tỷ ₫` | `30,000,000,000 VND` and the short form `30B VND` |
| Countdown | `Kỳ quay tiếp theo: 1 ngày 8 giờ` | `Next draw in: 1d 8h` |

Number balls always use two digits (`07`) in both languages.

**Translation files** (`locales/en.json` and `locales/vi.json`)
- The keys are nested by area: `header.*`, `hero.*`, `tier.<id>.name|rule|tooltip`, `top6.*`, `chart.*`, `table.*`, `banner.*`, `disclaimer`, `rationale.*`.
- Plurals use i18next plural rules (`draw_one` / `draw_other` for EN; VI uses `_other` only).
- **Both files must have exactly the same keys.** A unit test fails the build if a key is missing from either file (see §8.3).

Example (`vi.json` excerpt):

```json
{
  "hero": {
    "title": "Gợi ý hôm nay theo từng giải",
    "info": "Dựa trên tần suất xuất hiện trong 30 ngày gần nhất."
  },
  "tier": {
    "third": {
      "name": "Giải Ba",
      "rule": "Trùng 3 số để trúng",
      "tooltip": "Trùng 3 trong 6 số chính. Giải thưởng: 50.000 ₫. Ô đỏ là 3 số xuất hiện nhiều nhất trong 30 ngày."
    }
  },
  "disclaimer": "Mỗi kỳ quay Vietlott là ngẫu nhiên và độc lập. Các gợi ý chỉ dựa trên tần suất xuất hiện trong quá khứ và KHÔNG làm tăng cơ hội trúng thưởng. Chỉ mang tính giải trí. Chơi có trách nhiệm; 18+."
}
```

**Layout:** Vietnamese text is often 20–30% longer than English. Card headers, buttons and table headers must wrap or truncate cleanly in both languages at every breakpoint. Use a font with full Vietnamese diacritic support, e.g. **Be Vietnam Pro** or **Inter** from Google Fonts with the `vietnamese` subset.

---

## 8. Testing

### 8.1 Config

```ts
// playwright.config.ts
projects: [
  { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  { name: 'tablet',  use: { ...devices['iPad (gen 7)'] } },
  { name: 'mobile',  use: { ...devices['Pixel 7'] } },
],
webServer: { command: 'npm run preview', port: 4173 },
```

Tests intercept `**/data/*.json` with `page.route()` and serve files from `tests/fixtures/`, so results are deterministic and never depend on live data.

Pipeline integration tests run the whole pipeline against a temporary folder with mocked vietlott.vn responses: first run creates the files; a second run with the same data changes nothing; merge, prune and the fetch log behave as in §5.2.

**Changed — two test tiers.** Vitest now carries more than the pure functions: `tests/unit/*.tsx` run
under **jsdom** (`environmentMatchGlobs` in `vite.config.ts`) with `@testing-library/react`, so the
whole app can be rendered and asserted without a browser. This exists because Playwright browsers
cannot be downloaded in the current sandbox — **the Playwright suite is verified in CI only**, while
the jsdom tests cover the same ordering, refresh and layout behaviour locally.

### 8.2 Test cases

| ID | Test |
|---|---|
| E2E-01 | The hero "Today's tier-based suggestions" is the first content section after the header and KPI stat cards, above the Top 6 panel, and is visible without scrolling on desktop. |
| E2E-02 | 5 tier cards appear in order **Jackpot 1 → Jackpot 2 → First → Second → Third** (biggest prize first, §7.2). |
| E2E-03 | Each tier header uses its own gradient from §7.1, and the white header text meets WCAG AA contrast on all five. *(Changed: the original luminance-ordering assertion no longer applies, since the mockup gives each tier a distinct hue rather than a red ramp.)* |
| E2E-04 | Every tier icon shows its tooltip on hover (desktop), on focus with Tab (all), and on tap (mobile). The text matches the fixture. |
| E2E-05 | Each card shows 6 unique numbers between 1 and 55, with the correct core count. Jackpot 2 (card 2) shows an amber bonus ball. |
| E2E-06 | The Top 6 panel shows 6 balls plus the ranked progress-bar list, and states how many draws it is based on; no period filter is present. |
| E2E-07 | The frequency chart renders 55 bars. Clicking a bar filters the table. |
| E2E-08 | The newest/oldest sort toggle reorders the table, the day-range chips and number search filter it, and selecting a Top 6 row filters it. *(No pagination: see §7.6.)* |
| E2E-09 | The mobile table renders as a card list, with no horizontal page scroll (`scrollWidth <= clientWidth`). |
| E2E-10 | Stale-data and error banners appear with the matching fixtures. If the JSON files fail to load after a successful earlier visit, the last-known data from `localStorage` is shown with the error banner. |
| E2E-11 | The disclaimer is visible in the hero area and the footer. |
| E2E-12 | With no saved choice and a `vi-VN` browser locale, the page loads in Vietnamese and `<html lang="vi">`. With `en-US` it loads in English. |
| E2E-13 | The switcher changes the hero title, tier names, tooltips, table headers and disclaimer without reloading. The choice survives a page reload. |
| E2E-14 | `?lang=en` overrides a saved `vi` choice. |
| E2E-15 | Dates and money use the locale formats in §7.11 (e.g. `30.000.000.000 ₫` in VI). |
| E2E-16 | In both languages on the mobile viewport, nothing overflows: no horizontal page scroll, and the tier headers have no clipped text. |
| E2E-17 | Pressing **Refresh** re-requests all four JSON files with a `?t=` cache buster, re-forecasts the tier cards when the served draws change, and stamps the footer refresh time only on success (§7.2a). |
| E2E-18 | Switching language does not change the frequency chart's layout: the toggle buttons keep identical widths and the panel does not reflow (§7.5). |
| E2E-19 | Hovering a frequency bar shows tooltip text in white against the dark panel, for both top-6 and non-top-6 bars. |

### 8.3 Unit tests (Vitest)

- Frequency counts and tie-break order.
- 30-day window boundaries (inclusive dates, ICT timezone).
- Recommendations: deterministic for a given date seed; 6 unique numbers; core sizes; no duplicate ticket between adjacent tiers; bonus pick not inside the core.
- Validator rejects duplicates, out-of-range numbers and future dates.
- Prune removes draws older than 30 days and keeps the rest.
- **vietlott.vn source** — runs against the committed real-HTML captures (§5.3):
  - the listing fixture parses to all 8 draws, and the newest parses exactly (id, ISO date, 6 sorted
    main numbers, bonus)
  - the bonus ball is never mistaken for a main number, in any row
  - the requested date window is honoured
  - a maintenance/redesigned page yields `[]` rather than throwing
  - the detail fixture yields both jackpot amounts and ignores the non-jackpot prize rows
  - `Retry-After` parsing: seconds, HTTP date, capped for absurd values, never negative for a past
    date, `undefined` when missing or unparseable; the polite request gap is enforced
- **App DOM smoke tests** (`@testing-library/react` + jsdom): the whole app renders against the
  fixtures with a stubbed `fetch`; header, all five tier cards with ≥6 balls each, and the populated
  history table are present; the hero sits above the Top 6 panel; tier cards are ordered Jackpot 1
  first; Refresh behaves per E2E-17; the chart toggles keep identical classes across a language
  switch.
- Range logic: an empty DB gives a 30-day range; a populated DB gives `last draw_date + 1 → today`; a 4-day outage is filled on the next run; a run with nothing new writes no draws but still writes today's snapshot.
- **i18n key parity**: `en.json` and `vi.json` have identical key sets. Every `rationale.key` the pipeline can emit exists in both files.
- `format.ts`: dates, currency and the short money forms are correct for both locales.

Run the Playwright suite in **both languages** (`test.describe.parallel` over `['vi','en']`) for E2E-01 to E2E-05.

---

## 9. CI/CD and deployment

### 9.1 `ci.yml` (on pull request)
`npm ci` → `lint` → `vitest run` → `build` → `npx playwright install --with-deps` → `playwright test` → upload the HTML report as an artifact.

### 9.2 `deploy.yml` (on push to `main`, or called by `fetch-data`)

```yaml
name: deploy
on:
  push: { branches: [main] }
  workflow_call:
  workflow_dispatch:
concurrency: { group: pages, cancel-in-progress: true }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { ref: main }   # latest main, so a call from fetch-data includes its data commit
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/deploy-pages@v4
```

- `vite.config.ts`: `base: '/6-55-lottery-jackpot-insight/'` for Pages. Use `'/'` for Vercel or Netlify.
- Data files are loaded with `fetch(import.meta.env.BASE_URL + 'data/<file>.json')`, so they work under the Pages sub-path.
- **Vercel/Netlify alternative:** connect the repo; build `npm run build`, output `dist`. No environment variables are needed. Every data commit redeploys automatically.

### 9.3 Secrets and variables

**None are needed.** The pipeline reads a public website and writes to the repo with the built-in `GITHUB_TOKEN`. In the repo settings, set *Pages → Source* to **GitHub Actions**, and allow *Actions → Workflow permissions* to **Read and write**.

---

## 10. npm scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview --port 4173",
  "pipeline": "tsx pipeline/index.ts",
  "test:unit": "vitest run",
  "test:e2e": "playwright test",
  "lint": "eslint . --max-warnings=0"
}
```

**Changed:** the unit script is `test:unit` (not `test`), lint is ESLint-only with
`--max-warnings=0` (Prettier runs through the ESLint config), and `pipeline:repair` was dropped —
`npm run pipeline -- --backfill-days=30` does the same job without a second entry to keep in sync.

---

## 11. Build plan (task order)

1. **Scaffold**: Vite React TS, Tailwind, ESLint/Prettier, `src/config/game.ts`, and the **i18n setup** (i18next, empty `en.json`/`vi.json`, `format.ts`). Every component built afterwards uses `t()` from the start, with no hard-coded text.
2. **Data files**: TypeScript types for the four JSON files (§5.1, §5.4) and `pipeline/store.ts` (read, merge, prune, atomic write) with unit tests.
3. **Pipeline core**: vietlott.vn fetcher and parser (start with saved HTML fixtures), retry and unavailable handling, validator, upsert, prune.
4. **Analytics**: `frequency.ts`, `recommend.ts` and their unit tests; snapshot writer for `stats_snapshots` and `recommendations`.
5. **First load**: run `npm run pipeline` once locally with no data files. It creates `public/data/*.json` with the last 30 days (about 13 draws). Check the files and commit them.
6. **UI**: `api.ts` and React Query hooks → Header (+ Refresh, §7.2a) → KPI stat cards → TierSuggestions hero (gradients, icons, tooltips) → TopSixPanel → frequency chart → table → disclaimer and footer.
7. **Responsive and language pass** on all 3 breakpoints in VI and EN. Complete the Vietnamese copy and have a native speaker review it.
8. **Playwright** fixtures (JSON files) and E2E tests; pipeline integration tests with mocked vietlott.vn.
9. **Workflows**: ci, deploy, fetch-data (cron), secrets and variables, and Pages setup.
10. **Smoke test in production**: trigger `fetch-data` manually; confirm the data commit, the automatic redeploy, and that the live site shows the updated data.

---

## 12. Phase 1 acceptance criteria

- [ ] The live URL loads in under 2 s on 4G. Lighthouse Performance and Accessibility are both ≥ 90.
- [ ] `public/data/draws.json` holds only the last 30 days of valid Power 6/55 draws, and new draws appear on the live site within 24 h of each draw.
- [ ] The daily job commits the updated JSON files and redeploys the site automatically; no secrets or external services are needed.
- [x] The hero shows today's 5 tier suggestions, ordered **Jackpot 1 first** down to the easiest prize, with per-tier gradient headers and a tooltip on every icon.
- [ ] The first run loads the last 30 days; the job then runs once per day; draws older than 30 days are deleted.
- [ ] All data comes from vietlott.vn only. When it is unavailable, the run logs the problem and the next successful run fills the missing draws.
- [ ] The Top 6 panel shows the 6 most frequent numbers of the last 30 days.
- [x] The frequency chart is interactive (click to filter, dataset and sort toggles, white hover text) and its layout does not move when the language changes; the table sorts and filters.
- [x] **Refresh** re-fetches the published data past any cache, re-forecasts the tier suggestions from the new draws, and updates the footer timestamp (§7.2a).
- [x] The scraper reads the real vietlott.vn markup, survives its `HTTP 429` rate limiting, and is covered by parser tests against committed real-HTML fixtures (§5.3).
- [ ] The layout works on mobile, tablet and desktop with no horizontal page scroll.
- [ ] All Playwright tests pass on 3 viewports in CI.
- [ ] The disclaimer is visible; the data source is credited.
- [ ] The whole UI is available in Vietnamese and English. The language switcher works, the choice is remembered, and the `?lang` link works. There is no untranslated text in either language.

## 13. Out of scope for Phase 1 (ideas for Phase 2)

Other games (Mega 6/45, Max 3D), user-saved tickets and auto-checking of results (this would need a hosted database with user accounts, e.g. Supabase), push or email alerts, more languages, PWA offline mode.
