# Security and Privacy Review

Reviewed: 2026-07-29  
Scope: the static browser application, CSV ingestion path, generated export, and Vercel hosting policy.

## Executive summary

No critical, high, or medium-severity security findings remain in the reviewed MVP.

The application has a deliberately small attack surface: it has no server-side application code, authentication, bank connection, analytics, third-party runtime dependency, remote API, or browser persistence. Imported statement data is parsed in page memory, rendered through text-safe DOM APIs, and removed by reloading or using **Clear this tab**.

The remaining risks are product and hosting boundaries rather than exploitable application defects:

- A hosting provider can observe ordinary request metadata such as IP address and user agent, but the imported CSV content is never sent to that provider.
- Subscription detection is probabilistic and must not be presented as financial advice or a guaranteed billing record.
- Future features that add persistence, accounts, email access, or bank connections require a new threat model before implementation.

## Findings

### SR-01 — No unresolved P0/P1/P2 findings

**Severity:** Informational  
**Status:** Verified

Checks found no use of `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, dynamic script loading, Web Storage, or cross-window messaging. Merchant names, parser diagnostics, and other imported values are inserted with `textContent` or text nodes in `src/app.js` (for example lines 107, 281, 489, 556, and 754).

### SR-02 — Resource exhaustion is bounded

**Severity:** Informational  
**Status:** Mitigated

The scanner rejects inputs above the character, row, and column limits defined in `src/detector.js:7` and enforced at `src/detector.js:83-98`. File name/type and size checks also run before parsing in `src/app.js:113-121`.

### SR-03 — Export is explicit and local

**Severity:** Informational  
**Status:** Verified

The cleanup plan is serialized into a browser-created JSON blob and downloaded only after a user action (`src/app.js:698-709`). The temporary object URL is revoked immediately. The export contains the user's decisions and detected summaries, so the interface correctly treats it as a file the user controls after download.

### SR-04 — Browser and hosting policy is restrictive

**Severity:** Informational  
**Status:** Mitigated

`index.html:7` provides an in-document Content Security Policy for local/static use. `vercel.json:10-31` upgrades this at the host layer with `frame-ancestors 'none'`, a deny-by-default permissions policy, no referrer, MIME sniffing protection, opener isolation, and clickjacking protection.

### SR-05 — Privacy claims match the current architecture

**Severity:** Informational  
**Status:** Verified

The app has no `fetch`, `XMLHttpRequest`, `WebSocket`, analytics script, remote font, or third-party image. Its policy also sets `connect-src 'none'`. Transaction rows remain in JavaScript memory and the clear action resets that state (`src/app.js:713-730`).

## Privacy-by-design boundaries

- **Data minimization:** Only date, merchant text, and amount are required.
- **Purpose limitation:** Data is used only for recurring-charge analysis and the user-requested export.
- **Ephemeral default:** There is no automatic local or cloud persistence.
- **User control:** False positives can be dismissed and restored; the session can be cleared; export is opt-in.
- **Explainability:** Confidence, cadence, amount spread, renewal estimate, and the detector's suggestion remain visible separately from the user's chosen action.
- **No monetization through data:** The product strategy excludes advertising, data brokerage, and paid placement in recommendations.

## Required review triggers

Perform a new security and privacy review before adding any of the following:

- bank or open-banking connections;
- email or receipt ingestion;
- accounts, sync, or cloud persistence;
- automatic cancellation;
- payment collection;
- telemetry, analytics, advertising, or affiliate recommendations;
- third-party scripts or remote AI inference.

## Verification performed

- 15 detector and planning tests passed.
- Static build integrity check passed.
- Browser QA recorded zero console errors and warnings.
- The Impeccable static detector returned no findings.
- A source scan found no unsafe HTML or dynamic-code sinks.
