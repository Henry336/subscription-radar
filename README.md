# Subscription Radar

Subscription Radar is a local-first recurring-charge detector. Its **Signal Desk** turns pasted transactions or a bank CSV into an explainable review queue for likely subscriptions, renewal risks, duplicate charge patterns, and cancellation or downgrade candidates.

The MVP does not use a bank login, Plaid, analytics, paid APIs, remote storage, or third-party runtime assets. Statement rows stay in page memory unless you explicitly export a cleanup plan. The hosting provider can see ordinary web-request metadata, but the imported statement content is never sent to it.

**Live demo:** [subscription-radar-live-20260729.vercel.app](https://subscription-radar-live-20260729.vercel.app)

## 5-minute demo

1. Open `index.html` through a local static server.
2. Click **Run the private demo** to load an explicitly illustrative statement.
3. Paste your own CSV rows with `Date`, `Description`, and `Amount` columns, or choose/drop a CSV.
4. Check **Import review** to confirm which columns were recognized, preview normalized rows, and spot rejected rows.
5. If the bank CSV uses odd headers or swapped columns, open **Fix column mapping** and choose the date, merchant, amount/debit, and optional credit columns.
6. Click **Confirm import & review signals**. Findings remain hidden until this consent checkpoint.
7. Review each compact recurring signal and expand **Show the evidence trail** for the exact pattern evidence.
8. Choose **Keep**, **Cancel**, **Downgrade**, **Investigate**, or **Check trial**. Every active signal starts at **Needs review**, and export stays locked until the queue is complete.
9. Use **Use all detector suggestions** only when you explicitly want to accept the detector's full first pass.
10. Check the renewal timetable and possible-overlap rail, then export the reviewed JSON cleanup plan.

Negative amounts are treated as spending. Positive amounts are treated as refunds, deposits, or credits and are ignored by the recurring-charge detector.

The **Statement currency** selector labels the original amounts; it does not perform exchange-rate conversion.

## What the detector explains

- Recognized import columns, rejected rows, and the first normalized transactions before detection.
- Manual column mapping for CSVs whose headers or column order are not recognized safely.
- Cleaned merchant name used for clustering.
- Number of matching charges.
- Estimated cadence, such as monthly or annual.
- Observed gaps between charges.
- Amount spread across the cluster.
- A heuristic pattern score (not a calibrated probability) and suggested next action.
- Your selected action is tracked separately from the detector's suggestion, so exports show both values.
- Renewal timeline urgency, including overdue and next 7/30/90 day candidates.
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

## Product and security context

- [Product truth](./PRODUCT.md)
- [Product strategy and monetization](./docs/PRODUCT_STRATEGY.md)
- [Security and privacy review](./security_best_practices_report.md)
- [Roadmap](./docs/ROADMAP.md)
