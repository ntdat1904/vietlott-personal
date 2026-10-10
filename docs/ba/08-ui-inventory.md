# UI Inventory and Screen Specification

## 1. Route and screen inventory

The application is a single-page React interface with no routing library. The root entry is in [src/main.tsx](../../src/main.tsx), and the screen is assembled in [src/App.tsx](../../src/App.tsx).

| Route | Screen | Status |
| --- | --- | --- |
| `/` | Main lottery dashboard | Implemented |
| `/` with `?lang=en` | Same dashboard in English | Implemented |
| Other paths | None configured | Not implemented |

## 2. Screen specification: main dashboard

### Purpose
The dashboard provides a compact overview of recent Vietlott Power 6/55 draws, derived pattern metrics, and number suggestions.

### Layout hierarchy
- Header: brand + refresh + language switcher
- Error/stale banner row
- KPI cards row
- Tier suggestions panel
- Top 6 + frequency chart section
- Results table section
- Disclaimer block
- Footer information

## 3. Screen elements

### 3.1 Header
Visible elements:
- app logo (`55` badge)
- title text: “Power 6/55 insights” or localized equivalent
- database/live-data badge
- refresh button
- language switcher

Interactions:
- refresh triggers full re-fetch
- language switcher stores locale in localStorage and toggles translation resources

States:
- enabled
- refreshing (button disabled, spinner visible)

### 3.2 Banner area
- Error banner if fetch fails and no cache fallback exists
- Stale-data banner when the last draw exceeds the threshold

### 3.3 KPI cards
Cards shown:
- analyzed draws
- latest draw
- jackpot 1
- jackpot 2

Purpose:
- deliver quick summary metrics without scrolling through the table

### 3.4 Tier suggestion panel
Visible elements:
- icon + title with info tooltip
- date context
- small-sample warning if low draw count
- five cards with ticket numbers and tier details

Interactions:
- tooltips appear on hover/focus for classification and rule explanation
- cards are static and render from a computed suggestion set

### 3.5 Top 6 panel
Visible elements:
- title and informational tooltip
- six hot-number balls
- a bar ranking for frequency and percent appearance

Interactions:
- click any rank to set the active number filter

### 3.6 Frequency chart
Visible elements:
- chart title and info tooltip
- dataset toggle buttons (`main` and `bonus`)
- sort toggle buttons (`natural` and `frequency`)
- bar chart with expected average line
- legend

Interactions:
- switch main vs bonus dataset
- sort by value or natural number order
- click a bar to set the active number filter

### 3.7 Results table
Visible elements:
- day range chips (7/14/30)
- newest/oldest sort toggle
- active number chip if filtered
- search box + any/all match selector
- desktop table and mobile list fallback

Interactions:
- search by numeric tokens
- apply any/all numeric match logic
- clear active number filter

States:
- row set filtered
- empty state shown when no rows match

### 3.8 Disclaimer and footer
Visible elements:
- precise lottery disclaimer text
- source attribution text
- generated-at and refreshed-at timestamps

## 4. Responsive behavior

The app uses Tailwind grid/flex layouts and responsive breakpoints:
- `sm` and `lg` breakpoints for card layout adjustments
- table hides on small screens and shows a mobile card list instead
- chart container keeps a minimum width to prevent layout compression

## 5. Accessibility considerations

Evidence from code:
- `aria-pressed` on toggles and language buttons
- `aria-label` on language switcher
- `sr-only` label on search input
- `aria-busy` on refresh button
- keyboard-focus styles via `focus-visible:ring` classes
- icon-only controls wrapped with tooltip components for context

## 6. Limitations in UI behavior

- The live-data badge is static and not fully bound to real fetch state.
- No route transitions or multi-screen navigation are implemented.
- There is no explicit error boundary or page-level not-found route.

---

This inventory reflects the actual front-end and its implemented states as visible in the code and UI components.
