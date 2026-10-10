# Software Requirements Specification (SRS)

## 1. Purpose

This SRS describes the implemented behavior of the lottery analytics application, as evidenced by the current code and sample data. The system is a static front-end that fetches JSON snapshots representing recent Vietlott Power 6/55 draws and renders analytics views.

## 2. Product context

The application loads data from the published files in [public/data](../../public/data) and renders the dashboard in [src/App.tsx](../../src/App.tsx). Data generation logic is in [pipeline/index.ts](../../pipeline/index.ts) and computation logic is in [src/lib/frequency.ts](../../src/lib/frequency.ts) and [src/lib/recommend.ts](../../src/lib/recommend.ts).

## 3. User roles and actors

### 3.1 Anonymous visitor
- Role: general user browsing results and suggestions.
- Permissions: read-only access to the data and UI.
- Implementation status: Implemented.

### 3.2 Maintainer / pipeline operator
- Role: runs data refresh workflow and validates source files.
- Permissions: access to repository, GitHub Actions, and local pipeline execution.
- Implementation status: Implemented at a repository workflow level.

## 4. Functional requirements

| ID | Status | Requirement |
| --- | --- | --- |
| SRS-FUNC-01 | Implemented | The system shall render a single-page dashboard for Power 6/55 draws. |
| SRS-FUNC-02 | Implemented | The system shall fetch and display draw, stat, recommendation, and metadata JSON payloads from the local static data store. |
| SRS-FUNC-03 | Implemented | The system shall compute main-number frequency across the latest draw set and rank the values from highest to lowest count. |
| SRS-FUNC-04 | Implemented | The system shall compute bonus-ball frequency and render it separately from the main-number chart. |
| SRS-FUNC-05 | Implemented | The system shall calculate a Top 6 ranking using the frequency sorted list and render it visually. |
| SRS-FUNC-06 | Implemented | The system shall generate five recommendation tier cards with deterministic ticket suggestions based on historical frequency, recency, and pair affinity. |
| SRS-FUNC-07 | Implemented | The system shall render a results table for the dataset including draw ID, date, six numbers, bonus, jackpot 1, and jackpot 2. |
| SRS-FUNC-08 | Implemented | The system shall support filtering by number, day range, sort order, and match mode in the results table. |
| SRS-FUNC-09 | Implemented | The system shall allow the user to select a highlighted number from the Top 6 panel or chart to filter result rows. |
| SRS-FUNC-10 | Implemented | The system shall refresh all published data files when the user triggers a manual refresh. |
| SRS-FUNC-11 | Implemented | The system shall display a warning banner when the last known data is older than the configured stale threshold. |
| SRS-FUNC-12 | Implemented | The system shall show an error banner when data fetches fail and no cached fallback is available. |
| SRS-FUNC-13 | Implemented | The system shall render a bilingual interface in Vietnamese and English. |
| SRS-FUNC-14 | Implemented | The system shall include a visible disclaimer explaining that lottery suggestions are not predictive. |
| SRS-FUNC-15 | Implemented | The system shall validate fetched draw records against known domain rules before they are accepted into the local dataset. |
| SRS-FUNC-16 | Partially implemented | The system shall gracefully continue with previously committed data if the upstream lottery website is unavailable. |
| SRS-FUNC-17 | Requires confirmation | The system shall provide a production-ready authentication or multi-user permission model. |
| SRS-FUNC-18 | Not implemented | The system shall let users save or export custom suggested number sets. |

## 5. Non-functional requirements

| ID | Status | Requirement |
| --- | --- | --- |
| SRS-NFR-01 | Implemented | The app shall be delivered as a static client-side application with no persistent backend database. |
| SRS-NFR-02 | Implemented | The app shall be responsive for mobile, tablet, and desktop layouts. |
| SRS-NFR-03 | Implemented | The app shall use a dark-slate UI theme with high contrast for key actions and badges. |
| SRS-NFR-04 | Implemented | The app shall support Vietnamese as the default language and English as the alternate language. |
| SRS-NFR-05 | Implemented | The app shall maintain a 30-day default statistical window and compute values from local JSON snapshots. |
| SRS-NFR-06 | Implemented | The pipeline shall observe a minimum request interval and retry/backoff behavior when contacting the source site. |
| SRS-NFR-07 | Partially implemented | The app shall indicate freshness, but the live-data badge is static rather than a true live-state indicator. |
| SRS-NFR-08 | Requires confirmation | The system shall define the intended production availability and maintenance SLA for upstream scraping. |

## 6. Business rules

- Number pool is 1–55 for main numbers and 1–55 for bonus ball, as defined in [src/config/game.ts](../../src/config/game.ts).
- Draw dates are expected on Tuesday, Thursday, and Saturday, as enforced by `DRAW_DAYS` and `isDrawDay` in [src/lib/dates.ts](../../src/lib/dates.ts).
- A valid draw must contain exactly six unique main numbers and a distinct bonus number.
- A draw date cannot be in the future.
- Recommendation cards are generated in fixed descending prize order: Jackpot 1, Jackpot 2, Prize 1, Prize 2, Prize 3. This ordering is defined in [src/config/game.ts](../../src/config/game.ts).
- Suggestions are deterministic for a given date because they use a seeded pseudo-random generator based on the current date.

## 7. Input and output specifications

### 7.1 Input sources
- `public/data/draws.json` containing draw records
- `public/data/stats.json` containing aggregated frequency and trend data
- `public/data/recommendations.json` containing the generated tier suggestions
- `public/data/meta.json` containing generation metadata
- External scraped HTML from vietlott.vn via the scraper in [pipeline/sources/vietlott.ts](../../pipeline/sources/vietlott.ts)

### 7.2 Output formats
- JSON objects with schema version metadata and arrays of typed values
- A browser-rendered dashboard using React components
- GitHub Actions workflow logs and persisted fetch logs in [data/fetch-log.json](../../data/fetch-log.json)

## 8. Error handling and edge cases

- If fetches to the source site fail, the pipeline marks the run as partial instead of crashing unless the data is overdue beyond 48 hours.
- If a detail page fails for a single draw, the pipeline keeps the rest of the run and leaves the field missing rather than rejecting all rows.
- If the source page returns no parseable rows, the pipeline treats it as empty rather than a fatal error.
- If a draw record violates domain validation, it is rejected and logged by the pipeline.
- If local cache exists and a remote fetch fails, the frontend will fall back to cached data.

## 9. Constraints

- No backend database is implemented.
- Data is refreshed by static publishing rather than a live API.
- The source site provides no CORS headers enabling browser-based scraping; therefore, the data must be fetched by a pipeline server-side or CI workflow.
- The app assumes a single shared data snapshot and does not support multi-user editing or role-based permissions.

## 10. Open questions

- What is the intended operational hosting target for the product?
- Should the app remain a static informational tool, or is there a requirement for a real-time decision system?
- Who owns the maintenance of upstream source selectors when vietlott.vn changes markup?

---

This SRS reflects the implemented state of the application. It intentionally excludes unverified requirements and explicitly marks assumptions as “Requires Confirmation” where no code evidence exists.
