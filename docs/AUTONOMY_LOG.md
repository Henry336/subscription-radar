# Autonomy Log

## 2026-07-08

### Repo state

- Started from a clean working tree with one bootstrap commit.
- Read automation memory, README, roadmap, changelog, and prior autonomy log before choosing work.
- `gh` is still not installed in this workspace, so GitHub issue inspection was not available locally.

### Shipped

- Added reversible false-positive controls to recurring candidate cards.
- Recalculated active subscription count, duplicate risk count, and annualized spend after dismissing a candidate.
- Added a dismissed false-positive review section and included dismissed candidates separately in the exported cleanup plan.
- Moved cleanup-plan serialization into `src/planning.js` and added test coverage for dismissed false positives.
- Replaced decorative middle-dot source characters with HTML entities in edited UI strings to avoid encoding drift.

### Verification

- `npm test`
- `npm run build`
- `git diff --check`

### Product notes

- First-time users can now correct an obvious false positive without losing the audit trail.
- Dismissed findings are reversible during the current session but are not yet persisted.

### Next run

- Add a renewal calendar sorted by next estimated charge date.
- Add local persistence for user decisions with explicit browser-storage privacy copy.

## 2026-07-07

### Repo state

- Cloned `github.com/Henry336/subscription-radar`; Git reported the remote repository was empty.
- No README, app, tests, issues-in-repo, roadmap, changelog, or prior autonomy log existed.
- `gh` was not installed locally, so open GitHub issue inspection could not run from this workspace.

### Shipped

- Created a dependency-free static MVP in `index.html`, `src/app.js`, and `src/styles.css`.
- Added CSV paste/import, sample data, browser-only privacy copy, recurring candidate cards, duplicate-risk section, editable action controls, explainable confidence details, and cleanup-plan export.
- Added `src/detector.js` with CSV parsing, merchant normalization, cadence inference, annualized estimates, duplicate monthly risk detection, and user-facing explanations.
- Added Node tests for parsing, merchant normalization, sample recurring detection, and one-off false positives.
- Added README, roadmap, changelog, package scripts, and build integrity check.

### Verification

- `npm test`
- `npm run build`

### Product notes

- The first useful demo path now works without installation beyond a browser and Node for tests.
- Merchant normalization is intentionally conservative but already handles noisy labels such as phone numbers, plan descriptors, and billing suffixes.
- User-edited action and merchant labels are reflected in the exported JSON cleanup plan.

### Next run

- Add explicit false-positive controls so users can remove a candidate and see totals update.
- Add a small renewal calendar sorted by next estimated renewal date.
