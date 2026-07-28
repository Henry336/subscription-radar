import {
  INPUT_LIMITS,
  analyzeSubscriptions,
  parseTransactionInput,
  sampleCsv
} from "./detector.js";
import { createCleanupPlan } from "./planning.js";
import { buildRenewalTimeline } from "./timeline.js";

const ACTION_OPTIONS = ["Needs review", "Investigate", "Keep", "Cancel", "Downgrade", "Check trial"];
const SVG_NS = "http://www.w3.org/2000/svg";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const input = document.querySelector("#transaction-input");
const fileInput = document.querySelector("#csv-file");
const dropZone = document.querySelector(".drop-zone");
const openFileButton = document.querySelector("#open-file");
const loadSampleButton = document.querySelector("#load-sample");
const analyzeButton = document.querySelector("#analyze");
const clearButton = document.querySelector("#clear-data");
const exportButton = document.querySelector("#export-plan");
const summary = document.querySelector("#summary");
const findings = document.querySelector("#findings");
const suppressed = document.querySelector("#suppressed");
const duplicates = document.querySelector("#duplicates");
const renewals = document.querySelector("#renewals");
const parseStatus = document.querySelector("#parse-status");
const inputError = document.querySelector("#input-error");
const currencySelect = document.querySelector("#currency-select");
const importReview = document.querySelector("#import-review");
const radar = document.querySelector("#radar");
const radarTotal = document.querySelector("#radar-total");
const radarCount = document.querySelector("#radar-count");
const sourceBadge = document.querySelector("#source-badge");
const scanMode = document.querySelector("#scan-mode");
const queueCount = document.querySelector("#queue-count");
const signalDesk = document.querySelector("#signal-desk");
const actionStatus = document.querySelector("#action-status");
const acceptSuggestionsButton = document.querySelector("#accept-suggestions");

let currentPlan = null;
let currentTransactions = [];
let currentAnalysis = null;
let currentDiagnostics = null;
let suppressedCandidateIds = new Set();
let currentColumnMapping = null;
let currentDateOrder = "auto";
let currentCurrency = suggestCurrency();
let userEdits = new Map();
let sourceLabel = "Illustrative demo";
let scanTimer = 0;
let resultsUnlocked = false;

openFileButton.addEventListener("click", () => fileInput.click());
currencySelect.value = currentCurrency;
currencySelect.addEventListener("change", () => {
  currentCurrency = currencySelect.value;
  if (currentAnalysis) refreshAnalysisView();
});
loadSampleButton.addEventListener("click", () => loadDemo({ scroll: true }));
analyzeButton.addEventListener("click", () => {
  sourceLabel = "Pasted statement";
  queueAnalysis({ resetEdits: true, scroll: true });
});
clearButton.addEventListener("click", requestClearSession);
fileInput.addEventListener("change", (event) => handleFile(event.target.files?.[0]));

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
}
dropZone.addEventListener("drop", (event) => handleFile(event.dataTransfer?.files?.[0]));

exportButton.addEventListener("click", exportPlan);
acceptSuggestionsButton.addEventListener("click", acceptAllSuggestions);

findings.addEventListener("change", updatePlanFromControls);
findings.addEventListener("input", updatePlanFromControls);
findings.addEventListener("click", (event) => {
  const button = event.target.closest("[data-dismiss-id]");
  if (!button) return;
  const nextFindingId = button.closest(".finding")?.nextElementSibling?.id;
  suppressedCandidateIds.add(button.dataset.dismissId);
  refreshAnalysisView();
  announceAction("Signal dismissed. You can restore it below.");
  const nextSummary = nextFindingId
    ? document.getElementById(nextFindingId)?.querySelector("summary")
    : findings.querySelector(".finding summary");
  if (nextSummary?.parentElement) nextSummary.parentElement.open = true;
  (nextSummary || suppressed.querySelector("summary") || queueCount).focus();
});

suppressed.addEventListener("click", (event) => {
  const button = event.target.closest("[data-restore-id]");
  if (!button) return;
  suppressedCandidateIds.delete(button.dataset.restoreId);
  refreshAnalysisView();
  announceAction("Signal restored and marked as needing review.");
  const restoredSummary = document.getElementById(`finding-${button.dataset.restoreId}`)?.querySelector("summary");
  if (restoredSummary?.parentElement) restoredSummary.parentElement.open = true;
  restoredSummary?.focus();
});

for (const eventName of ["click", "keydown"]) {
  radar.addEventListener(eventName, (event) => {
    if (eventName === "keydown" && !["Enter", " "].includes(event.key)) return;
    const target = event.target.closest("[data-signal-id]");
    if (!target) return;
    event.preventDefault();
    openFinding(target.dataset.signalId);
  });
}

