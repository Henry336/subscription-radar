const DATE_HEADERS = ["date", "posted date", "transaction date", "trans date"];
const MERCHANT_HEADERS = ["merchant", "description", "name", "payee", "memo"];
const AMOUNT_HEADERS = ["amount", "debit", "charge", "withdrawal", "paid out"];
const CREDIT_HEADERS = ["credit", "deposit", "paid in"];
const DATE_ORDERS = new Set(["auto", "ymd", "dmy", "mdy"]);

export const INPUT_LIMITS = Object.freeze({
  maxCharacters: 2_000_000,
  maxRows: 50_000,
  maxColumns: 100
});

const STOP_WORDS = new Set([
  "com",
  "co",
  "inc",
  "llc",
  "ltd",
  "payment",
  "purchase",
  "card",
  "visa",
  "mastercard",
  "online",
  "digital",
  "premium",
  "plus",
  "basic",
  "pro",
  "annual",
  "monthly",
  "systems",
  "creative",
  "cloud",
  "pte",
  "singapore",
  "sg",
  "usa",
  "trial",
  "renewal"
]);

export const sampleCsv = createSampleCsv();

export function createSampleCsv(today = new Date()) {
  const date = (daysAgo) => dateAtOffset(today, -daysAgo);
  return `Date,Description,Amount
${date(100)},NETFLIX.COM 866-579-7172,-17.99
${date(70)},Netflix Monthly,-17.99
${date(40)},NETFLIX.COM,-17.99
${date(10)},Netflix.com,-17.99
${date(102)},Spotify Pte Ltd,-10.99
${date(72)},SPOTIFY *PREMIUM,-10.99
${date(42)},Spotify Premium,-10.99
${date(12)},SPOTIFY,-10.99
${date(94)},Adobe Creative Cloud,-54.99
${date(64)},ADOBE *CREATIVE CLOUD,-54.99
${date(34)},Adobe Systems,-54.99
${date(4)},Adobe Creative Cloud,-54.99
${date(106)},Cloudbox Storage Basic,-9.99
${date(76)},CLOUDBOX STORAGE,-9.99
${date(46)},Cloudbox Storage,-9.99
${date(16)},Cloudbox Storage,-9.99
${date(101)},Cloudbox Storage Pro,-19.99
${date(71)},CLOUDBOX STORAGE PRO,-19.99
${date(41)},Cloudbox Storage Pro,-19.99
${date(11)},Cloudbox Storage Pro,-19.99
${date(715)},Todoist Annual,-48.00
${date(350)},TODOIST,-48.00
${date(80)},Duolingo Trial,-0.00
${date(35)},Amazon Marketplace,-31.42
${date(28)},AMZN Mktp US,-28.11
${date(20)},Netflix refund,17.99
${date(2)},Coffee Shop,-5.80`;
}

export function parseTransactions(input) {
  return parseTransactionInput(input).transactions;
}

export function parseTransactionInput(input, options = {}) {
  const source = String(input || "").trim();
  if (source.length > INPUT_LIMITS.maxCharacters) {
    return createInputError(`This file is too large to scan safely. Keep it under ${formatMegabytes(INPUT_LIMITS.maxCharacters)} MB.`);
  }

  const rows = parseCsv(source);
  if (rows.length === 0) {
    return {
      transactions: [],
      diagnostics: createDiagnostics([], false, { date: 0, merchant: 1, amount: 2, credit: -1 }, [], [], true, false)
    };
  }
  if (rows.length > INPUT_LIMITS.maxRows) {
    return createInputError(`This file has too many rows to scan safely. Keep it under ${INPUT_LIMITS.maxRows.toLocaleString("en-US")} rows.`);
  }
  if (rows.some((row) => row.length > INPUT_LIMITS.maxColumns)) {
    return createInputError(`This file has more than ${INPUT_LIMITS.maxColumns} columns in at least one row.`);
  }

  const header = rows[0].map((cell) => normalizeHeader(cell));
  const hasRecognizedHeader = header.some((cell) => DATE_HEADERS.includes(cell)) &&
    header.some((cell) => MERCHANT_HEADERS.includes(cell)) &&
    header.some((cell) => AMOUNT_HEADERS.includes(cell) || CREDIT_HEADERS.includes(cell));
  const hasManualMapping = Boolean(options.indexes);

  const indexes = hasManualMapping
    ? sanitizeIndexes(options.indexes)
    : hasRecognizedHeader
      ? inferIndexes(header)
      : { date: 0, merchant: 1, amount: 2, credit: -1 };
  const hasHeader = hasRecognizedHeader || rowLooksLikeManualHeader(rows, indexes, hasManualMapping);
  const start = hasHeader ? 1 : 0;
  const dateResolution = resolveDateOrder(
    rows.slice(start).map((row) => row[indexes.date]),
    options.dateOrder
  );

  const rejectedRows = [];
  const transactions = rows.slice(start)
    .map((row, index) => normalizeRow(row, indexes, index + start + 1, rejectedRows, dateResolution.order))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  const diagnostics = createDiagnostics(rows[0], hasHeader, indexes, rejectedRows, transactions, false, hasManualMapping);
  diagnostics.dateOrder = dateResolution.order;
  diagnostics.warnings = dateResolution.ambiguous
    ? ["Ambiguous slash-formatted dates were read as month/day/year. Choose another date format if the preview looks wrong."]
    : [];

  return {
    transactions,
    diagnostics
  };
}

