import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSubscriptions, normalizeMerchant, parseTransactions, sampleCsv } from "../src/detector.js";

test("parses CSV with quoted merchants and parenthesized charges", () => {
  const rows = parseTransactions(`Date,Description,Amount
2026-01-01,"ACME, Streaming",(12.99)
2026-01-02,Refund,12.99`);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].merchant, "ACME, Streaming");
  assert.equal(rows[0].amount, -12.99);
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
