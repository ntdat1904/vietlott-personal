# API and Integration Specification

## 1. Scope

The project currently has no application server or database. It uses browser fetches to static JSON files and a Node-based pipeline to pull data from the external source website. The key source files are:

- [src/lib/api.ts](../../src/lib/api.ts)
- [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts)
- [pipeline/index.ts](../../pipeline/index.ts)
- [pipeline/sources/vietlott.ts](../../pipeline/sources/vietlott.ts)
- [.github/workflows/fetch-data.yml](../../.github/workflows/fetch-data.yml)

## 2. Internal API: static JSON dataset

### 2.1 Base URL
The app sets the base data URL via `import.meta.env.BASE_URL`, then reads the local dataset from `/data/*`.

### 2.2 Endpoints
| File | Method | URL pattern | Purpose |
| --- | --- | --- | --- |
| `meta.json` | GET | `${BASE_URL}data/meta.json` | Dataset generation metadata |
| `draws.json` | GET | `${BASE_URL}data/draws.json` | List of results and jackpot amounts |
| `stats.json` | GET | `${BASE_URL}data/stats.json` | Frequency and trend summary |
| `recommendations.json` | GET | `${BASE_URL}data/recommendations.json` | Generated tier suggestions |

### 2.3 Request behavior
- Fetches use `cache: 'reload'` on refreshes and `cache: 'no-cache'` otherwise.
- A manual refresh adds a `?t=<timestamp>` query string to bypass stale browser or CDN caches.
- When a fetch fails, the app tries to return a cached value from localStorage.

### 2.4 Response shape
- JSON objects are typed in [src/lib/api.ts](../../src/lib/api.ts).
- `DrawsFile`, `Meta`, `StatsPayload`, and `RecommendationsPayload` are all versioned with `schemaVersion: 1`.

### 2.5 Authentication and security
- No authentication is implemented for the browser fetches.
- No secret handling is required in the API layer.
- The project explicitly contains no user-login flow or credential model.

## 3. External integration: vietlott.vn

### 3.1 Source type
The data source is a public HTML site, not a JSON API. The scraper reads the listing and detail pages from vietlott.vn.

### 3.2 Pages used
| Page | URL pattern | Purpose |
| --- | --- | --- |
| Results listing | `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/winning-number-655` | Date, draw ID, six main numbers, bonus |
| Draw detail | `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/655?id=<drawId>&nocatche=1` | Jackpot 1 and Jackpot 2 amounts |

### 3.3 Scraper behavior
The scraper in [pipeline/sources/vietlott.ts](../../pipeline/sources/vietlott.ts) implements:
- user-agent spoofing to mimic a browser
- 2.5-second minimum interval between requests
- `Retry-After` header support when present
- 429/503 handling with extended backoff
- failure absorption into a partial run status

### 3.4 Error handling
- Response not OK raises a `SourceUnavailableError` after retries.
- A single detail-page failure does not fail the entire run; it simply leaves the jackpot fields undefined.
- A page that loads with no parseable rows is treated as empty, not fatal.

## 4. Scheduled jobs and background processes

### 4.1 GitHub Actions workflow
Files:
- [.github/workflows/fetch-data.yml](../../.github/workflows/fetch-data.yml)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)

The fetch-data workflow is the scheduled integration point. It loads the latest source data, updates static files, and then redeploys if appropriate.

### 4.2 Local pipeline entry
Command: `npm run pipeline` in the project root.

Execution path:
- `pipeline/index.ts` reads and merges prior data
- `validateDraws()` rejects invalid records
- `buildStatsPayload()` and `buildRecommendationsPayload()` regenerate analytics
- output is written to `public/data/*.json`

## 5. Data contracts

### 5.1 Payload contract and versioning
- All JSON payloads use a `schemaVersion` field with value `1`.
- The frontend assumes a set of known fields as defined by the TS types.

### 5.2 Integration assumptions
- The app assumes a consistent draw ID and date sequence from the source site.
- It assumes the source list page exposes the most recent draws and award values on detail pages.
- It assumes the data refresh job has access to network egress and can run in CI.

## 6. Integration constraints and limitations

- The app has no server-side API layer; all integration is file-based.
- There is no backend that can enforce data integrity beyond the validation script.
- The app depends on third-party site selectors and HTML structure. A layout change can break the integration.
- The current workflow is not a formal enterprise integration management pattern; it is a script-driven static data pipeline.

## 7. Verified observations

The code and sample files confirm a working pattern for:
- static browser fetches,
- scheduled pipeline refresh,
- local validation,
- stale-data fallback,
- and partial-run resiliency.

These are implemented in [README.md](../../README.md), [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts), and [pipeline/index.ts](../../pipeline/index.ts).

---

This integration spec is limited to the architecture that is actually present in the repository and does not infer APIs or services that are not implemented.
