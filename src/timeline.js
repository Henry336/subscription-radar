const MS_PER_DAY = 86400000;

export function buildRenewalTimeline(subscriptions, today = new Date()) {
  const start = startOfUtcDay(today);
  return subscriptions
    .filter((item) => item.nextRenewal)
    .map((item) => {
      const renewalDate = new Date(`${item.nextRenewal}T00:00:00Z`);
      const daysUntil = Math.round((renewalDate - start) / MS_PER_DAY);
      return {
        id: item.id,
        merchant: item.merchant,
        nextRenewal: item.nextRenewal,
        daysUntil,
        urgency: getUrgency(daysUntil),
        cadence: item.cadence,
        averageAmount: item.averageAmount,
        annualCost: item.annualCost,
        suggestedAction: item.suggestedAction,
        selectedAction: item.selectedAction || item.suggestedAction,
        confidence: item.confidence
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || b.annualCost - a.annualCost);
}

function getUrgency(daysUntil) {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "next 7 days";
  if (daysUntil <= 30) return "next 30 days";
  if (daysUntil <= 90) return "next 90 days";
  return "later";
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