export function analyzeSubscriptions(transactions) {
  const charges = transactions
    .filter((transaction) => transaction.amount < 0)
    .map((transaction) => ({
      ...transaction,
      chargeAmount: roundMoney(Math.abs(transaction.amount)),
      merchantKey: normalizeMerchant(transaction.merchant)
    }))
    .filter((transaction) => transaction.merchantKey.length > 1);

  const groups = groupBy(charges, (transaction) => transaction.merchantKey);
  const subscriptions = [];
  const duplicateRisks = [];

  for (const [merchantKey, group] of groups) {
    const byAmount = groupBySimilarAmount(group);
    for (const amountGroup of byAmount) {
      const intervals = getIntervals(amountGroup);
      const cadence = inferCadence(intervals, amountGroup);
      const confidence = scoreConfidence(amountGroup, intervals, cadence);
      const explanations = explainFinding(amountGroup, intervals, cadence, confidence);
      const annualCost = estimateAnnualCost(amountGroup, cadence);
      const nextRenewal = estimateNextRenewal(amountGroup, cadence);

      if (confidence >= 42 || amountGroup.length >= 3) {
        subscriptions.push({
          id: `${merchantKey}-${amountGroup[0].chargeAmount}`,
          merchant: titleCase(merchantKey),
          merchantKey,
          cadence,
          confidence,
          averageAmount: average(amountGroup.map((item) => item.chargeAmount)),
          annualCost,
          nextRenewal,
          lastSeen: amountGroup.at(-1).date,
          transactionCount: amountGroup.length,
          transactions: amountGroup,
          explanations,
          suggestedAction: suggestAction(amountGroup, cadence, confidence)
        });
      }
    }

    const monthlyDuplicates = findDuplicateMonthlyPlans(group);
    duplicateRisks.push(...monthlyDuplicates);
  }

  return {
    subscriptions: subscriptions.sort((a, b) => b.confidence - a.confidence || b.annualCost - a.annualCost),
    duplicateRisks: duplicateRisks.sort((a, b) => b.riskScore - a.riskScore),
    ignoredTransactions: transactions.length - charges.length,
    totalAnnualEstimate: roundMoney(subscriptions.reduce((sum, item) => sum + item.annualCost, 0))
  };
}

