# Data Dictionary and Business Rules

## 1. Data model summary

The app effectively uses three layers of data:

1. Source HTML extracted from vietlott.vn
2. Published JSON payloads in the static data folder
3. In-browser UI state generated from the JSON payloads

## 2. Core entities

### 2.1 Draw
Source: [src/lib/frequency.ts](../../src/lib/frequency.ts)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| drawId | string | Yes | Lottery draw identifier as stored by source site |
| date | string | Yes | ISO date `YYYY-MM-DD` in ICT calendar time |
| numbers | number[] | Yes | Six unique main numbers from 1–55 |
| bonus | number | Yes | Bonus number from 1–55, distinct from main numbers |
| jackpot1Vnd | number | No | Jackpot 1 value in VND |
| jackpot2Vnd | number | No | Jackpot 2 value in VND |
| sourceUrl | string | Yes | Source detail-page URL for the specific draw |
| fetchedAt | string | Yes | ISO timestamp when the draw was fetched |

Business rules:
- `numbers.length` must be 6.
- Values must be integers in the range 1–55.
- `bonus` must not be one of the six main numbers.
- `date` must be a valid draw day: Tuesday, Thursday, or Saturday.
- `date` must not be in the future.

### 2.2 FrequencyEntry
Source: [src/lib/frequency.ts](../../src/lib/frequency.ts)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| n | number | Yes | Number 1–55 |
| count | number | Yes | Number of appearances in the 30-day window |
| lastSeen | string \| null | Yes | Most recent date the number appeared |

Business rule:
- Sorting order is count descending, then most recent appearance descending, then numeric order ascending.

### 2.3 TrendPoint
Source: [src/lib/frequency.ts](../../src/lib/frequency.ts)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| date | string | Yes | ISO date |
| cumulative | Record<number, number> | Yes | Cumulative count of selected numbers up to that date |

### 2.4 TierSuggestion
Source: [src/lib/recommend.ts](../../src/lib/recommend.ts)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| tierId | `third` \| `second` \| `first` \| `jackpot2` \| `jackpot1` | Yes | Prize tier identifier |
| order | 1 \| 2 \| 3 \| 4 \| 5 | Yes | Display order, with jackpot first |
| numbers | number[] | Yes | Six-number suggestion |
| core | number[] | Yes | Key highlighted numbers chosen by weighting logic |
| bonusPick | number | No | Bonus number for jackpot 2 tier |
| rationale | object | Yes | Used internally to describe the recommendation logic |

## 3. Published JSON files

### 3.1 Draws file
Source: [public/data/draws.json](../../public/data/draws.json)

Shape:
- `schemaVersion: 1`
- `draws: Draw[]`

### 3.2 Meta file
Source: [public/data/meta.json](../../public/data/meta.json)

| Field | Type | Description |
| --- | --- | --- |
| schemaVersion | number | Payload version |
| generatedAt | string | ISO datetime of last generation |
| lastDrawDate | string \| null | Latest seen draw date |
| drawCount | number | Number of stored draws |
| lastRun | object | Status, new draws, message |

### 3.3 Stats payload
Source: [public/data/stats.json](../../public/data/stats.json)

| Field | Type | Description |
| --- | --- | --- |
| schemaVersion | number | Payload version |
| windowDays | number | Fixed at 30 |
| drawCount | number | Number of draws in the current window |
| from | string | Earliest date in the data window |
| to | string | Latest date in the data window |
| frequency | FrequencyEntry[] | Main-number appearance counts |
| bonusFrequency | object[] | Bonus-ball counts |
| top6 | number[] | Top six numbers |
| trend | TrendPoint[] | Running cumulative counts |

### 3.4 Recommendations payload
Source: [public/data/recommendations.json](../../public/data/recommendations.json)

| Field | Type | Description |
| --- | --- | --- |
| schemaVersion | number | Payload version |
| date | string | ISO date used as recommendation seed |
| windowDays | number | Fixed at 30 |
| drawCount | number | Number of draws in the dataset |
| tiers | TierSuggestion[] | Generated recommendations |

## 4. Data quality rules and validation

Validation is implemented in [pipeline/validate.ts](../../pipeline/validate.ts):

- six unique numbers only
- each number in range 1–55
- bonus is in range 1–55 and distinct from core
- valid date format
- valid draw day
- date not in future

Rejected rows are logged and omitted from the accepted dataset.

## 5. Business rules and calculations

### 5.1 Frequency window
The app uses a rolling 30-day window via `WINDOW_DAYS = 30` in [src/config/game.ts](../../src/config/game.ts). The pipeline prunes old rows and recalculates stats after each run.

### 5.2 Draw date expectations
The system expects a draw cycle on Tuesday, Thursday, and Saturday. This is encoded in `DRAW_DAYS` and `expectedDrawDates()`.

### 5.3 Recommendation scoring
The recommendation engine combines:
- frequency score
- recency score
- pair affinity score

These are normalized and used to rank candidate numbers before ticket generation. The algorithm is in [src/lib/recommend.ts](../../src/lib/recommend.ts).

### 5.4 Data retention
The code keeps the last 30-day window and discards older data. This is implemented in `pruneOldDraws` and `windowStart()` logic.

## 6. Data sources and refresh frequency

- Source system: vietlott.vn
- Refresh cadence: GitHub Actions workflow defined in [.github/workflows/fetch-data.yml](../../.github/workflows/fetch-data.yml)
- Data publication: static files under [public/data](../../public/data)
- Refresh model: manual user-triggered refresh and scheduled data job

## 7. Data limitations/risks

- The app stores only the most recent 30-day window, not a historical archive beyond current retention.
- The initial cold start may contain only the most recent scraped rows because the source site exposes only a limited result listing.
- There is no inherent data-quality governance beyond validation and rejection logs.

---

This dictionary is based on the implemented code and published sample files and does not infer additional entities or fields that are not present in the code.
