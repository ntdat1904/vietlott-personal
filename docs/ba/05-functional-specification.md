# Functional Specification

## 1. Screen overview

The application is a single-page dashboard with no client-side router. The root screen is constructed in [src/App.tsx](../../src/App.tsx) and consists of the following major sections:

1. Header
2. Error / stale banners
3. KPI stat cards
4. Tier suggestion section
5. Top 6 and frequency chart section
6. Filterable results table
7. Disclaimer
8. Footer

## 2. Component-level specification

### 2.1 Header
File: [src/components/Header.tsx](../../src/components/Header.tsx)

Purpose:
- Brand the app and establish the Power 6/55 lottery dashboard context.
- Provide control to refresh data.
- Provide language selection.

Controls:
- `Refresh` button triggers `refetchAll()` from [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts)
- Language switcher toggles between Vietnamese and English

States:
- Default: enabled
- Refreshing: disabled and shows spinner
- Error states are handled outside the header via banner components

### 2.2 Stat cards
File: [src/components/StatCards.tsx](../../src/components/StatCards.tsx)

Displays:
- analyzed draws count
- latest draw identifier
- latest draw date
- latest jackpot 1 value
- latest jackpot 2 value

The latest draw uses the first element in the `draws` list, which is treated as newest due to the pipeline’s merge logic and sorting assumptions in [src/lib/frequency.ts](../../src/lib/frequency.ts).

### 2.3 Tier suggestion section
Files: [src/components/TierSuggestions/TierSuggestions.tsx](../../src/components/TierSuggestions/TierSuggestions.tsx), [src/components/TierSuggestions/TierCard.tsx](../../src/components/TierSuggestions/TierCard.tsx)

Purpose:
- Display five suggestion cards in prize-order configuration.
- Show grouped number suggestions and a bonus pick where applicable.
- Show rule, expected prize label, odds, and strategy text.

Config origin:
- `TIERS` in [src/config/game.ts](../../src/config/game.ts)
- order: Jackpot 1 -> Jackpot 2 -> Prize 1 -> Prize 2 -> Prize 3

Behavior:
- `buildRecommendations()` generates tickets deterministically from the most recent draw set and current date.
- Reforecast on refresh using the latest `draws.data` rather than trusting the static recommendation snapshot.

### 2.4 Top 6 panel
File: [src/components/TopSixPanel.tsx](../../src/components/TopSixPanel.tsx)

Purpose:
- Show the six most frequent main numbers.
- Rank them by frequency.
- Make each number clickable to filter history.

Computed value:
- `stats.frequency.slice(0, 6)`
- percentage of appearance = `entry.count / stats.drawCount * 100`

### 2.5 Frequency chart
File: [src/components/FrequencyChart.tsx](../../src/components/FrequencyChart.tsx)

Purpose:
- Display 1–55 bars for main-number or bonus-number frequency.
- Support natural sort or frequency sort.
- Highlight active selected number and top six.

Interactive behaviors:
- Data set toggle: `main` / `bonus`
- Sort toggle: `natural` / `frequency`
- Click bar to filter table by selected number

Expected average line:
- main: `(drawCount * 6) / 55`
- bonus: `drawCount / 55`

### 2.6 Results table
File: [src/components/ResultsTable.tsx](../../src/components/ResultsTable.tsx)

Purpose:
- Explore historical numbers and draw metadata.

Controls:
- Range chips: 7 / 14 / 30 days
- Sort toggle: newest-first or oldest-first
- Search input for number tokens like `7 23` or `7,23`
- Match mode: any or all numbers
- Clear active number filter

Filtering logic:
- `draws.filter((d) => d.date >= cutoff)`
- optional active number filter: `d.numbers.includes(activeNumber) || d.bonus === activeNumber`
- optional search filter: numbers must match any/all selected values across main numbers and bonus

States:
- No rows: empty-state text
- Loading: page-level loading text if there are no stats yet

### 2.7 Disclaimer and footer
Files: [src/components/Disclaimer.tsx](../../src/components/Disclaimer.tsx), [src/components/Footer.tsx](../../src/components/Footer.tsx)

Purpose:
- Reinforce the entertainment-only disclaimer
- Show data source attribution and timestamps

Footer metadata:
- `generatedAt` from `meta.json`
- `refreshedAt` set after a successful manual refresh

## 3. Functional rules and calculations

### 3.1 Frequency calculation
The implementation in [src/lib/frequency.ts](../../src/lib/frequency.ts) calculates counts for each number in the valid pool. The internal rule is:
- sort by count descending,
- then by most recent last-seen date,
- then by number ascending.

### 3.2 Recency calculation
The app defines `drawsSinceLastSeen(draws, n)` as the index of the most recent draw containing the number. If no draw contains it, it falls back to `draws.length`.

### 3.3 Pair affinity calculation
`pairScore(draws, n, withNumbers)` counts how often `n` appears in a draw together with any number already selected in the recommendation set.

### 3.4 Tier generation
`buildRecommendations()` combines score components for frequency, recency, and pair affinity for each tier and generates a set of six numbers. It varies the exact ticket order with a deterministic seeded randomizer based on the current date.

## 4. State model

Key React state is managed in the root app and component-local hooks:

- `activeNumber` in [src/App.tsx](../../src/App.tsx)
- `rangeDays`, `newestFirst`, `search`, `matchMode` in [src/components/ResultsTable.tsx](../../src/components/ResultsTable.tsx)
- `dataset` and `sortMode` in [src/components/FrequencyChart.tsx](../../src/components/FrequencyChart.tsx)
- `refreshedAt` and `isRefreshing` in [src/hooks/useLotteryData.ts](../../src/hooks/useLotteryData.ts)

## 5. Visible states and transitions

### Loading state
- While meta/draws/stats/recommendations are still fetching, the app shows a text loader before rendering stats.

### Error state
- API error triggers `ErrorBanner` and can retry the refresh call.

### Stale state
- `isStale` triggers `StaleBanner` when `lastDrawDate` is older than `STALE_DATA_DAYS`.

### Empty state
- Results table shows a no-results message when the selected filters produce no rows.

## 6. Functional limitations

- There is no route-level navigation beyond the single screen.
- There is no data-write capability from the browser.
- There is no server-side authorisation layer.
- Suggestions are heuristic and not claim-based.

---

This specification documents the functions implemented in the current app and intentionally excludes any unimplemented or hypothetical features.