importReview.addEventListener("change", (event) => {
  const mappingField = event.target.closest("[data-map-field]");
  const dateOrder = event.target.closest("[data-date-order]");
  if (!mappingField && !dateOrder) return;
  currentColumnMapping = readMappingControls();
  currentDateOrder = importReview.querySelector("[data-date-order]")?.value || currentDateOrder;
  resultsUnlocked = false;
  analyzeNow({ resetEdits: true });
});
importReview.addEventListener("click", (event) => {
  if (!event.target.closest("[data-continue-findings]")) return;
  resultsUnlocked = true;
  signalDesk.hidden = false;
  announceAction("Import confirmed. Review each recurring signal before export.");
  signalDesk.scrollIntoView({
    behavior: reducedMotion.matches ? "auto" : "smooth",
    block: "start"
  });
});

input.addEventListener("input", () => {
  sourceLabel = "Pasted statement";
  sourceBadge.textContent = sourceLabel;
  scanMode.textContent = "Pasted rows are ready to scan locally.";
});

async function handleFile(file) {
  if (!file) return;
  if (file.size > INPUT_LIMITS.maxCharacters) {
    showInputError(`“${file.name}” is too large for a safe in-tab scan. Choose a CSV under 2 MB.`);
    fileInput.value = "";
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    showInputError("Choose a CSV file. Other file types are not read.");
    fileInput.value = "";
    return;
  }

  try {
    input.value = await file.text();
    sourceLabel = file.name;
    currentColumnMapping = null;
    currentDateOrder = "auto";
    queueAnalysis({ resetEdits: true, scroll: true });
  } catch {
    showInputError("That file could not be read. Export it as a plain CSV and try again.");
  }
}

function loadDemo({ scroll = false } = {}) {
  input.value = sampleCsv;
  sourceLabel = "Illustrative demo";
  currentColumnMapping = null;
  currentDateOrder = "auto";
  queueAnalysis({ resetEdits: true, scroll });
}

function queueAnalysis({ resetEdits, scroll }) {
  window.clearTimeout(scanTimer);
  hideInputError();
  if (!input.value.trim()) {
    showInputError("Paste transaction rows or choose a CSV before scanning.");
    input.focus();
    return;
  }
  document.body.classList.add("is-scanning");
  analyzeButton.disabled = true;
  scanMode.textContent = `Scanning ${sourceLabel.toLowerCase()} inside this tab…`;
  const delay = reducedMotion.matches ? 0 : 520;
  scanTimer = window.setTimeout(() => {
    analyzeNow({ resetEdits });
    document.body.classList.remove("is-scanning");
    analyzeButton.disabled = false;
    if (scroll && !currentDiagnostics?.error) {
      importReview.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    } else if (currentDiagnostics?.error) {
      inputError.focus();
    }
  }, delay);
}

function analyzeNow({ resetEdits }) {
  const parsed = parseTransactionInput(input.value, {
    ...(currentColumnMapping ? { indexes: currentColumnMapping } : {}),
    dateOrder: currentDateOrder
  });
  currentTransactions = parsed.transactions;
  currentDiagnostics = parsed.diagnostics;
  currentAnalysis = analyzeSubscriptions(currentTransactions);
  if (resetEdits) {
    resultsUnlocked = false;
    suppressedCandidateIds = new Set();
    userEdits = new Map();
  }
  if (currentDiagnostics.error) showInputError(currentDiagnostics.error);
  refreshAnalysisView();
  scanMode.textContent = currentDiagnostics.error
    ? "The scan stopped before reading transaction data."
    : `${sourceLabel} · processed locally · ${currentTransactions.length.toLocaleString("en-US")} readable rows`;
  sourceBadge.textContent = sourceLabel;
}

function refreshAnalysisView() {
  if (!currentAnalysis) return;
  const visible = getVisibleAnalysis(currentAnalysis);
  const dismissed = getSuppressedSubscriptions(currentAnalysis);
  currentPlan = createCleanupPlan(visible, dismissed);

  renderRadar(visible.subscriptions);
  renderSummary(currentTransactions, visible, dismissed.length);
  renderImportReview(currentDiagnostics);
  renderFindings(visible.subscriptions, dismissed.length);
  renderSuppressed(dismissed);
  renderRenewals(buildRenewalTimeline(visible.subscriptions));
  renderDuplicates(visible.duplicateRisks);

  const count = visible.subscriptions.length;
  updateReviewControls(visible.subscriptions);
  signalDesk.hidden = !resultsUnlocked;
  document.querySelector("#signal-desk").classList.toggle("has-results", count > 0);
}

