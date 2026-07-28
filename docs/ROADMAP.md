# Roadmap

## Current direction

Build a local-first 5-minute demo for subscription cleanup from pasted transactions and uploaded CSV files. The core loop should stay transparent: import data, see recurring candidates, understand why each was flagged, edit decisions, and export a cleanup plan.

## Near-term priorities

- Improve merchant normalization with user-approved aliases.
- Detect trial-to-paid transitions more explicitly.
- Add messy CSV examples for banks that split debit and credit columns.
- Offer opt-in local persistence for approved merchant aliases and cleanup decisions, with explicit browser-storage privacy copy and a one-click erase path.
- Add merge controls for duplicate or alias-related candidates.
- Publish bank-specific CSV export guides, beginning with common Singapore, US, UK, and Australian formats.
- Validate whether users complete a real cleanup action and recover more value than the proposed Pro price.

## Deferred ideas

- Bank-login integrations.
- Paid enrichment APIs.
- Budgeting advice or financial recommendations.
- Multi-user accounts, sync, or cloud storage.
- Decorative dashboard views before the detection loop is trustworthy.

## Rejected for MVP

- Plaid-style account linking: not needed for a safe first demo and conflicts with the local-first privacy promise.
- Investment or debt advice: the product is for spending awareness and cleanup planning only.

## Completed

- The Signal Desk interface with an interactive annual-leak radar, action queue, privacy receipt, renewal timetable, and duplicate-risk review.
- Explicit date-format rescue, display-currency selection, and safe input-size limits.
- Production-ready static hosting policy with restrictive browser security headers.
- Renewal timeline sorted by estimated next charge date and annualized cost, with overdue and next 7/30/90 day urgency labels.
- Separate detector suggestions from user-selected cleanup actions in the UI and exported cleanup plan.
- Manual column mapping rescue for messy CSVs with nonstandard headers, swapped columns, or split debit/credit columns.
- Import review with recognized columns, normalized preview rows, and rejected-row reasons.
- Inline false-positive controls that remove a candidate from active totals while keeping an export audit trail.
