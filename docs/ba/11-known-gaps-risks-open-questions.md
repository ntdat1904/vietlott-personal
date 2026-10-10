# Known Gaps, Risks, and Open Questions

## 1. Confirmed findings from code review

### 1.1 The app is a static informational dashboard
The implementation confirms a non-authenticated, single-page client with static data files. There is no backend API layer or database in the current repo. Evidence: [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts), [src/lib/api.ts](../../src/lib/api.ts), and [README.md](../../README.md).

### 1.2 The system depends on third-party HTML structure
The scraper relies on specific CSS selectors from vietlott.vn. A markup change could break the integration. Evidence: [pipeline/sources/vietlott.ts](../../pipeline/sources/vietlott.ts).

### 1.3 Freshness is not fully reflected in the live-data badge
The README explicitly calls out that the header’s “live data” badge is static rather than reflecting true fetch state. This is a known limitation.

### 1.4 Cold-start data may be thin
The source listing page only exposes the most recent draws, so a cold start may begin with fewer than 30 days of data.

### 1.5 Suggestions are heuristic and not guaranteed
The UI and README explicitly state that the number suggestions are based only on past frequency and do not improve the odds of winning.

## 2. Partially implemented areas

- Upstream outage handling is implemented, but product requirements for support SLAs and uptime expectations are not documented.
- The app supports bilingual display and static refresh, but no business workflow defines product localization governance.
- The pipeline keeps prior data safe on failure, but no formal operational dashboard or alerting standard is described.

## 3. Not implemented areas

- User authentication or authorization
- User accounts and saved favorites
- Betting or purchase flows
- Exporting or printing number suggestions
- Real-time data streaming or a operational message bus
- Customer support or claim workflows

## 4. Risks

### Technical risk
- Site markup changes can break the scraper without any app error until data quality checks fail.

### Data risk
- The dataset is only as current as the last successful refresh and is intentionally retained in a limited 30-day window.

### Product risk
- Without clear stakeholder positioning, users may interpret the tool as a predictive winning system when it is explicitly a pattern-analysis tool.

## 5. Open questions for Product Owner or stakeholders

1. Is the primary business purpose entertainment-only analysis, or is this expected to support strategic or operational decision-making?
2. Is the current static GitHub-based pipeline acceptable for the target production environment?
3. Should the project continue to rely on a third-party public website without a supported data contract?
4. Are any legal or compliance requirements needed for which the disclaimer is currently insufficient?
5. Does the team want to expand the product later to support saved tickets, user preferences, or exports?

## 6. Recommendations

- Define the intended audience and business use case before expanding the dashboard into a decision-support feature.
- Document a formal maintenance owner for the scraper and selector updates.
- Consider a future service-level policy for source availability and stale-data alerting.
- Confirm that the disclaimer language aligns with product and compliance expectations.
- Consider whether the project needs a repository backlog item to replace scraping with a partner API or official data feed.

---

This section distinguishes confirmed implementation findings from assumptions and unresolved product questions. Any future roadmap item should be treated as out-of-scope unless specifically approved by the product owner.