export function normalizeMerchant(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/refund|reversal|credit/g, "")
    .replace(/\b\d{2,}\b/g, " ")
    .replace(/[*#._/\\-]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((part) => part && !STOP_WORDS.has(part))
    .slice(0, 4)
    .join(" ")
    .trim();
}

function parseCsv(input) {
  if (!input) return [];
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function inferIndexes(header) {
  return {
    date: findIndex(header, DATE_HEADERS),
    merchant: findIndex(header, MERCHANT_HEADERS),
    amount: findIndex(header, AMOUNT_HEADERS),
    credit: findIndex(header, CREDIT_HEADERS)
  };
}

function sanitizeIndexes(indexes) {
  return {
    date: toIndex(indexes.date),
    merchant: toIndex(indexes.merchant),
    amount: toIndex(indexes.amount),
    credit: toIndex(indexes.credit)
  };
}

function toIndex(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : -1;
}

function rowLooksLikeManualHeader(rows, indexes, hasManualMapping) {
  if (!hasManualMapping || rows.length < 2 || indexes.date < 0) return false;
  return !parseDate(rows[0]?.[indexes.date]) && Boolean(parseDate(rows[1]?.[indexes.date]));
}

function normalizeRow(row, indexes, sourceRow, rejectedRows = [], dateOrder = "auto") {
  const date = parseDate(row[indexes.date], dateOrder);
  const merchant = row[indexes.merchant]?.trim();
  const debit = parseAmount(row[indexes.amount]);
  const credit = indexes.credit >= 0 ? parseAmount(row[indexes.credit]) : 0;
  const amount = normalizeSignedAmount(debit, credit, indexes.credit >= 0);

  if (!date || !merchant || Number.isNaN(amount)) {
    rejectedRows.push({
      sourceRow,
      reason: getRejectionReason(date, merchant, amount),
      raw: row
    });
    return null;
  }
  return {
    id: `${date}-${sourceRow}-${merchant}`,
    date,
    merchant,
    amount: roundMoney(amount),
    sourceRow
  };
}

function normalizeSignedAmount(debit, credit, hasCreditColumn) {
  if (Number.isNaN(debit) || Number.isNaN(credit)) return Number.NaN;
  if (hasCreditColumn && credit > 0 && debit === 0) return credit;
  if (hasCreditColumn && debit > 0 && credit === 0) return -debit;
  return debit;
}

function createDiagnostics(firstRow, hasHeader, indexes, rejectedRows, transactions, isEmpty = false, hasManualMapping = false) {
  return {
    isEmpty,
    error: "",
    warnings: [],
    hasHeader,
    hasManualMapping,
    dateOrder: "auto",
    availableColumns: firstRow.map((cell, index) => ({
      index,
      label: cell || `column ${index + 1}`
    })),
    columns: {
      date: describeColumn(firstRow, indexes.date),
      merchant: describeColumn(firstRow, indexes.merchant),
      amount: describeColumn(firstRow, indexes.amount),
      credit: describeColumn(firstRow, indexes.credit)
    },
    rejectedRows,
    previewRows: transactions.slice(0, 5).map((transaction) => ({
      date: transaction.date,
      merchant: transaction.merchant,
      amount: transaction.amount,
      sourceRow: transaction.sourceRow
    }))
  };
}

function describeColumn(firstRow, index) {
  if (index < 0) return "not found";
  const label = firstRow[index] || `column ${index + 1}`;
  return `${label} (column ${index + 1})`;
}

function getRejectionReason(date, merchant, amount) {
  if (!date) return "missing or unreadable date";
  if (!merchant) return "missing merchant";
  if (Number.isNaN(amount)) return "missing or unreadable amount";
  return "unreadable row";
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

function findIndex(header, candidates) {
  return header.findIndex((cell) => candidates.includes(cell));
}

function parseDate(value, dateOrder = "auto") {
  const text = String(value || "").trim();
  if (!text) return "";
  const yearFirst = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yearFirst) return toIsoDate(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));

  const numeric = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (!numeric) return "";
  const first = Number(numeric[1]);
  const second = Number(numeric[2]);
  const year = Number(numeric[3]);
  const order = dateOrder === "auto"
    ? first > 12 ? "dmy" : second > 12 ? "mdy" : "mdy"
    : dateOrder;
  const month = order === "dmy" ? second : first;
  const day = order === "dmy" ? first : second;
  return toIsoDate(year, month, day);
}

function resolveDateOrder(values, requestedOrder) {
  const requested = DATE_ORDERS.has(requestedOrder) ? requestedOrder : "auto";
  if (requested !== "auto") return { order: requested, ambiguous: false };

  let hasAmbiguousNumericDate = false;
  for (const value of values) {
    const text = String(value || "").trim();
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(text)) return { order: "ymd", ambiguous: false };
    const match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12) return { order: "dmy", ambiguous: false };
    if (second > 12) return { order: "mdy", ambiguous: false };
    hasAmbiguousNumericDate = true;
  }
  return { order: "mdy", ambiguous: hasAmbiguousNumericDate };
}

function toIsoDate(year, month, day) {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseAmount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const text = String(value).replace(/[$,\s]/g, "");
  const isParenNegative = text.startsWith("(") && text.endsWith(")");
  const numeric = Number(text.replace(/[()]/g, ""));
  if (Number.isNaN(numeric)) return Number.NaN;
  return isParenNegative ? -Math.abs(numeric) : numeric;
}

function groupBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function groupBySimilarAmount(group) {
  const sorted = [...group].sort((a, b) => a.chargeAmount - b.chargeAmount);
  const buckets = [];
  for (const item of sorted) {
    const bucket = buckets.find((candidate) => Math.abs(candidate[0].chargeAmount - item.chargeAmount) <= Math.max(2, item.chargeAmount * 0.08));
    if (bucket) bucket.push(item);
    else buckets.push([item]);
  }
  return buckets.map((bucket) => bucket.sort((a, b) => a.date.localeCompare(b.date)));
}

