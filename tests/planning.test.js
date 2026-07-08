import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSubscriptions, parseTransactions, sampleCsv } from "../src/detector.js";
import { createCleanupPlan } from "../src/planning.js";

test("cleanup plan excludes dismissed false positives from active totals", () => {
  const analysis = analyzeSubscriptions(parseTransactions(sampleCsv));
  const dismissed = analysis.subscriptions.find((item) => item.merchant === "Netflix");
  const activeAnalysis = {
    ...analysis,
    subscriptions: analysis.subscriptions.filter((item) => item.id !== dismissed.id)
  };

  const plan = createCleanupPlan(activeAnalysis, [dismissed]);

  assert.equal(plan.subscriptions.some((item) => item.id === dismissed.id), false);
  assert.equal(plan.dismissedFalsePositives.length, 1);
  assert.equal(plan.dismissedFalsePositives[0].merchant, "Netflix");
  assert.equal(
    plan.totalAnnualEstimate,
    Number((analysis.totalAnnualEstimate - dismissed.annualCost).toFixed(2))
  );
  assert.equal(plan.renewalTimeline.some((item) => item.id === dismissed.id), false);
  assert.ok(plan.renewalTimeline.length > 0);
});

test("cleanup plan keeps detector recommendation separate from selected action", () => {
  const analysis = analyzeSubscriptions(parseTransactions(sampleCsv));
  const target = analysis.subscriptions.find((item) => item.merchant === "Adobe");
  const editedAnalysis = {
    ...analysis,
    subscriptions: analysis.subscriptions.map((item) => item.id === target.id
      ? { ...item, selectedAction: "Cancel" }
      : item)
  };

  const plan = createCleanupPlan(editedAnalysis);
  const edited = plan.subscriptions.find((item) => item.id === target.id);
  const renewal = plan.renewalTimeline.find((item) => item.id === target.id);

  assert.equal(edited.suggestedAction, target.suggestedAction);
  assert.equal(edited.selectedAction, "Cancel");
  assert.equal(renewal.suggestedAction, target.suggestedAction);
  assert.equal(renewal.selectedAction, "Cancel");
});