function renderRadar(subscriptions) {
  radar.replaceChildren();
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "radar-plot");
  svg.setAttribute("viewBox", "0 0 400 400");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", "radar-svg-title radar-svg-desc");

  const title = document.createElementNS(SVG_NS, "title");
  title.setAttribute("id", "radar-svg-title");
  title.textContent = "Recurring charge signal field";
  const description = document.createElementNS(SVG_NS, "desc");
  description.setAttribute("id", "radar-svg-desc");
  description.textContent = subscriptions.length
    ? `${subscriptions.length} likely recurring charges plotted by estimated renewal timing and annual cost.`
    : "No recurring charge signals are plotted.";
  svg.append(title, description);

  const grid = document.createElementNS(SVG_NS, "g");
  grid.setAttribute("class", "radar-grid");
  for (const radius of [48, 92, 136, 180]) {
    const circle = document.createElementNS(SVG_NS, "circle");
    setSvgAttributes(circle, { cx: 200, cy: 200, r: radius });
    grid.append(circle);
  }
  for (const [x1, y1, x2, y2] of [
    [20, 200, 380, 200],
    [200, 20, 200, 380],
    [73, 73, 327, 327],
    [327, 73, 73, 327]
  ]) {
    const line = document.createElementNS(SVG_NS, "line");
    setSvgAttributes(line, { x1, y1, x2, y2 });
    grid.append(line);
  }
  svg.append(grid);

  const sweep = document.createElementNS(SVG_NS, "g");
  sweep.setAttribute("class", "radar-sweep");
  const sweepLine = document.createElementNS(SVG_NS, "line");
  setSvgAttributes(sweepLine, { x1: 200, y1: 200, x2: 200, y2: 26 });
  sweep.append(sweepLine);
  svg.append(sweep);

  const maxAnnualCost = Math.max(...subscriptions.map((item) => item.annualCost), 1);
  const timeline = new Map(buildRenewalTimeline(subscriptions).map((item) => [item.id, item]));
  for (const [index, item] of subscriptions.slice(0, 8).entries()) {
    const daysUntil = timeline.get(item.id)?.daysUntil ?? index * 43;
    const normalizedDays = ((daysUntil % 365) + 365) % 365;
    const angle = (normalizedDays / 365) * Math.PI * 2 - Math.PI / 2;
    const distance = 66 + (item.annualCost / maxAnnualCost) * 104;
    const x = 200 + Math.cos(angle) * distance;
    const y = 200 + Math.sin(angle) * distance;

    const trace = document.createElementNS(SVG_NS, "line");
    trace.setAttribute("class", "signal-trace");
    setSvgAttributes(trace, { x1: 200, y1: 200, x2: x, y2: y });
    svg.append(trace);

    const point = document.createElementNS(SVG_NS, "circle");
    point.setAttribute("class", item.annualCost >= 240 ? "signal-point is-urgent" : "signal-point");
    setSvgAttributes(point, {
      cx: x,
      cy: y,
      r: item.confidence >= 80 ? 7 : 5,
      tabindex: 0,
      role: "button",
      "aria-label": `Open ${item.merchant}: ${formatMoney(item.annualCost)} estimated per year`
    });
    point.dataset.signalId = item.id;
    const pointTitle = document.createElementNS(SVG_NS, "title");
    pointTitle.textContent = `${item.merchant}, ${formatMoney(item.annualCost)} estimated per year`;
    point.append(pointTitle);
    svg.append(point);
  }

  const center = document.createElementNS(SVG_NS, "circle");
  center.setAttribute("class", "radar-center");
  setSvgAttributes(center, { cx: 200, cy: 200, r: 9 });
  svg.append(center);
  radar.append(svg);

  const key = createElement("ul", "radar-key");
  for (const item of subscriptions.slice(0, 8)) {
    const row = createElement("li");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.dataset.signalId = item.id;
    row.setAttribute("aria-label", `Open ${item.merchant} finding`);
    const name = createElement("span");
    name.append(createElement("i"), document.createTextNode(item.merchant));
    row.append(name, createElement("strong", "", formatMoney(item.annualCost)));
    key.append(row);
  }
  if (subscriptions.length === 0) {
    key.append(createElement("li", "radar-empty", "Scan a statement to plot recurring signals."));
  }
  const legend = createElement(
    "p",
    "radar-legend",
    `Around the dial: next estimated renewal · distance: yearly cost · dot size: heuristic pattern score · coral: ${formatMoney(240)}+ per year`
  );
  radar.append(key, legend);

  const total = subscriptions.reduce((sum, item) => sum + item.annualCost, 0);
  radarTotal.textContent = formatMoney(total);
  radarCount.textContent = String(subscriptions.length);
}

