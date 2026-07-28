# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is an individual who suspects recurring charges are quietly
leaking money but does not want to connect a bank account or hand transaction
history to another finance company. They arrive with a pasted transaction list
or bank-exported CSV and want a quick, trustworthy cleanup decision.

## Product Purpose

Subscription Radar turns a local transaction export into an explainable list of
likely subscriptions, duplicate patterns, upcoming renewals, and user-selected
next actions. Success means a first-time user can safely import data, understand
why an item was flagged, decide what to keep or change, and leave with a useful
cleanup plan in minutes.

## Positioning

Subscription Radar is the private decision layer between a bank statement and a
cancellation: it finds recurring patterns locally, shows its reasoning, and lets
the user correct the result before any action is taken. The product does not ask
for bank credentials, remotely store transaction data, or pretend that a
detector recommendation is the user's decision.

## Operating Context

The current workflow is import or paste, review how columns were interpreted,
inspect recurring candidates and duplicate risks, correct false positives or
merchant names, choose actions, review renewal timing, and export a cleanup
plan. Bank CSVs may use inconsistent headers, signed amounts, or separate debit
and credit columns.

## Capabilities and Constraints

- Current functionality is a dependency-free static browser application.
- Transaction parsing and detection run in the browser; there is no server,
  account system, bank connection, analytics SDK, or remote storage.
- The parser supports quoted CSV cells, common bank headers, manual column
  mapping, import diagnostics, and rejected-row explanations.
- The detector estimates cadence, annualized cost, confidence, next renewal,
  duplicate patterns, and a recommended action.
- Users can separately select an action, rename a merchant, dismiss and restore
  false positives, and export a JSON cleanup plan.
- Renewal dates and annualized costs are estimates based only on imported
  history and must be described as estimates.
- Importing arbitrary regional date and number formats, persistent local plans,
  guided cancellation, and a paid product tier remain open product decisions.
- Financial advice, autonomous cancellation, fabricated savings claims, and
  bank-login integrations are out of scope for the current release.

## Brand Commitments

The product name is Subscription Radar. The experience should feel unusually
human, creative, and memorable without obscuring a serious financial task. The
reference standard is the density of thoughtful concepts and personality in
Bodybot, interpreted for a privacy-first finance tool rather than imitated.

## Evidence on Hand

- The repository contains a working sample dataset and deterministic tests for
  parsing, diagnostics, recurring detection, cleanup-plan behavior, and renewal
  timeline ordering.
- The product has no customers, testimonials, measured savings benchmark, or
  validated pricing evidence yet. Future surfaces must not fabricate them.

## Product Principles

1. Private by architecture, not by a marketing toggle.
2. Show the reasoning before asking for trust.
3. Turn detection into a decision and a useful next step.
4. Let users correct the machine without losing the audit trail.
5. Earn delight through clarity, craft, and a memorable demonstration.

## Accessibility & Inclusion

The web experience must be usable with keyboard navigation, visible focus,
reduced motion, semantic controls, readable contrast, and responsive layouts.
Data and date language should avoid assuming a single bank, country, or ability
to interpret a visual chart without text.
