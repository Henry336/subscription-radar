import { analyzeSubscriptions, parseTransactionInput, sampleCsv } from "./detector.js";
import { createCleanupPlan } from "./planning.js";

const input = document.querySelector("#transaction-input");
const fileInput = document.querySelector("#csv-file");
const loadSample = document.querySelector("#load-sample");
const analyzeButton = document.querySelector("#analyze");
const exportButton = document.querySelector("#export-plan");
const summary = document.querySelector("#summary");
const findings = document.querySelector("#findings");
const suppressed = document.querySelector("#suppressed");
const duplicates = document.querySelector("#duplicates");
const parseStatus = document.querySelector("#parse-status");
const importReview = document.querySelector("#import-review");

let currentPlan = null;
let currentTransactions = [];
let currentAnalysis = null;
let currentDiagnostics = null;
let suppressedCandidateIds = new Set();
let currentColumnMapping = null;

loadSample.addEventListener("click", () => {
  input.value = sampleCsv;
  currentColumnMapping = null;
  analyze();
});

analyzeButton.addEventListener("click", analyze);

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  input.value = await file.text();
  currentColumnMapping = null;
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
findings.addEventListener("click", (event) => {
  const button = event.target.closest("[data-dismiss-id]");
  if (!button) return;
  suppressedCandidateIds.add(button.dataset.dismissId);
  refreshAnalysisView();
});

suppressed.addEventListener("click", (event) => {
  const button = event.target.closest("[data-restore-id]");
  if (!button) return;
  suppressedCandidateIds.delete(button.dataset.restoreId);
  refreshAnalysisView();
});

importReview.addEventListener("change", (event) => {
  const field = event.target.closest("[data-map-field]");
  if (!field) return;
  currentColumnMapping = readMappingControls();
  analyze();
});

function analyze() {
  const parsed = parseTransactionInput(input.value, currentColumnMapping ? { indexes: currentColumnMapping } : {});
  currentTransactions = parsed.transactions;
  currentDiagnostics = parsed.diagnostics;
  currentAnalysis = analyzeSubscriptions(currentTransactions);
  suppressedCandidateIds = new Set();
  refreshAnalysisView();
}

function refreshAnalysisView() {
  if (!currentAnalysis) return;
  const visible = getVisibleAnalysis(currentAnalysis);
  const dismissed = getSuppressedSubscriptions(currentAnalysis);
  currentPlan = createCleanupPlan(visible, dismissed);
  renderSummary(currentTransactions, visible, dismissed.length);
  renderImportReview(currentDiagnostics);
  renderFindings(visible.subscriptions, dismissed.length);
  renderSuppressed(dismissed);
  renderDuplicates(visible.duplicateRisks);
  exportButton.disabled = currentAnalysis.subscriptions.length === 0;
}

function renderImportReview(diagnostics) {
  importReview.innerHTML = "";
  if (!diagnostics || diagnostics.isEmpty) return;

  const rejectedCount = diagnostics.rejectedRows.length;
  const previewRows = diagnostics.previewRows;
  const status = rejectedCount > 0 ? "needs-review" : "ok";
  const headerMode = diagnostics.hasManualMapping
    ? "Manual column mapping applied"
    : diagnostics.hasHeader ? "Header row recognized" : "No full header match; using first three columns";

  importReview.innerHTML = `
    <div class="review-head">
      <div>
        <h3>Import review</h3>
        <p>${headerMode}. ${rejectedCount} rejected row${rejectedCount === 1 ? "" : "s"}.</p>
      </div>
      <span class="review-badge ${status}">${rejectedCount > 0 ? "Check rows" : "Ready"}</span>
    </div>
    <dl class="column-map">
      <div><dt>Date</dt><dd>${escapeHtml(diagnostics.columns.date)}</dd></div>
      <div><dt>Merchant</dt><dd>${escapeHtml(diagnostics.columns.merchant)}</dd></div>
      <div><dt>Amount/debit</dt><dd>${escapeHtml(diagnostics.columns.amount)}</dd></div>
      <div><dt>Credit</dt><dd>${escapeHtml(diagnostics.columns.credit)}</dd></div>
    </dl>
    ${renderColumnMappingControls(diagnostics)}
    ${previewRows.length > 0 ? renderPreviewRows(previewRows) : `<p class="empty">No readable transaction rows yet.</p>`}
    ${rejectedCount > 0 ? renderRejectedRows(diagnostics.rejectedRows) : ""}
  `;
}