function renderImportReview(diagnostics) {
  importReview.replaceChildren();
  if (!diagnostics || diagnostics.isEmpty || diagnostics.error) return;

  const rejectedCount = diagnostics.rejectedRows.length;
  const headerMode = diagnostics.hasManualMapping
    ? "Manual column mapping applied"
    : diagnostics.hasHeader ? "Header row recognized" : "First three columns assumed";

  const head = createElement("div", "review-head");
  const heading = createElement("div");
  heading.append(
    createElement("p", "station-index", "Import check"),
    createElement("h3", "", "What the scanner understood"),
    createElement(
      "p",
      "",
      `${headerMode}. ${rejectedCount} rejected row${rejectedCount === 1 ? "" : "s"}.`
    )
  );
  head.append(
    heading,
    createElement(
      "span",
      `review-badge ${rejectedCount ? "needs-review" : "ok"}`,
      rejectedCount ? "Check rows" : "Ready"
    )
  );
  importReview.append(head);

  if (diagnostics.warnings?.length) {
    const warning = createElement("div", "review-warning");
    for (const message of diagnostics.warnings) warning.append(createElement("p", "", message));
    importReview.append(warning);
  }

  const map = createElement("dl", "column-map");
  for (const [label, value] of [
    ["Date", diagnostics.columns.date],
    ["Merchant", diagnostics.columns.merchant],
    ["Amount / debit", diagnostics.columns.amount],
    ["Credit", diagnostics.columns.credit],
    ["Date order", dateOrderLabel(diagnostics.dateOrder)]
  ]) {
    const item = createElement("div");
    item.append(createElement("dt", "", label), createElement("dd", "", value));
    map.append(item);
  }
  importReview.append(map, renderColumnMappingControls(diagnostics));

  if (diagnostics.previewRows.length) importReview.append(renderPreviewRows(diagnostics.previewRows));
  if (rejectedCount) importReview.append(renderRejectedRows(diagnostics.rejectedRows));

  const continueRow = createElement("div", "review-continue");
  const continueCopy = createElement(
    "p",
    "",
    diagnostics.warnings?.length || rejectedCount
      ? "Check the highlighted interpretation before accepting these results."
      : "The preview is the consent checkpoint between your statement and the detector."
  );
  const continueButton = createElement("button", "button button-signal", "Confirm import & review signals");
  continueButton.type = "button";
  continueButton.dataset.continueFindings = "true";
  continueRow.append(continueCopy, continueButton);
  importReview.append(continueRow);
}

function renderColumnMappingControls(diagnostics) {
  const details = createElement("details", "mapping-rescue");
  if (diagnostics.hasManualMapping || diagnostics.rejectedRows.length || diagnostics.warnings?.length) {
    details.open = true;
  }
  details.append(createElement("summary", "", "Fix column or date mapping"));
  const grid = createElement("div", "mapping-grid");
  const selected = currentColumnMapping || getMappingFromDiagnostics(diagnostics);
  grid.append(
    renderColumnSelect("date", "Date column", diagnostics.availableColumns, selected.date, true),
    renderColumnSelect("merchant", "Merchant column", diagnostics.availableColumns, selected.merchant, true),
    renderColumnSelect("amount", "Amount / debit", diagnostics.availableColumns, selected.amount, true),
    renderColumnSelect("credit", "Credit / refund", diagnostics.availableColumns, selected.credit, false)
  );

  const dateLabel = createElement("label");
  dateLabel.append(createElement("span", "", "Date format"));
  const dateSelect = createElement("select");
  dateSelect.dataset.dateOrder = "true";
  for (const [value, label] of [
    ["auto", "Auto detect"],
    ["ymd", "YYYY-MM-DD"],
    ["dmy", "DD/MM/YYYY"],
    ["mdy", "MM/DD/YYYY"]
  ]) {
    const option = createElement("option", "", label);
    option.value = value;
    option.selected = value === currentDateOrder;
    dateSelect.append(option);
  }
  dateLabel.append(dateSelect);
  grid.append(dateLabel);
  details.append(grid);
  return details;
}

