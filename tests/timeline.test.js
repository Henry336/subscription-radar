import test from "node:test";
import assert from "node:assert/strict";
import { buildRenewalTimeline } from "../src/timeline.js";

test("builds renewal timeline sorted by urgency then annual cost", () => {
  const timeline = buildRenewalTimeline([
    candidate("basic", "Basic", "2026-07-18", 60),
    candidate("pro", "Pro", "2026-07-10", 240),
    candidate("plus", "Plus", "2026-07-10", 120),
    candidate("old", "Old", "2026-07-01", 99)
  ], new Date("2026-07-08T12:00:00Z"));

  assert.deepEqual(
    timeline.map((item) => item.id),
    ["old", "pro", "plus", "basic"]
  );
  assert.equal(timeline[0].urgency, "overdue");
  assert.equal(timeline[1].urgency, "next 7 days");
  assert.equal(timeline[3].urgency, "next 30 days");
  assert.equal(timeline[1].selectedAction, "Cancel");
});

test("skips subscriptions without a next renewal date", () => {
  const timeline = buildRenewalTimeline([
    candidate("known", "Known", "2026-08-01", 120),
    candidate("unknown", "Unknown", "", 90)
  ], new Date("2026-07-08T00:00:00Z"));

  assert.deepEqual(timeline.map((item) => item.id), ["known"]);
});

function candidate(id, merchant, nextRenewal, annualCost) {
  return {
    id,
    merchant,
    nextRenewal,
    annualCost,
    cadence: "monthly",
    averageAmount: 10,
    suggestedAction: "Investigate",
    selectedAction: "Cancel",
    confidence: 80
  };
}