function renderColumnMappingControls(diagnostics) {
  if (diagnostics.availableColumns.length === 0) return "";
  const selected = currentColumnMapping || getMappingFromDiagnostics(diagnostics);
  return `
    <details class="mapping-rescue" ${diagnostics.hasManualMapping || diagnostics.rejectedRows.length > 0 ? "open" : ""}>
      <summary>Fix column mapping</summary>
      <div class="mapping-grid">
        ${renderColumnSelect("date", "Date", diagnostics.availableColumns, selected.date, true)}
        ${renderColumnSelect("merchant", "Merchant", diagnostics.availableColumns, selected.merchant, true)}
        ${renderColumnSelect("amount", "Amount/debit", diagnostics.availableColumns, selected.amount, true)}
        ${renderColumnSelect("credit", "Credit/refund", diagnostics.availableColumns, selected.credit, false)}
      </div>
    </details>
  `;
}

function renderColumnSelect(field, label, columns, selectedIndex, required) {
  const options = [
    required
      ? `<option value="-1" ${selectedIndex < 0 ? "selected" : ""}>Choose column</option>`
      : `<option value="-1" ${selectedIndex < 0 ? "selected" : ""}>No credit column</option>`,
    ...columns.map((column) => {
      const selected = column.index === selectedIndex ? "selected" : "";
      return `<option value="${column.index}" ${selected}>${escapeHtml(column.label)} (column ${column.index + 1})</option>`;
    })
  ].join("");

  return `
    <label>${label}
      <select data-map-field="${field}">
        ${options}
      </select>
    </label>
  `;
}

function getMappingFromDiagnostics(diagnostics) {
  const getIndex = (description) => {
    const match = String(description).match(/\(column (\d+)\)$/);
    return match ? Number(match[1]) - 1 : -1;
  };
  return {
    date: getIndex(diagnostics.columns.date),
    merchant: getIndex(diagnostics.columns.merchant),
    amount: getIndex(diagnostics.columns.amount),
    credit: getIndex(diagnostics.columns.credit)
  };
}

function readMappingControls() {
  const mapping = {};
  for (const control of importReview.querySelectorAll("[data-map-field]")) {
    mapping[control.dataset.mapField] = Number(control.value);
  }
  return mapping;
}