function renderColumnSelect(field, label, columns, selectedIndex, required) {
  const wrapper = createElement("label");
  wrapper.append(createElement("span", "", label));
  const select = createElement("select");
  select.dataset.mapField = field;

  const placeholder = createElement(
    "option",
    "",
    required ? "Choose column" : "No credit column"
  );
  placeholder.value = "-1";
  placeholder.selected = selectedIndex < 0;
  select.append(placeholder);

  for (const column of columns) {
    const option = createElement("option", "", `${column.label} (column ${column.index + 1})`);
    option.value = String(column.index);
    option.selected = column.index === selectedIndex;
    select.append(option);
  }
  wrapper.append(select);
  return wrapper;
}

function renderPreviewRows(rows) {
  const wrapper = createElement("div", "preview-wrap");
  wrapper.append(createElement("h4", "", "Normalized preview"));
  const table = createElement("table", "review-table");
  const head = createElement("thead");
  const headRow = createElement("tr");
  for (const label of ["Date", "Merchant", "Amount"]) headRow.append(createElement("th", "", label));
  head.append(headRow);
  const body = createElement("tbody");
  for (const row of rows) {
    const tableRow = createElement("tr");
    tableRow.append(
      createElement("td", "", row.date),
      createElement("td", "", row.merchant),
      createElement("td", "", formatSignedMoney(row.amount))
    );
    body.append(tableRow);
  }
  table.append(head, body);
  wrapper.append(table);
  return wrapper;
}

function renderRejectedRows(rows) {
  const details = createElement("details", "rejected-rows");
  details.open = true;
  details.append(createElement("summary", "", `Rejected rows (${rows.length})`));
  const list = createElement("ul");
  for (const row of rows.slice(0, 5)) {
    list.append(createElement("li", "", `Row ${row.sourceRow}: ${row.reason}`));
  }
  if (rows.length > 5) list.append(createElement("li", "", `${rows.length - 5} more rejected rows`));
  details.append(list);
  return details;
}

function renderSummary(transactions, analysis, dismissedCount) {
  summary.replaceChildren();
  const rejectedCount = currentDiagnostics?.rejectedRows?.length || 0;
  const totalRows = transactions.length + rejectedCount;
  const cancelTotal = analysis.subscriptions
    .filter((item) => item.selectedAction === "Cancel")
    .reduce((sum, item) => sum + item.annualCost, 0);
  const reviewRemaining = analysis.subscriptions.filter((item) => item.selectedAction === "Needs review").length;
  const reviewedCount = analysis.subscriptions.length - reviewRemaining;
  const metrics = [
    ["Detected", formatMoney(analysis.totalAnnualEstimate), "estimated per year"],
    ["Monthly equivalent", formatMoney(analysis.totalAnnualEstimate / 12), "for scale, not a forecast"],
    ["Marked cancel", formatMoney(cancelTotal), "annual spend selected by you"],
    ["Review progress", `${reviewedCount}/${analysis.subscriptions.length}`, `${transactions.length}/${totalRows} rows read · ${dismissedCount} dismissed · ${analysis.ignoredTransactions} credits ignored`]
  ];

  for (const [label, value, detail] of metrics) {
    const item = createElement("div", "summary-item");
    item.append(
      createElement("span", "", label),
      createElement("strong", "", value),
      createElement("small", "", detail)
    );
    summary.append(item);
  }

  parseStatus.textContent = `${transactions.length} readable transaction${transactions.length === 1 ? "" : "s"} · ${analysis.subscriptions.length} recurring signal${analysis.subscriptions.length === 1 ? "" : "s"} · ${analysis.ignoredTransactions} credit or non-charge row${analysis.ignoredTransactions === 1 ? "" : "s"} ignored`;
}

