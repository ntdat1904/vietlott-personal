# Requirements Traceability Matrix (RTM)

| BRD ID | SRS ID | User Story ID | Implementation Evidence | Test Coverage |
| --- | --- | --- | --- | --- |
| BRD-01 | SRS-FUNC-01, SRS-FUNC-07 | US-01 | [src/App.tsx](../../src/App.tsx), [src/components/ResultsTable.tsx](../../src/components/ResultsTable.tsx) | QA-04 |
| BRD-02 | SRS-FUNC-03, SRS-FUNC-05 | US-03 | [src/components/TopSixPanel.tsx](../../src/components/TopSixPanel.tsx), [src/lib/frequency.ts](../../src/lib/frequency.ts) | QA-03 |
| BRD-03 | SRS-FUNC-06 | US-05, US-06 | [src/components/TierSuggestions/TierSuggestions.tsx](../../src/components/TierSuggestions/TierSuggestions.tsx), [src/lib/recommend.ts](../../src/lib/recommend.ts) | QA-02 |
| BRD-04 | SRS-FUNC-08, SRS-FUNC-09 | US-02 | [src/components/ResultsTable.tsx](../../src/components/ResultsTable.tsx) | QA-05, QA-06 |
| BRD-05 | SRS-FUNC-07 | US-01 | [src/components/StatCards.tsx](../../src/components/StatCards.tsx) | QA-04 |
| BRD-06 | SRS-FUNC-11 | US-08 | [src/components/Banners.tsx](../../src/components/Banners.tsx), [src/App.tsx](../../src/App.tsx) | QA-09 |
| BRD-07 | SRS-FUNC-13, SRS-NFR-04 | US-09 | [src/i18n/index.ts](../../src/i18n/index.ts), [src/components/LanguageSwitcher.tsx](../../src/components/LanguageSwitcher.tsx) | QA-11 |
| BRD-08 | SRS-FUNC-14 | US-10 | [src/components/Disclaimer.tsx](../../src/components/Disclaimer.tsx) | QA-12 |
| BRD-09 | SRS-FUNC-10 | US-07 | [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts), [src/lib/api.ts](../../src/lib/api.ts) | QA-08, QA-18 |
| BRD-10 | SRS-FUNC-16 | US-11 | [pipeline/index.ts](../../pipeline/index.ts), [pipeline/sources/vietlott.ts](../../pipeline/sources/vietlott.ts) | QA-14 |
| BRD-11 | SRS-FUNC-17, SRS-NFR-08 | — | Requires confirmation | None |
| BRD-12 | SRS-FUNC-18 | — | Not implemented | None |

## 2. Coverage analysis

### Requirements implemented and tested
- Core dashboard rendering, data fetching, filtering, recommendations, and stale-banner behavior are represented in code and covered by the available automated tests.

### Requirements implemented without direct documentation in this BA set
- Some technical details (e.g., specific seeded recommendation logic) exist in code but are described in the functional and data-dictionary sections rather than duplicated elsewhere.

### Requirements without test coverage
- The product owner decision items (BRD-11) are not covered by automated tests because the implementation is not yet defined.
- Some environment-specific behaviors, including source outage and CI deployments, are only partially covered in script logic and documentation.

### Requirements with no implementation
- User personalization and export features are not implemented and are tracked as not implemented.

---

This matrix reflects the requirements evidenced by the current repository state and the available test or implementation artifacts.
