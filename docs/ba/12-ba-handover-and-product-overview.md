# BA Handover and Product Overview

## 1. Executive summary

The implemented application is a static informational dashboard for Vietlott Power 6/55 results. It combines a daily data-refresh pipeline with a React front end that surfaces the most recent draws, frequency statistics, number rankings, and deterministic ticket suggestions. The product is intentionally read-only and is designed to present recent historical patterns without claiming to predict or influence lottery outcomes.

## 2. Product purpose

The application exists to help a user quickly answer three questions:

1. What were the most recent Power 6/55 draws?
2. Which numbers are appearing most often and most recently?
3. Which number combinations are currently suggested based on historical stats?

The code and UI present this as pattern analysis rather than a guaranteed winning strategy.

## 3. Users

### Primary users
- General visitors interested in recent results and stats
- People reviewing the most recent draws
- Users exploring hot and cold number patterns

### Secondary users
- Maintainers who run the data-refresh pipeline
- QA and development teams validating source-data integrity

## 4. Core features currently implemented

- Recent draw history table
- Rolling 30-day analytics window
- Top 6 hot numbers summary
- Main-number and bonus-ball frequency chart
- Suggested ticket cards by prize tier
- Manual data refresh via updated static files
- Vietnamese and English UI support
- Source outage tolerance and stale-data warning

## 5. Key workflows

### Daily refresh workflow
- Source data is fetched from vietlott.vn.
- The scraper validates rows and saves valid ones.
- Stats and recommendation payloads are generated.
- The frontend loads the updated JSON files for user consumption.

### User exploration workflow
- User loads the dashboard.
- User reviews recent draws and top numbers.
- User filters the table or drills into selected numbers.
- User reads disclaimer and tiers to interpret suggestions appropriately.

## 6. System dependencies

- Static React frontend built with Vite
- Browser-side fetches from the local static JSON store
- Scheduled or manual GitHub Actions-based pipeline job
- Source HTML parsing from vietlott.vn
- Validation logic for draw integrity and date rules

## 7. Current implementation status

### Implemented
- dashboard rendering
- data refresh logic
- frequency analytics
- result filtering
- tier suggestion generation
- bilingual UI
- stale-data and error banners

### Partially implemented
- source outage resilience
- operational freshness awareness (badge remains static)

### Not implemented
- user accounts
- purchases or betting
- authorisation model
- predictive or certainty-based claims

### Requires confirmation
- product positioning (entertainment vs decision-support)
- production hosting model
- acceptance of static scrapers as the canonical data source

## 8. Risks and limitations

- The system depends on third-party HTML selectors and can break when the source markup changes.
- It is static and cannot provide real-time data without refresh cycles.
- It is not intended as a guarantee of win probability or as a financial advisory tool.

## 9. Product recommendation

The current application is best described as a read-only lottery intelligence dashboard for historical analysis and pattern exploration. Unless stakeholder expectations change, it should remain positioned as an informational and entertainment-oriented feature rather than a predictive decision system.

---

This handover reflects the implemented state of the app. It intentionally avoids claiming future feature sets that are not present in the repository and code evidence.
