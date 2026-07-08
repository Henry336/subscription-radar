import { readFile } from "node:fs/promises";
import { analyzeSubscriptions, parseTransactions, sampleCsv } from "../src/detector.js";

const requiredFiles = ["index.html", "src/app.js", "src/detector.js", "src/planning.js", "src/timeline.js", "src/styles.css"];

await Promise.all(requiredFiles.map((file) => readFile(file, "utf8")));

const analysis = analyzeSubscriptions(parseTransactions(sampleCsv));
if (analysis.subscriptions.length < 3) {
  throw new Error("Expected sample data to produce at least three subscription candidates.");
}

console.log(`Build check passed with ${analysis.subscriptions.length} sample candidates.`);
