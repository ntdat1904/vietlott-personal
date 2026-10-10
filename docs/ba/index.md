# Business Analysis Documentation Index

## Application inventory and evidence base

This project is a static React single-page application for Vietlott Power 6/55 prize analysis. The implementation evidence reviewed includes:

- React entry and app shell in [src/main.tsx](../../src/main.tsx) and [src/App.tsx](../../src/App.tsx)
- Domain logic in [src/config/game.ts](../../src/config/game.ts), [src/lib/frequency.ts](../../src/lib/frequency.ts), and [src/lib/recommend.ts](../../src/lib/recommend.ts)
- Data fetch and cache logic in [src/lib/api.ts](../../src/lib/api.ts) and [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts)
- UI panels and interactions in [src/components](../../src/components)
- Data pipeline in [pipeline/index.ts](../../pipeline/index.ts), [pipeline/snapshot.ts](../../pipeline/snapshot.ts), [pipeline/validate.ts](../../pipeline/validate.ts), and [pipeline/sources/vietlott.ts](../../pipeline/sources/vietlott.ts)
- Published sample data in [public/data](../../public/data)
- Project build and verification notes in [README.md](../../README.md)

## Implementation status summary

- Implemented: static SPA, bilingual UI, result table, frequency chart, Top 6 panel, tier suggestions, data refresh workflow, pipeline fetch/validate/merge logic, and disclaimers.
- Partially implemented: real-time freshness status is static, scraper depends on external site markup, and initial cold start can only contain the most recent scraped rows if the site is unavailable.
- Not implemented: any authentication, user accounts, betting, persistence beyond static JSON, or external analytics backend.
- Requires confirmation: intended audience, product owner priorities, live deployment strategy, and whether the app is intended purely for entertainment rather than decision-making.

## Document set

| Document | Audience | Purpose |
| --- | --- | --- |
| [01-brd.md](01-brd.md) | Product owner, BA, stakeholders | Business context, scope, and priorities |
| [02-srs.md](02-srs.md) | BA, developers, QA | Functional and non-functional requirements |
| [03-user-stories.md](03-user-stories.md) | BA, QA, delivery team | User stories and acceptance criteria |
| [04-process-flows.md](04-process-flows.md) | Product, UX, QA | End-to-end journeys and system flows |
| [05-functional-specification.md](05-functional-specification.md) | Developers, QA | Screen/component-level behavior |
| [06-data-dictionary.md](06-data-dictionary.md) | Data/BA/QA | Entities, data fields, and rules |
| [07-api-and-integration-spec.md](07-api-and-integration-spec.md) | Integration/QA/dev team | External and internal data integrations |
| [08-ui-inventory.md](08-ui-inventory.md) | UX, QA, product | Screen inventory and state model |
| [09-qa-test-scenarios.md](09-qa-test-scenarios.md) | QA, automation team | Test coverage by requirement |
| [10-requirements-traceability-matrix.md](10-requirements-traceability-matrix.md) | BA, QA, stakeholders | Requirement-to-implementation mapping |
| [11-known-gaps-risks-open-questions.md](11-known-gaps-risks-open-questions.md) | Product owner, stakeholders | Risk register and unresolved questions |
| [12-ba-handover-and-product-overview.md](12-ba-handover-and-product-overview.md) | Executives and stakeholders | Product overview and summary |

## Business summary

The application presents historical Vietlott Power 6/55 draw results, frequency summaries, and ranked number suggestions generated from a 30-day rolling window. It is a static, read-only dashboard built around a daily data refresh pipeline that scrapes results from vietlott.vn, validates them, prunes/merges the local dataset, and republishes JSON snapshots used by the frontend.

The frontend is intentionally opinionated and non-transactional: it does not allow users to place bets, create accounts, or submit data. It supports Vietnamese and English display, displays disclaimers, and provides filtering and interaction by hot numbers and result history.

## Most important unresolved business questions

- Is this product intended for entertainment-only consumption, or does leadership expect it to support real decision-making or strategy?
- Is the current data-refresh model acceptable for production use, or should a managed backend replace the static JSON flow?
- Should the site continue to present lottery suggestions as if they are informative rather than predictive?
- Are there explicit product requirements for accessibility, deployment target, and maintenance ownership beyond the current GitHub-based implementation?

---

This index is intentionally grounded in the codebase as implemented. Any item marked as “Requires Confirmation” reflects missing product evidence rather than assumptions about future state.