function getIntervals(group) {
  const intervals = [];
  for (let index = 1; index < group.length; index += 1) {
    intervals.push(daysBetween(group[index - 1].date, group[index].date));
  }
  return intervals;
}

function inferCadence(intervals, group) {
  if (group.length === 2 && intervals[0] >= 330 && intervals[0] <= 400) return "annual";
  if (intervals.some((interval) => interval >= 330 && interval <= 400)) return "annual";
  if (intervals.length === 0 && group[0]?.chargeAmount >= 40) return "single large charge";
  const median = getMedian(intervals);
  if (median >= 25 && median <= 35) return "monthly";
  if (median >= 82 && median <= 100) return "quarterly";
  if (median >= 6 && median <= 8) return "weekly";
  if (median >= 13 && median <= 16) return "biweekly";
  return "irregular";
}

function scoreConfidence(group, intervals, cadence) {
  let score = 0;
  if (group.length >= 2) score += 25;
  if (group.length >= 3) score += 20;
  if (group.length >= 4) score += 10;
  if (["monthly", "annual", "quarterly", "weekly", "biweekly"].includes(cadence)) score += 25;
  if (intervals.length && intervalVariance(intervals) <= 6) score += 15;
  if (amountVariance(group) <= 0.02) score += 10;
  if (group.some((item) => /trial|plus|premium|annual|monthly/i.test(item.merchant))) score += 8;
  return Math.min(99, score);
}

function explainFinding(group, intervals, cadence, confidence) {
  const amountSpread = Math.max(...group.map((item) => item.chargeAmount)) - Math.min(...group.map((item) => item.chargeAmount));
  const explanation = [
    `${group.length} matching charge${group.length === 1 ? "" : "s"} after merchant cleanup`,
    `cadence looks ${cadence}`,
    `amount spread is ${formatMoney(amountSpread)}`,
    `confidence score ${confidence}/99`
  ];
  if (intervals.length) explanation.push(`observed gaps: ${intervals.join(", ")} days`);
  return explanation;
}

function suggestAction(group, cadence, confidence) {
  const annual = estimateAnnualCost(group, cadence);
  if (confidence < 55) return "Investigate";
  if (annual >= 240) return "Downgrade";
  if (group.some((item) => /trial/i.test(item.merchant))) return "Check trial";
  return "Keep";
}

function estimateAnnualCost(group, cadence) {
  const amount = average(group.map((item) => item.chargeAmount));
  const multiplier = {
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    quarterly: 4,
    annual: 1,
    irregular: group.length,
    "single large charge": 1
  }[cadence] || group.length;
  return roundMoney(amount * multiplier);
}

function estimateNextRenewal(group, cadence) {
  const days = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 91,
    annual: 365
  }[cadence];
  if (!days) return "";
  const last = new Date(`${group.at(-1).date}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() + days);
  return last.toISOString().slice(0, 10);
}

function findDuplicateMonthlyPlans(group) {
  const buckets = groupBySimilarAmount(group);
  if (buckets.length < 2) return [];
  const monthlyBuckets = buckets.filter((bucket) => inferCadence(getIntervals(bucket), bucket) === "monthly");
  if (monthlyBuckets.length < 2) return [];
  return [{
    merchant: titleCase(group[0].merchantKey),
    riskScore: Math.min(99, monthlyBuckets.length * 30 + group.length * 4),
    reason: `${monthlyBuckets.length} recurring amount patterns found for the same cleaned merchant`,
    patterns: monthlyBuckets.map((bucket) => ({
      amount: average(bucket.map((item) => item.chargeAmount)),
      count: bucket.length
    }))
  }];
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

function getMedian(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function average(values) {
  if (values.length === 0) return 0;
  return roundMoney(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function intervalVariance(intervals) {
  if (intervals.length <= 1) return 0;
  const median = getMedian(intervals);
  return Math.max(...intervals.map((interval) => Math.abs(interval - median)));
}

function amountVariance(group) {
  const amounts = group.map((item) => item.chargeAmount);
  const avg = average(amounts);
  if (avg === 0) return 0;
  return (Math.max(...amounts) - Math.min(...amounts)) / avg;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return `$${roundMoney(value).toFixed(2)}`;
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createInputError(message) {
  const diagnostics = createDiagnostics([], false, { date: 0, merchant: 1, amount: 2, credit: -1 }, [], [], true, false);
  diagnostics.error = message;
  return { transactions: [], diagnostics };
}

function dateAtOffset(reference, days) {
  const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatMegabytes(characters) {
  return (characters / 1_000_000).toFixed(0);
}