function renderFindings(subscriptions, dismissedCount) {
  findings.replaceChildren();
  if (subscriptions.length === 0) {
    const message = dismissedCount
      ? "Every signal is dismissed for this session. Restore one below if needed."
      : "No recurring pattern cleared the confidence threshold. Check the import preview or try more history.";
    findings.append(createElement("p", "empty-state", message));
    return;
  }

  for (const [index, item] of subscriptions.entries()) {
    const article = createElement("details", "finding");
    article.id = `finding-${item.id}`;
    article.open = index === 0 && item.selectedAction === "Needs review";
    const head = createElement("summary", "finding-head");
    const rank = createElement("span", "finding-rank", String(index + 1).padStart(2, "0"));
    const identity = createElement("div", "finding-identity");
    identity.append(
      createElement("h4", "", item.merchant),
      createElement(
        "p",
        "",
        `${capitalize(item.cadence)} · ${item.transactionCount} charges · renews ${item.nextRenewal ? formatDate(item.nextRenewal) : "date unknown"}`
      )
    );
    const cost = createElement("div", "finding-cost");
    cost.append(
      createElement("strong", "", formatMoney(item.annualCost)),
      createElement("span", "", `${formatMoney(item.averageAmount)} average · estimated / year`)
    );
    const reviewState = createElement(
      "span",
      `review-state ${item.selectedAction === "Needs review" ? "is-pending" : "is-reviewed"}`,
      item.selectedAction
    );
    head.append(rank, identity, cost, reviewState);

    const evidenceLine = createElement("div", "evidence-line");
    const confidence = createElement("div", "confidence");
    const meter = createElement("meter");
    meter.min = 0;
    meter.max = 99;
    meter.value = item.confidence;
    meter.textContent = `${item.confidence} of 99`;
    confidence.append(
      createElement("span", "", "Pattern score · heuristic"),
      meter,
      createElement("strong", "", `${item.confidence}/99`)
    );
    const renewal = createElement("div", "next-renewal");
    renewal.append(
      createElement("span", "", "Next estimated renewal"),
      createElement("strong", "", item.nextRenewal ? formatDate(item.nextRenewal) : "Not enough cadence data")
    );
    const suggestion = createElement("div", "detector-suggestion");
    suggestion.append(
      createElement("span", "", "Detector suggests"),
      createElement("strong", "", item.suggestedAction)
    );
    evidenceLine.append(confidence, renewal, suggestion);

    const controls = createElement("div", "finding-controls");
    const actionLabel = createElement("label");
    actionLabel.append(createElement("span", "", "Your action"));
    const actionSelect = createElement("select");
    actionSelect.dataset.planId = item.id;
    for (const action of ACTION_OPTIONS) {
      const option = createElement("option", "", action);
      option.selected = action === item.selectedAction;
      actionSelect.append(option);
    }
    actionLabel.append(actionSelect);

    const merchantLabel = createElement("label");
    merchantLabel.append(createElement("span", "", "Clean merchant name"));
    const merchantInput = createElement("input");
    merchantInput.value = item.merchant;
    merchantInput.dataset.merchantId = item.id;
    merchantInput.maxLength = 120;
    merchantInput.autocomplete = "off";
    merchantLabel.append(merchantInput);

    const dismiss = createElement("button", "button button-dismiss", "Not recurring");
    dismiss.type = "button";
    dismiss.dataset.dismissId = item.id;
    controls.append(actionLabel, merchantLabel, dismiss);

    const details = createElement("details", "finding-evidence");
    details.append(createElement("summary", "", "Show the evidence trail"));
    const list = createElement("ul");
    for (const line of item.explanations) list.append(createElement("li", "", line));
    details.append(list);

    const body = createElement("div", "finding-body");
    body.append(evidenceLine, controls, details);
    article.append(head, body);
    article.addEventListener("toggle", () => {
      if (!article.open) return;
      for (const other of findings.querySelectorAll(".finding[open]")) {
        if (other !== article) other.open = false;
      }
    });
    findings.append(article);
  }
}

function renderSuppressed(items) {
  suppressed.replaceChildren();
  if (!items.length) return;
  const details = createElement("details", "suppressed-list");
  details.append(createElement("summary", "", `Dismissed for this session (${items.length})`));
  const list = createElement("div");
  for (const item of items) {
    const row = createElement("div", "suppressed-row");
    row.append(
      createElement("span", "", `${item.merchant} · ${formatMoney(item.annualCost)} estimated / year`),
      restoreButton(item.id)
    );
    list.append(row);
  }
  details.append(list);
  suppressed.append(details);
}

function renderRenewals(timeline) {
  renewals.replaceChildren();
  if (!timeline.length) {
    renewals.append(createElement("p", "empty-state", "No dated renewals yet."));
    return;
  }
  for (const item of timeline.slice(0, 7)) {
    const row = createElement("article", `renewal ${urgencyClass(item.urgency)}`);
    const timing = createElement("div", "renewal-time");
    timing.append(
      createElement("strong", "", relativeDays(item.daysUntil)),
      createElement("span", "", formatDate(item.nextRenewal))
    );
    const detail = createElement("div", "renewal-detail");
    detail.append(
      createElement("strong", "", item.merchant),
      createElement("span", "", `${item.selectedAction} · ${capitalize(item.cadence)}`)
    );
    row.append(timing, detail, createElement("strong", "renewal-amount", formatMoney(item.averageAmount)));
    renewals.append(row);
  }
}

function renderDuplicates(risks) {
  duplicates.replaceChildren();
  if (!risks.length) {
    duplicates.append(createElement("p", "empty-state", "No overlapping monthly amount patterns found."));
    return;
  }
  for (const risk of risks) {
    const item = createElement("article", "duplicate-risk");
    item.append(
      createElement("strong", "", risk.merchant),
      createElement("p", "", risk.reason),
      createElement("span", "", `Pattern score · ${risk.riskScore}/99`)
    );
    duplicates.append(item);
  }
}

