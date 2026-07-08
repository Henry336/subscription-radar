# Autonomy Log

## 2026-07-08 manual column mapping run

### Repo state

- Started from a clean working tree at `041453e Add import review diagnostics`.
- Read automation memory path first; no prior automation memory file was present.
- Read README, roadmap, changelog, prior autonomy log, source, tests, recent commits, and package scripts before choosing work.
- Read overnight scout files from `C:\Users\Henry\OneDrive\Desktop\overnight-agents\projects\subscription_leak_opportunities.md` and `C:\Users\Henry\OneDrive\Desktop\overnight-agents\projects\top_implementation_tasks.md`.
- `rg.exe` failed with `Access is denied`, so file inspection used targeted PowerShell reads instead.

### Recommendation decision

- Used the scout recommendation to add manual column mapping rescue because import diagnostics had already exposed parser mistakes without giving users a way to fix them.
- Rejected renewal timeline for this run because bad CSV mapping would make any calendar output less trustworthy.
- Rejected separating detector suggestion from user decision for this run because manual mapping was a clearer blocker to the 5-minute demo path.

### Shipped

- Added optional explicit column indexes to `parseTransactionInput`.
- Added import-review controls for date, merchant, amount/debit, and optional credit columns.
- Re-ran local parsing and detection immediately when users change column mappings.
- Added manual-header detection for nonstandard CSV headers and corrected split debit/credit imports so positive debit values become spending while positive credits stay credits.

### Verification

- `npm test`
- `npm run build`

### Product notes

- Users can now rescue swapped or oddly named CSV exports without editing the raw CSV text.
- Manual mapping still does not persist across page reloads, which is acceptable for the static MVP but should be revisited with local decision persistence.

### Next run

- Add renewal calendar view sorted by estimated next charge date, or add local persistence for user decisions and mappings with explicit browser-storage privacy copy.

## 2026-07-08 import review run

### Repo state

- Started from a clean working tree at `35b98db Add false-positive dismissal workflow`.
- Read automation memory, README, roadmap, changelog, prior autonomy log, source, tests, and recent commits.
- Read overnight scout files from `C:\Users\Henry\OneDrive\Desktop\overnight-agents\projects\subscription_leak_opportunities.md` and `C:\Users\Henry\OneDrive\Desktop\overnight-agents\projects\top_implementation_tasks.md`.
- `gh` is still not installed in this workspace, so local GitHub issue inspection was not available.

### Recommendation decision

- Used the scout recommendation to improve import review because messy CSV trust is upstream of every detection result.
- Scoped down the full manual column-mapping rescue for this run because the current parser needed stable diagnostics and UI preview first.
- Rejected renewal timeline for this run, even though it remains valuable, because import transparency is the bigger first-time-user risk.

### Shipped

- Added parser diagnostics for recognized columns, normalized preview rows, and rejected rows.
- Added an import review panel below the CSV input so users can see what the local parser understood before trusting findings.
- Added tests for debit/credit header diagnostics and explicit rejected-row reasons.

### Verification

- `npm test`
- `npm run build`

### Product notes

- The app no longer silently drops unreadable import rows from the user experience.
- The next import step should add manual column selectors for files whose headers or column order cannot be inferred.

### Next run

- Add manual column mapping for difficult CSVs, or add the renewal calendar if import diagnostics look good enough after manual testing.

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
