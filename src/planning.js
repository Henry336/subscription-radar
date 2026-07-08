import { buildRenewalTimeline } from "./timeline.js";

export function createCleanupPlan(analysis, suppressedSubscriptions = []) {
  return {
    generatedAt: new Date().toISOString(),
    privacy: "Created locally in the browser from pasted or uploaded transactions.",
    totalAnnualEstimate: roundMoney(analysis.subscriptions.reduce((sum, item) => sum + item.annualCost, 0)),
    renewalTimeline: buildRenewalTimeline(analysis.subscriptions),
    subscriptions: analysis.subscriptions.map((item) => ({
      id: item.id,
      merchant: item.merchant,
      cadence: item.cadence,
      averageAmount: item.averageAmount,
      annualCost: item.annualCost,
      nextRenewal: item.nextRenewal,
      confidence: item.confidence,
      suggestedAction: item.suggestedAction,
      whyFlagged: item.explanations
    })),
    dismissedFalsePositives: suppressedSubscriptions.map((item) => ({
      id: item.id,
      merchant: item.merchant,
      annualCost: item.annualCost,
      confidence: item.confidence,
      reason: "User marked this candidate as a false positive."
    })),
    duplicateRisks: analysis.duplicateRisks
  };
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