function updatePlanFromControls(event) {
  if (!currentAnalysis) return;
  const actionById = new Map(
    [...findings.querySelectorAll("[data-plan-id]")].map((control) => [control.dataset.planId, control.value])
  );
  const merchantById = new Map(
    [...findings.querySelectorAll("[data-merchant-id]")].map((control) => [control.dataset.merchantId, control.value])
  );
  for (const source of currentAnalysis.subscriptions) {
    if (!actionById.has(source.id) && !merchantById.has(source.id)) continue;
    userEdits.set(source.id, {
      selectedAction: actionById.get(source.id) || userEdits.get(source.id)?.selectedAction || "Needs review",
      merchant: merchantById.get(source.id)?.trim().slice(0, 120) || source.merchant
    });
  }

  const visible = getVisibleAnalysis(currentAnalysis);
  const dismissed = getSuppressedSubscriptions(currentAnalysis);
  currentPlan = createCleanupPlan(visible, dismissed);
  renderSummary(currentTransactions, visible, dismissed.length);
  renderRenewals(buildRenewalTimeline(visible.subscriptions));
  updateReviewControls(visible.subscriptions);

  const actionControl = event?.target?.closest?.("[data-plan-id]");
  if (actionControl && event.type === "change") {
    const item = visible.subscriptions.find((subscription) => subscription.id === actionControl.dataset.planId);
    const finding = actionControl.closest(".finding");
    const state = finding?.querySelector(".review-state");
    if (state && item) {
      state.className = `review-state ${item.selectedAction === "Needs review" ? "is-pending" : "is-reviewed"}`;
      state.textContent = item.selectedAction;
    }
    announceAction(
      item?.selectedAction === "Needs review"
        ? `${item.merchant} still needs a decision.`
        : `${item?.merchant || "Signal"} marked ${item?.selectedAction.toLowerCase()}.`
    );
    if (item?.selectedAction !== "Needs review") advanceToNextFinding(finding);
  }
}

function getVisibleAnalysis(analysis) {
  const subscriptions = analysis.subscriptions
    .filter((item) => !suppressedCandidateIds.has(item.id))
    .map(applyUserEdits);
  const activeMerchantNames = new Set(subscriptions.map((item) => item.merchant.toLowerCase()));
  return {
    ...analysis,
    subscriptions,
    duplicateRisks: analysis.duplicateRisks.filter((risk) => activeMerchantNames.has(risk.merchant.toLowerCase())),
    totalAnnualEstimate: roundMoney(subscriptions.reduce((sum, item) => sum + item.annualCost, 0))
  };
}

function getSuppressedSubscriptions(analysis) {
  return analysis.subscriptions
    .filter((item) => suppressedCandidateIds.has(item.id))
    .map(applyUserEdits);
}