function renderPreviewRows(rows) {
  return `
    <div class="review-table" role="table" aria-label="Normalized transaction preview">
      <div class="review-row review-header" role="row">
        <span role="columnheader">Date</span>
        <span role="columnheader">Merchant</span>
        <span role="columnheader">Amount</span>
      </div>
      ${rows.map((row) => `
        <div class="review-row" role="row">
          <span role="cell">${escapeHtml(row.date)}</span>
          <span role="cell">${escapeHtml(row.merchant)}</span>
          <span role="cell">${formatMoney(row.amount)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRejectedRows(rows) {
  const visibleRows = rows.slice(0, 4);
  return `
    <details class="rejected-rows" open>
      <summary>Rejected rows</summary>
      <ul>
        ${visibleRows.map((row) => `<li>Row ${row.sourceRow}: ${escapeHtml(row.reason)}</li>`).join("")}
        ${rows.length > visibleRows.length ? `<li>${rows.length - visibleRows.length} more rejected row${rows.length - visibleRows.length === 1 ? "" : "s"}</li>` : ""}
      </ul>
    </details>
  `;
}

function getVisibleAnalysis(analysis) {
  const subscriptions = analysis.subscriptions.filter((item) => !suppressedCandidateIds.has(item.id));
  const activeMerchantNames = new Set(subscriptions.map((item) => item.merchant.toLowerCase()));
  return {
    ...analysis,
    subscriptions,
    duplicateRisks: analysis.duplicateRisks.filter((risk) => activeMerchantNames.has(risk.merchant.toLowerCase())),
    totalAnnualEstimate: roundMoney(subscriptions.reduce((sum, item) => sum + item.annualCost, 0))
  };
}

function getSuppressedSubscriptions(analysis) {
  return analysis.subscriptions.filter((item) => suppressedCandidateIds.has(item.id));
}

function renderSummary(transactions, analysis, dismissedCount) {
  parseStatus.textContent = `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} parsed. ${analysis.ignoredTransactions} refund or non-charge row${analysis.ignoredTransactions === 1 ? "" : "s"} ignored.`;
  summary.innerHTML = "";
  const cards = [
    ["Likely subscriptions", analysis.subscriptions.length],
    ["Annualized spend", formatMoney(analysis.totalAnnualEstimate)],
    ["Duplicate risks", analysis.duplicateRisks.length],
    ["Dismissed", dismissedCount],
    ["Private by design", "Browser only"]
  ];
  for (const [label, value] of cards) {
    const card = document.createElement("div");
    card.className = "metric";
    card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    summary.append(card);
  }
}

function renderFindings(subscriptions, dismissedCount) {
  findings.innerHTML = "";
  if (subscriptions.length === 0) {
    findings.innerHTML = dismissedCount > 0
      ? `<p class="empty">All recurring candidates are currently dismissed as false positives.</p>`
      : `<p class="empty">Paste transactions or load the sample data to see recurring charge candidates.</p>`;
    return;
  }

  for (const item of subscriptions) {
    const article = document.createElement("article");
    article.className = "finding";
    article.innerHTML = `
      <div class="finding-head">
        <div>
          <h3>${escapeHtml(item.merchant)}</h3>
          <p>${item.cadence} &middot; ${item.transactionCount} charges &middot; next ${item.nextRenewal || "unknown"}</p>
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
        <button class="quiet-danger" type="button" data-dismiss-id="${item.id}">Mark false positive</button>
      </div>
      <details>
        <summary>Why flagged? Confidence ${item.confidence}/99</summary>
        <ul>${item.explanations.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      </details>
    `;
    findings.append(article);
  }
}

function renderSuppressed(items) {
  suppressed.innerHTML = "";
  if (items.length === 0) return;

  const list = document.createElement("div");
  list.className = "suppressed-list";
  list.innerHTML = `<h3>Dismissed false positives</h3>`;
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "suppressed-row";
    row.innerHTML = `
      <span>${escapeHtml(item.merchant)} removed from totals and export.</span>
      <button type="button" data-restore-id="${item.id}">Restore</button>
    `;
    list.append(row);
  }
  suppressed.append(list);
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
    item.innerHTML = `<strong>${escapeHtml(risk.merchant)}</strong><span>${escapeHtml(risk.reason)} &middot; risk ${risk.riskScore}/99</span>`;
    duplicates.append(item);
  }
}

function updatePlanFromControls() {
  if (!currentPlan) return;
  for (const subscription of currentPlan.subscriptions) {
    const action = document.querySelector(`[data-plan-id="${subscription.id}"]`);
    const merchant = document.querySelector(`[data-merchant-id="${subscription.id}"]`);
    const source = currentAnalysis?.subscriptions.find((item) => item.id === subscription.id);
    if (action) {
      subscription.suggestedAction = action.value;
      if (source) source.suggestedAction = action.value;
    }
    if (merchant) {
      const cleanMerchant = merchant.value.trim() || subscription.merchant;
      subscription.merchant = cleanMerchant;
      if (source) source.merchant = cleanMerchant;
    }
  }
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

analyze();
