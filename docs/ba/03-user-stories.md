# User Stories and Acceptance Criteria

## Epic 1: Review latest lottery results

### US-01: View recent draw history
As a lottery enthusiast, I want to view the latest Power 6/55 draw results, so that I can inspect what numbers were recently drawn.

- Requirement link: BRD-01, SRS-FUNC-01, SRS-FUNC-07
- Status: Implemented
- Acceptance criteria:
  - Given the app loads successfully, when the data is fetched, then a results table displays draw ID, date, six main numbers, bonus number, jackpot 1, and jackpot 2.
  - Given a draw has a missing jackpot value, when the table renders, then the cell shows a dash placeholder instead of a broken value.

### US-02: Filter recent results by day range
As a user, I want to filter the history by 7, 14, or 30 days, so that I can focus on a relevant recent window.

- Requirement link: BRD-04, SRS-FUNC-08
- Status: Implemented
- Acceptance criteria:
  - Given the results table is visible, when a user clicks 7/14/30-day chips, then only draws within the selected window remain visible.
  - Given the selected range is changed, when rows are recomputed, then the “showing X of Y” subtitle updates accordingly.

## Epic 2: Explore number patterns

### US-03: Inspect hot numbers
As a visitor, I want to see the Top 6 hot numbers and their counts, so that I can understand the strongest recent frequency patterns.

- Requirement link: BRD-02, SRS-FUNC-03, SRS-FUNC-05
- Status: Implemented
- Acceptance criteria:
  - Given the data is loaded, when the Top 6 panel renders, then the six highest-frequency numbers are displayed in rank order.
  - Given a number is clicked in the Top 6 panel, when the user selects it, then the results table narrows to rows containing that number.

### US-04: Compare main and bonus frequency
As a user, I want to switch between main-number and bonus ball charts, so that I can compare the two frequency datasets.

- Requirement link: SRS-FUNC-03, SRS-FUNC-04
- Status: Implemented
- Acceptance criteria:
  - Given the frequency chart is visible, when the user toggles the dataset, then the chart shows either main numbers or bonus-frequency values.
  - Given a sort mode is toggled, when the chart re-renders, then categories are ordered by natural number or frequency count as selected.

## Epic 3: Understand suggested tickets

### US-05: View prize-tier suggestions
As a user, I want to see five suggested combinations by prize tier, so that I can understand the app’s recommended patterns.

- Requirement link: BRD-03, SRS-FUNC-06
- Status: Implemented
- Acceptance criteria:
  - Given data is loaded, when the screen renders, then five suggestion cards appear in the configured tier order.
  - Given a suggestion card is displayed, when a user reads it, then it shows the six numbers and any additional bonus pick for that tier.

### US-06: Review tier rationale
As a user, I want to see the tier prize, condition, and strategy summary, so that I can interpret how the suggestions were built.

- Requirement link: SRS-FUNC-06
- Status: Implemented
- Acceptance criteria:
  - Given a tier card is visible, when the user views it, then the title, odds, prize label, and strategy text are displayed.
  - Given the tier has a bonus pick, when the card renders, then the associated bonus number is shown alongside the main numbers.

## Epic 4: Control and refresh the data feed

### US-07: Refresh published data
As a user, I want to refresh the published data files, so that I can view the latest available statistics without waiting for the next scheduled pipeline run.

- Requirement link: BRD-09, SRS-FUNC-10
- Status: Implemented
- Acceptance criteria:
  - Given the user clicks the Refresh button, when the fetch completes successfully, then the app re-fetches all four data files using a cache-busting query string.
  - Given the request is successful, when the response returns, then the footer shows the refreshed timestamp.

### US-08: Handle stale data
As a user, I want to be alerted when the data is stale, so that I can assess whether current results may be outdated.

- Requirement link: BRD-06, SRS-FUNC-11
- Status: Implemented
- Acceptance criteria:
  - Given the last draw date is older than the stale threshold, when the app loads, then a stale-data banner is shown.
  - Given the app data is current, when it is checked, then no stale banner appears.

## Epic 5: Use the app in language of choice

### US-09: Switch language
As a user, I want to switch the interface between Vietnamese and English, so that I can read the content in my preferred language.

- Requirement link: BRD-07, SRS-FUNC-13
- Status: Implemented
- Acceptance criteria:
  - Given the app loads, when the user chooses a language from the switcher, then labels and tooltips update in that language.
  - Given the language is changed, when the page is re-rendered, then the document language tag and title update.

## Epic 6: Understand risk and limitations

### US-10: Read lottery disclaimer
As a user, I want to see a disclaimer, so that I understand the suggestions are based only on past data and do not guarantee outcomes.

- Requirement link: BRD-08, SRS-FUNC-14
- Status: Implemented
- Acceptance criteria:
  - Given the app is open, when the page renders, then a disclaimer message is visible near the bottom of the content.
  - Given the disclaimer is displayed, when a user reads it, then it states that results are random and suggestions are for entertainment only.

## Epic 7: Support data pipeline resilience

### US-11: Guard against source outages
As a maintainer, I want the pipeline to fail safely when the lottery website becomes unavailable, so that previous data remains intact.

- Requirement link: BRD-10, SRS-FUNC-16
- Status: Partially implemented
- Acceptance criteria:
  - Given the source reported an outage, when the pipeline catches the exception, then it sets a partial status and preserves the previous data snapshot.
  - Given a run remains overdue beyond a threshold, when the pipeline checks the stale status, then it sets a non-zero exit code to surface the issue.

---

These stories are mapped to the actual implementation and should not be treated as a broader product backlog unless product requirements are explicitly expanded in the future.