function applyUserEdits(item) {
  const edits = userEdits.get(item.id) || {};
  return {
    ...item,
    merchant: edits.merchant || item.merchant,
    selectedAction: edits.selectedAction || "Needs review"
  };
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

function updateReviewControls(subscriptions) {
  const remaining = subscriptions.filter((item) => item.selectedAction === "Needs review").length;
  const reviewed = subscriptions.length - remaining;
  queueCount.textContent = subscriptions.length
    ? `${reviewed} of ${subscriptions.length} reviewed`
    : "0 awaiting review";
  acceptSuggestionsButton.hidden = subscriptions.length === 0 || remaining === 0;
  exportButton.disabled = subscriptions.length === 0 || remaining > 0;
  exportButton.title = remaining
    ? `Review ${remaining} more signal${remaining === 1 ? "" : "s"} to unlock export`
    : subscriptions.length ? "Download the reviewed cleanup plan" : "Scan a statement first";
  actionStatus.textContent = remaining
    ? `${remaining} active signal${remaining === 1 ? "" : "s"} still need your decision.`
    : subscriptions.length ? "Review complete. Your cleanup plan is ready to export." : "Scan a statement to begin.";
}

function acceptAllSuggestions() {
  if (!currentAnalysis) return;
  for (const item of currentAnalysis.subscriptions) {
    if (suppressedCandidateIds.has(item.id)) continue;
    const existing = userEdits.get(item.id) || {};
    userEdits.set(item.id, {
      ...existing,
      merchant: existing.merchant || item.merchant,
      selectedAction: item.suggestedAction
    });
  }
  refreshAnalysisView();
  announceAction("All active detector suggestions were explicitly accepted. You can still edit any signal.");
  exportButton.focus();
}

function advanceToNextFinding(currentFinding) {
  if (!currentFinding) return;
  const candidates = [...findings.querySelectorAll(".finding")];
  const currentIndex = candidates.indexOf(currentFinding);
  const ordered = [...candidates.slice(currentIndex + 1), ...candidates.slice(0, currentIndex)];
  const next = ordered.find((candidate) => candidate.querySelector("[data-plan-id]")?.value === "Needs review");
  currentFinding.open = false;
  if (next) {
    next.open = true;
    next.querySelector("summary")?.focus();
  } else {
    exportButton.focus();
  }
}

function openFinding(id) {
  if (!resultsUnlocked) {
    importReview.querySelector("[data-continue-findings]")?.focus();
    importReview.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
    return;
  }
  const finding = document.getElementById(`finding-${id}`);
  if (!finding) return;
  finding.open = true;
  finding.querySelector("summary")?.focus();
  finding.scrollIntoView({
    behavior: reducedMotion.matches ? "auto" : "smooth",
    block: "center"
  });
}

function exportPlan() {
  if (!currentPlan || exportButton.disabled) return;
  const payload = {
    ...currentPlan,
    currency: currentCurrency,
    currencyMeaning: "Statement currency label; no exchange-rate conversion applied",
    source: sourceLabel === "Illustrative demo" ? "Illustrative demo data" : "User-provided local statement"
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "subscription-radar-cleanup-plan.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  announceAction("Cleanup plan downloaded. It contains only the signals and actions you reviewed.");
}

function requestClearSession() {
  if (
    currentTransactions.length > 0 &&
    !window.confirm("Clear the imported rows and every decision from this tab? This cannot be undone.")
  ) {
    announceAction("Clear cancelled. Your session is unchanged.");
    return;
  }
  clearSession();
}

function clearSession({ focus = true } = {}) {
  window.clearTimeout(scanTimer);
  document.body.classList.remove("is-scanning");
  input.value = "";
  fileInput.value = "";
  sourceLabel = "No statement";
  currentColumnMapping = null;
  currentDateOrder = "auto";
  currentTransactions = [];
  currentDiagnostics = null;
  currentAnalysis = analyzeSubscriptions([]);
  currentPlan = null;
  suppressedCandidateIds = new Set();
  userEdits = new Map();
  resultsUnlocked = false;
  hideInputError();
  refreshAnalysisView();
  parseStatus.textContent = "This tab is clear. No transaction rows are in memory.";
  scanMode.textContent = "No statement is loaded.";
  sourceBadge.textContent = sourceLabel;
  signalDesk.hidden = true;
  if (focus) openFileButton.focus();
}

function announceAction(message) {
  actionStatus.textContent = message;
}

function showInputError(message) {
  inputError.textContent = message;
  inputError.hidden = false;
}

function hideInputError() {
  inputError.textContent = "";
  inputError.hidden = true;
}

function restoreButton(id) {
  const button = createElement("button", "button button-quiet", "Restore");
  button.type = "button";
  button.dataset.restoreId = id;
  return button;
}

function createElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== "") element.textContent = String(text);
  return element;
}

function setSvgAttributes(element, attributes) {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
}

function urgencyClass(urgency) {
  return {
    overdue: "is-overdue",
    "next 7 days": "is-imminent",
    "next 30 days": "is-soon",
    "next 90 days": "is-later",
    later: "is-later"
  }[urgency] || "is-later";
}

function relativeDays(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  return `${days}d`;
}

function dateOrderLabel(order) {
  return {
    ymd: "Year / month / day",
    dmy: "Day / month / year",
    mdy: "Month / day / year",
    auto: "Auto detect"
  }[order] || "Auto detect";
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currentCurrency
  }).format(Number(value || 0));
}

function formatSignedMoney(value) {
  const amount = Number(value || 0);
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatMoney(amount)}`;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function capitalize(value) {
  const text = String(value || "");
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}

function suggestCurrency() {
  const region = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[1]?.toUpperCase();
  return {
    SG: "SGD",
    GB: "GBP",
    AU: "AUD",
    CA: "CAD",
    JP: "JPY",
    IN: "INR",
    AT: "EUR",
    BE: "EUR",
    DE: "EUR",
    ES: "EUR",
    FI: "EUR",
    FR: "EUR",
    IE: "EUR",
    IT: "EUR",
    NL: "EUR",
    PT: "EUR"
  }[region] || "USD";
}

clearSession({ focus: false });
