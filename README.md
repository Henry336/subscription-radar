# Subscription Leak Radar

Subscription Leak Radar is a local-first personal finance cleanup tool. It helps one person paste transactions or import a CSV, then spot likely recurring subscriptions, renewal risks, duplicate charge patterns, forgotten trials, and cancellation or downgrade candidates.

The MVP does not use bank login, Plaid, paid APIs, or remote storage. Data stays in the browser session unless you export a cleanup plan.

## 5-minute demo

1. Open `index.html` in a browser.
2. Click **Load sample** to see the expected transaction format and first results.
3. Paste your own CSV rows with `Date`, `Description`, and `Amount` columns, or use **Import CSV**.
4. Review **Recurring candidates** and expand **Why flagged?** for the exact signals behind each match.
5. Adjust the action selector, rename merchants, or mark obvious false positives.
6. Export a JSON cleanup plan with active candidates and dismissed false positives separated.

Negative amounts are treated as spending. Positive amounts are treated as refunds, deposits, or credits and are ignored by the recurring-charge detector.

## What the detector explains

- Cleaned merchant name used for clustering.
- Number of matching charges.
- Estimated cadence, such as monthly or annual.
- Observed gaps between charges.
- Amount spread across the cluster.
- Confidence score and suggested next action.
- Dismissed false positives are removed from active totals but kept in the exported plan for auditability.

## CSV expectations

The parser accepts quoted CSV cells and common column names:

- Date: `Date`, `Posted Date`, `Transaction Date`, `Trans Date`
- Merchant: `Description`, `Merchant`, `Name`, `Payee`, `Memo`
- Amount: `Amount`, `Debit`, `Charge`, `Withdrawal`, `Paid Out`
- Optional credit column: `Credit`, `Deposit`, `Paid In`

## Development

This repo is intentionally dependency-free for the first static MVP.

```bash
npm test
npm run build
```

`npm run build` is a lightweight static integrity check, not a bundling step.
