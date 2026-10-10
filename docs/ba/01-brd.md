# Business Requirements Document (BRD)

## 1. Overview

This application is a static analytics dashboard for Vietlott Power 6/55 results. Based on the actual codebase, it provides a 30-day rolling window of draw history, frequency and trend analytics, tier-based suggestions, and a filterable results table. The implementation sits in [src/App.tsx](../../src/App.tsx), [src/components](../../src/components), and the data pipeline under [pipeline](../../pipeline).

## 2. Business context

The current product addresses a common need for lottery participants to review historical results and infer patterns from the most recent draws. The implementation is fully based on observed data and a deterministic recommendation logic; it does not claim to predict future draws or improve winning odds.

The code explicitly states that recommendations are entertainment-oriented and not a guaranteed path to success. This is reflected in the visible disclaimer in [src/components/Disclaimer.tsx](../../src/components/Disclaimer.tsx) and in the README disclaimer at [README.md](../../README.md).

## 3. Problem statement

Users need a lightweight, static way to:

- review the latest Power 6/55 draws,
- look at recent frequency patterns,
- filter and inspect number history, and
- view suggested number combinations built from recent data.

The application does this without a backend, database, or user-authenticated workflow. It depends on a scheduled data refresh and static JSON snapshots.

## 4. Business objectives

- Provide a clear summary of recent Power 6/55 draw history.
- Surface the most frequently appearing and recently seen numbers.
- Present deterministic tier suggestions based on historical frequency and recency behavior.
- Keep the user experience bilingual and responsive.
- Minimize operational complexity by using static files and GitHub-hosted deployment patterns.

## 5. Scope

### In scope

- Display of latest historical draws
- Rolling 30-day analytics window
- Frequency ranking for main numbers and bonus ball
- Top 6 hot numbers panel
- Tier suggestion cards for five prize tiers
- Filter by number, date range, match mode, and sort order
- Refresh capability for published data assets
- Bilingual UI
- Static-data pipeline with validation and failure handling

### Out of scope

- User accounts or profile management
- Ticket purchase or betting
- Real-time gambling execution
- Claim processing or prize administration
- Predictive model certification or risk guarantees
- Any backend analytics service beyond static JSON publication

## 6. Stakeholders

- Product owner / repository maintainer: owns product decisions and data strategy
- End user: anonymous visitor viewing results and suggestions
- Developers / QA: maintain the pipeline, tests, and UI
- Operational owner: manages GitHub Actions workflow and data refresh cadence

## 7. Business requirements

| ID | Priority | Status | Requirement |
| --- | --- | --- | --- |
| BRD-01 | High | Implemented | The system shall present recent Vietlott Power 6/55 draw results in a readable history table. |
| BRD-02 | High | Implemented | The system shall summarize the most frequent and recently seen numbers across a rolling 30-day window. |
| BRD-03 | High | Implemented | The system shall generate five prize-tier suggestion cards with number combinations for the current period. |
| BRD-04 | High | Implemented | The system shall allow users to filter historical results by recent day range, number, match mode, and sort order. |
| BRD-05 | Medium | Implemented | The system shall show jackpot and second-tier amounts when available from the source data. |
| BRD-06 | Medium | Implemented | The system shall provide a stale-data warning when the local dataset is older than the configured threshold. |
| BRD-07 | Medium | Implemented | The system shall support Vietnamese and English content selection in the same UI. |
| BRD-08 | Medium | Implemented | The system shall display an explicit disclaimer that lottery suggestions do not improve the odds of winning. |
| BRD-09 | Medium | Implemented | The system shall refresh published data files using a cache-busted fetch pattern after a user-triggered refresh action. |
| BRD-10 | Medium | Partially implemented | The system shall recover safely when the upstream source is unavailable and preserve prior data. |
| BRD-11 | Low | Requires confirmation | The system shall be treated as entertainment-only, decision support, or a public informational utility. |
| BRD-12 | Low | Not implemented | The system shall allow authenticated user personalization or saving favorite number sets. |

## 8. Business rules and assumptions

- The app assumes one draw window of the last 30 days and one set of ranking rules.
- Suggestions are generated deterministically from historical draws using seeded date logic in [src/lib/dates.ts](../../src/lib/dates.ts) and [src/lib/recommend.ts](../../src/lib/recommend.ts).
- The app uses “frequency” as a backtest heuristic and does not claim predictive accuracy.
- The source system is treated as a single external operator source, vietlott.vn.

## 9. Risks and constraints

- The scraper depends on a third-party website structure and can fail if the markup changes.
- The app is read-only and cannot process user-submitted corrections or errors.
- The data is currently static and therefore cannot react in real time to each draw without a refresh cycle.

## 10. Business decision points requiring confirmation

1. Should this remain an entertainment dashboard or become a decision-support tool for a defined audience?
2. Is the static GitHub-hosted architecture acceptable for the intended operational model?
3. Does the organization want to maintain the current third-party scraping pattern or move to an officially provided dataset or API?

---

This BRD reflects the implemented application and intentionally avoids claiming future product scope beyond the verified code and current deployment model.
