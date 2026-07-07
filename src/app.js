import { analyzeSubscriptions, parseTransactions, sampleCsv } from "./detector.js";

const input = document.querySelector("#transaction-input");
const fileInput = document.querySelector("#csv-file");
const loadSample = document.querySelector("#load-sample");
const analyzeButton = document.querySelector("#analyze");
const exportButton = document.querySelector("#export-plan");
const summary = document.querySelector("#summary");
const findings = document.querySelector("#findings");
const duplicates = document.querySelector("#duplicates");
const parseStatus = document.querySelector("#parse-status");

let currentPlan = null;

loadSample.addEventListener("click", () => {
  input.value = sampleCsv;
  analyze();
});

analyzeButton.addEventListener("click", analyze);

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  input.value = await file.text();
  analyze();
});

exportButton.addEventListener("click", () => {
  if (!currentPlan) return;
  const blob = new Blob([JSON.stringify(currentPlan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "subscription-cleanup-plan.json";
  link.click();
  URL.revokeObjectURL(url);
});

findings.addEventListener("change", updatePlanFromControls);
findings.addEventListener("input", updatePlanFromControls);

function analyze() {
  const transactions = parseTransactions(input.value);
  const analysis = analyzeSubscriptions(transactions);
  currentPlan = buildCleanupPlan(analysis);
  renderSummary(transactions, analysis);
  renderFindings(analysis.subscriptions);
  renderDuplicates(analysis.duplicateRisks);
  exportButton.disabled = analysis.subscriptions.length === 0;
}

function renderSummary(transactions, analysis) {
  parseStatus.textContent = `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} parsed. ${analysis.ignoredTransactions} refund or non-charge row${analysis.ignoredTransactions === 1 ? "" : "s"} ignored.`;
  summary.innerHTML = "";
  const cards = [
    ["Likely subscriptions", analysis.subscriptions.length],
    ["Annualized spend", formatMoney(analysis.totalAnnualEstimate)],
    ["Duplicate risks", analysis.duplicateRisks.length],
    ["Private by design", "Browser only"]
  ];
  for (const [label, value] of cards) {
    const card = document.createElement("div");
    card.className = "metric";
    card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    summary.append(card);
  }
}

function renderFindings(subscriptions) {
  findings.innerHTML = "";
  if (subscriptions.length === 0) {
    findings.innerHTML = `<p class="empty">Paste transactions or load the sample data to see recurring charge candidates.</p>`;
    return;
  }

  for (const item of subscriptions) {
    const article = document.createElement("article");
    article.className = "finding";
    article.innerHTML = `
      <div class="finding-head">
        <div>
          <h3>${escapeHtml(item.merchant)}</h3>
          <p>${item.cadence} · ${item.transactionCount} charges · next ${item.nextRenewal || "unknown"}</p>
        </div>
        <div class="amount">${formatMoney(item.averageAmount)}<span>${formatMoney(item.annualCost)}/yr</span></div>
      </div>
      <div class="controls">
        <label>Action
          <select data-plan-id="${item.id}">
            ${["Investigate", "Keep", "Cancel", "Downgrade", "Check trial"].map((option) => `<option ${option === item.suggestedAction ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </label>
        <label>Clean merchant
          <input value="${escapeHtml(item.merchant)}" data-merchant-id="${item.id}">
        </label>
      </div>
      <details>
        <summary>Why flagged? Confidence ${item.confidence}/99</summary>
        <ul>${item.explanations.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      </details>
    `;
    findings.append(article);
  }
}

function renderDuplicates(risks) {
  duplicates.innerHTML = "";
  if (risks.length === 0) {
    duplicates.innerHTML = `<p class="empty">No duplicate monthly patterns found yet.</p>`;
    return;
  }
  for (const risk of risks) {
    const item = document.createElement("article");
    item.className = "risk";
    item.innerHTML = `<strong>${escapeHtml(risk.merchant)}</strong><span>${escapeHtml(risk.reason)} · risk ${risk.riskScore}/99</span>`;
    duplicates.append(item);
  }
}

function buildCleanupPlan(analysis) {
  return {
    generatedAt: new Date().toISOString(),
    privacy: "Created locally in the browser from pasted or uploaded transactions.",
    totalAnnualEstimate: analysis.totalAnnualEstimate,
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
    duplicateRisks: analysis.duplicateRisks
  };
}

function updatePlanFromControls() {
  if (!currentPlan) return;
  for (const subscription of currentPlan.subscriptions) {
    const action = document.querySelector(`[data-plan-id="${subscription.id}"]`);
    const merchant = document.querySelector(`[data-merchant-id="${subscription.id}"]`);
    if (action) subscription.suggestedAction = action.value;
    if (merchant) subscription.merchant = merchant.value.trim() || subscription.merchant;
  }
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

analyze();
