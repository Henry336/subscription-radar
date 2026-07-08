import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSubscriptions, normalizeMerchant, parseTransactionInput, parseTransactions, sampleCsv } from "../src/detector.js";

test("parses CSV with quoted merchants and parenthesized charges", () => {
  const rows = parseTransactions(`Date,Description,Amount
2026-01-01,"ACME, Streaming",(12.99)
2026-01-02,Refund,12.99`);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].merchant, "ACME, Streaming");
  assert.equal(rows[0].amount, -12.99);
});

test("reports import diagnostics with recognized headers and preview rows", () => {
  const result = parseTransactionInput(`Posted Date,Payee,Debit,Credit
2026-01-01,Acme Streaming,(12.99),
2026-01-02,Acme Refund,,12.99`);

  assert.equal(result.transactions.length, 2);
  assert.equal(result.diagnostics.hasHeader, true);
  assert.equal(result.diagnostics.columns.date, "Posted Date (column 1)");
  assert.equal(result.diagnostics.columns.merchant, "Payee (column 2)");
  assert.equal(result.diagnostics.columns.amount, "Debit (column 3)");
  assert.equal(result.diagnostics.columns.credit, "Credit (column 4)");
  assert.deepEqual(result.diagnostics.previewRows[0], {
    date: "2026-01-01",
    merchant: "Acme Streaming",
    amount: -12.99,
    sourceRow: 2
  });
});

test("reports rejected rows instead of silently dropping unreadable imports", () => {
  const result = parseTransactionInput(`Date,Description,Amount
not-a-date,Acme Streaming,-12.99
2026-01-02,,-12.99
2026-01-03,Acme Streaming,not-money
2026-01-04,Acme Streaming,-12.99`);

  assert.equal(result.transactions.length, 1);
  assert.equal(result.diagnostics.rejectedRows.length, 3);
  assert.deepEqual(
    result.diagnostics.rejectedRows.map((row) => row.reason),
    ["missing or unreadable date", "missing merchant", "missing or unreadable amount"]
  );
});

test("allows manual column mapping when a CSV has nonstandard headers", () => {
  const result = parseTransactionInput(`Store,Outflow,When
Acme Streaming,-12.99,2026-01-01
Acme Streaming,-12.99,2026-02-01`, {
    indexes: { merchant: 0, amount: 1, date: 2, credit: -1 }
  });

  assert.equal(result.transactions.length, 2);
  assert.equal(result.diagnostics.hasHeader, true);
  assert.equal(result.diagnostics.hasManualMapping, true);
  assert.equal(result.diagnostics.columns.date, "When (column 3)");
  assert.deepEqual(result.diagnostics.previewRows[0], {
    date: "2026-01-01",
    merchant: "Acme Streaming",
    amount: -12.99,
    sourceRow: 2
  });
});

test("manual mapping handles split debit and credit columns", () => {
  const result = parseTransactionInput(`Memo,Deposit,Withdrawal,Posted
Acme Streaming,,12.99,2026-01-01
Acme Refund,12.99,,2026-01-02`, {
    indexes: { merchant: 0, credit: 1, amount: 2, date: 3 }
  });

  assert.equal(result.transactions.length, 2);
  assert.equal(result.transactions[0].amount, -12.99);
  assert.equal(result.transactions[1].amount, 12.99);
  assert.equal(result.diagnostics.columns.credit, "Deposit (column 2)");
});

test("normalizes noisy merchant descriptors", () => {
  assert.equal(normalizeMerchant("NETFLIX.COM 866-579-7172"), "netflix");
  assert.equal(normalizeMerchant("SPOTIFY *PREMIUM"), "spotify");
});

test("detects monthly and annual recurring candidates from sample data", () => {
  const analysis = analyzeSubscriptions(parseTransactions(sampleCsv));
  const merchants = analysis.subscriptions.map((item) => item.merchant);

  assert.ok(merchants.includes("Netflix"));
  assert.ok(merchants.includes("Todoist"));
  assert.ok(analysis.totalAnnualEstimate > 300);
  assert.equal(analysis.ignoredTransactions, 2);
});

test("does not flag one-off marketplace charges as subscriptions", () => {
  const analysis = analyzeSubscriptions(parseTransactions(`Date,Description,Amount
2026-03-01,Amazon Marketplace,-31.42
2026-03-05,AMZN Mktp US,-28.11
2026-03-20,Coffee Shop,-5.80`));

  assert.equal(analysis.subscriptions.length, 0);
});
