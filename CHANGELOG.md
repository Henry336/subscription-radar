# Changelog

## 0.2.0 - 2026-07-29

### Added

- The Signal Desk interface: an interactive signal radar, evidence-led cleanup ledger, renewal timetable, duplicate-risk review, and session privacy receipt.
- Explicit date-format controls for ambiguous bank exports and clear warnings when slash-formatted dates need confirmation.
- Statement-currency labelling for estimates and exported cleanup plans, with an explicit no-conversion warning.
- Input limits for CSV size, row count, and column count.
- Production hosting policy with a restrictive content security policy and browser security headers.

### Changed

- The demo dataset now stays relevant to the current date so renewal urgency and duplicate-pattern examples remain useful.
- Results prioritize explainable cancellation, downgrade, review, and keep decisions instead of dashboard decoration.
- Merchant and transaction content is rendered with safe DOM text APIs.

### Security

- The static app uses no analytics, bank connection, remote API, browser storage, or third-party runtime assets.
- Imported financial data stays in ephemeral page memory and can be removed with **Clear this tab**.
- Export now requires explicit review of every active signal; detector suggestions never silently become user decisions.

## 0.1.5 - 2026-07-08

### Added

- Exported cleanup plans now keep the detector's suggested action separate from the user's selected action.
- Recurring candidate explanations now show the detector recommendation explicitly before the scoring details.

### Changed

- Action edits no longer overwrite detector recommendations, which keeps future local persistence cleaner.

## 0.1.4 - 2026-07-08

### Added

- Renewal timeline panel sorted by estimated next charge date and annualized cost.
- Exported cleanup plans now include the active renewal timeline.
- Timeline tests cover urgency buckets, sorting, and dismissed-candidate exclusion from exports.

## 0.1.3 - 2026-07-08

### Added

- Manual column mapping controls in import review for CSVs with nonstandard headers or swapped columns.
- Split debit/credit column handling now treats positive debit values as spending and positive credit values as refunds or deposits.

## 0.1.2 - 2026-07-08

### Added

- Import review panel showing recognized CSV columns, normalized preview rows, and rejected-row reasons.
- Parser diagnostics for unreadable dates, missing merchants, and unreadable amounts.

## 0.1.1 - 2026-07-08

### Added

- Reversible false-positive controls for recurring candidates.
- Active subscription totals now recalculate after a candidate is dismissed.
- Exported cleanup plans now separate active subscriptions from dismissed false positives.

## 0.1.0 - 2026-07-07

### Added

- Initial local-first static app for pasted transactions and CSV imports.
- Sample transaction dataset for a 5-minute demo.
- Recurring subscription detection with merchant cleanup, cadence inference, confidence scoring, annualized estimates, and explanation text.
- Duplicate recurring-pattern risk section.
- Exportable JSON cleanup plan.
- Dependency-free Node test suite and static build check.
- Privacy-first README, roadmap, and autonomy log.
