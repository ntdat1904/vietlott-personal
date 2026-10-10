# QA Test Scenarios

## 1. Test scenario catalog

| Test ID | Requirement ID | Priority | Type | Title |
| --- | --- | --- | --- | --- |
| QA-01 | BRD-01, SRS-FUNC-01 | High | Positive | App renders dashboard shell |
| QA-02 | BRD-03, SRS-FUNC-06 | High | Positive | Five tier cards are visible |
| QA-03 | BRD-02, SRS-FUNC-03 | High | Positive | Top 6 numbers display correctly |
| QA-04 | SRS-FUNC-07 | High | Positive | Results table displays draw history |
| QA-05 | BRD-04, SRS-FUNC-08 | High | Positive | Range filter limits visible rows |
| QA-06 | BRD-04, SRS-FUNC-08 | High | Positive | Number search filters rows |
| QA-07 | BRD-04, SRS-FUNC-09 | High | Negative | Invalid numeric search is ignored |
| QA-08 | SRS-FUNC-10 | High | Positive | Refresh fetches all data files |
| QA-09 | SRS-FUNC-11 | Medium | Positive | Stale banner appears when data is stale |
| QA-10 | SRS-FUNC-12 | Medium | Negative | Error banner appears when fetch fails |
| QA-11 | SRS-FUNC-13 | Medium | Positive | Language switch updates UI |
| QA-12 | BRD-08, SRS-FUNC-14 | Medium | Positive | Disclaimer is visible |
| QA-13 | SRS-FUNC-15 | High | Validation | Invalid draw is rejected |
| QA-14 | SRS-FUNC-16 | Medium | Integration | Partial pipeline run preserves old data |
| QA-15 | SRS-NFR-02 | Medium | Regression | Mobile layout remains usable |
| QA-16 | SRS-NFR-06 | Medium | Integration | Source throttling is retried correctly |
| QA-17 | SRS-FUNC-06 | Medium | Boundary | Small sample warning appears with limited draws |
| QA-18 | BRD-09 | Medium | Regression | Cache-busting query string is added on refresh |

## 2. Detailed scenarios

### QA-01 — App renders dashboard shell
- Preconditions: data files are served successfully.
- Steps:
  1. Load the root page.
  2. Wait for data fetch completion.
- Expected result: header, stat cards, suggested tiers, Top 6 panel, chart, and results table render.
- Automation suitability: High

### QA-02 — Five tier cards are visible
- Preconditions: valid recommendation payload present.
- Steps:
  1. Render app.
  2. Wait for suggestions section to load.
- Expected result: exactly five tier cards render in Jackpot 1 -> Prize 3 order.
- Automation suitability: High

### QA-03 — Top 6 numbers display correctly
- Preconditions: stats payload present.
- Steps:
  1. Render app.
  2. Observe Top 6 panel.
- Expected result: six highest-frequency numbers are displayed and each rank reflects count and percentage.
- Automation suitability: High

### QA-04 — Results table displays draw history
- Preconditions: draws payload present.
- Steps:
  1. Render app.
  2. Wait for results section.
- Expected result: table shows draw ID, draw date, numbers, bonus, jackpot 1, and jackpot 2.
- Automation suitability: High

### QA-05 — Range filter limits visible rows
- Preconditions: more than 30 days of draw data available.
- Steps:
  1. Click the 7-day chip.
  2. Observe rows.
- Expected result: only draws within the last 7 days remain visible.
- Automation suitability: High

### QA-06 — Number search filters rows
- Preconditions: valid data loaded.
- Steps:
  1. Enter `7 23` in the search field.
  2. Use `any` mode.
- Expected result: table shows only rows containing either 7 or 23 in the lucky numbers or bonus ball.
- Automation suitability: High

### QA-07 — Invalid numeric search is ignored
- Preconditions: data loaded.
- Steps:
  1. Enter `abc 999` or other invalid values.
- Expected result: invalid tokens are ignored and only valid 1–55 values participate in filtering.
- Automation suitability: Medium

### QA-08 — Refresh fetches all data files
- Preconditions: app is open and fetch is stubbed.
- Steps:
  1. Click Refresh.
  2. Inspect URLs.
- Expected result: requests include cache-busting query strings for meta, draws, stats, and recommendations.
- Automation suitability: High

### QA-09 — Stale banner appears when data is stale
- Preconditions: `lastDrawDate` older than `STALE_DATA_DAYS`.
- Steps:
  1. Render app with stale data.
- Expected result: a stale warning banner is displayed.
- Automation suitability: Medium

### QA-10 — Error banner appears when fetch fails
- Preconditions: network failure or missing fetch response.
- Steps:
  1. Trigger a failed fetch.
- Expected result: `ErrorBanner` renders and offers retry.
- Automation suitability: High

### QA-11 — Language switch updates UI
- Preconditions: app loads in Vietnamese.
- Steps:
  1. Click English.
- Expected result: text language and title update; chart widths remain stable.
- Automation suitability: High

### QA-12 — Disclaimer is visible
- Preconditions: page loads.
- Steps:
  1. Scroll to bottom of page.
- Expected result: disclaimer explains randomness and entertainment-only use.
- Automation suitability: Medium

### QA-13 — Invalid draw is rejected
- Preconditions: a test row contains duplicate or out-of-range values.
- Steps:
  1. Run validation on a parsed draw list.
- Expected result: the invalid draw is rejected and logged.
- Automation suitability: High

### QA-14 — Partial pipeline run preserves old data
- Preconditions: upstream source is unavailable.
- Steps:
  1. Trigger pipeline with source outage.
- Expected result: run status is partial and previous snapshot stays intact.
- Automation suitability: Medium

### QA-15 — Mobile layout remains usable
- Preconditions: viewport set to a small mobile size.
- Steps:
  1. Render app.
  2. View each major section.
- Expected result: table collapses to mobile cards and content remains readable without overlap.
- Automation suitability: High

### QA-16 — Source throttling is retried correctly
- Preconditions: source returns HTTP 429/503 and retry-after metadata.
- Steps:
  1. Invoke source fetch.
- Expected result: code waits, retries, and eventually either succeeds or logs a partial source outage.
- Automation suitability: Medium

### QA-17 — Small sample warning appears with limited draws
- Preconditions: fewer than 8 draws are available.
- Steps:
  1. Render app with low data count.
- Expected result: a warning about small sample size is shown.
- Automation suitability: Medium

### QA-18 — Cache-busting query string added on refresh
- Preconditions: app is rendered and refresh is triggered.
- Steps:
  1. Click refresh.
- Expected result: each fetch URL includes `?t=` and the timestamp changes per refresh.
- Automation suitability: High

## 3. Non-automated QA checks

- Confirm the live-data badge is actually static and not tied to real-time health.
- Review the displayed disclaimer for legal and product wording alignment.
- Validate whether the app is intended as entertainment-only or as decision support.

---

These test scenarios are based on the source implementation and the current fixture/test strategy. They do not rely on future or hypothetical product requirements.
