# Product Strategy

## The useful wedge

Subscription Radar is not another budgeting dashboard. Its wedge is a **one-time, local statement scan that turns uncertain recurring charges into an explainable cleanup queue**:

1. Import a CSV without connecting a bank account.
2. See exactly why each charge was flagged.
3. Correct date/column interpretation and dismiss false positives.
4. Choose cancel, downgrade, review, or keep without overwriting the detector's recommendation.
5. Export a cleanup plan that remains useful after the tab closes.

That is useful today for privacy-conscious people who can export a bank statement and want a focused audit. It is not yet a mass-market replacement for automatic subscription managers: bank-specific import guidance, durable local aliases, trial-to-paid detection, and better recurring-merchant coverage remain necessary.

## Competitive position

The established products cluster around two trade-offs:

- [Rocket Money](https://www.rocketmoney.com/learn/personal-finance/does-rocket-money-work) and [Copilot Money](https://www.copilot.money/privacy-and-security) gain convenience from connected financial accounts and broad money-management suites.
- [TrackMySubs](https://trackmysubs.com/how-it-works/) emphasizes manual subscription tracking and reminders.

Subscription Radar sits between them:

- more useful than a manual tracker because it detects candidates from transaction history;
- less invasive than account-linked tools because the statement is processed in the tab;
- more accountable than a black-box cancellation list because every signal carries an evidence trail and remains editable;
- narrower than a full budgeting app, which makes the five-minute cleanup job easier to understand.

The defensible product is not the radar graphic or a generic recurrence score. It is the correction loop: bank-import rescue, transparent evidence, user-approved merchant memory, decision history, and increasingly reliable local detection without requiring custody of financial data.

## The “ah, that’s why” moment

The hero radar and cleanup queue reveal the annualized cost of recurring signals immediately, then let the user dismiss one false positive and watch the total recalculate. That interaction demonstrates both value and trust: the product finds a likely leak, shows its working, and accepts correction.

The strongest future version of this moment is: “This one forgotten charge costs more than Subscription Radar, and I found it without handing over my bank login.”

## Who will use it

Most likely early users:

- privacy-conscious professionals;
- people doing a quarterly or annual financial reset;
- households auditing several statement exports together;
- users in markets poorly served by US-centric bank aggregators;
- security-conscious users who reject account-linking on principle.

Adoption will remain limited if exporting a CSV feels harder than the perceived savings. The product must therefore keep a convincing demo, publish bank-specific export guides, remember approved mappings locally with explicit consent, and support common regional formats.

## Monetization

Keep the trustworthy first scan free. Charge for saved time and repeatability, never for selling data or ranking financial products.

### Suggested model

- **Free:** unlimited single-statement scans, full explanations, manual decisions, session-only operation, JSON export.
- **Pro — US$19/year or an early US$29 lifetime license:** locally saved merchant aliases and decisions, multi-period comparisons, trial-to-paid alerts, duplicate-family merging, bank import presets, calendar reminders, and richer export formats.
- **Household — US$39/year:** separate local profiles, shared cleanup sessions, and household-level duplicate detection without cloud sync by default.

A low annual price is credible if one recovered subscription covers it. A lifetime option fits a utility that users may run quarterly and reduces the irony of adding another recurring bill.

Avoid affiliate cancellation offers, sponsored rankings, and data resale. They would undermine the product's core reason to exist.

## Would users pay?

Some will, but not yet in large numbers.

They will pay when the app reliably saves more than its price in one sitting, remembers enough local context to make the next audit faster, and handles their bank export without spreadsheet repair. They will not pay for a beautiful recurrence chart alone, for opaque guesses, or for features already bundled into a banking app.

The next proof point is behavioral: measure how many demo users import their own file, how many confirm at least one action, estimated annual value marked for cancel/downgrade, false-positive rate, and whether they return for a second statement. Collect those metrics only through explicit, privacy-preserving research—not hidden telemetry.

