const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../../site/markets.js"), "utf8");
const start = source.indexOf("  let scannerBusy = false, scannerPending = false;");
const end = source.indexOf("  // ---------- interactions ----------", start);
const scanner = source.slice(start, end);

test("market scanner prevents overlapping waves and releases lock", () => {
  assert.ok(start >= 0 && end > start);
  assert.match(scanner, /if \(scannerBusy\) \{ scannerPending = true; return; \}/);
  assert.match(scanner, /scannerBusy = true/);
  assert.match(scanner, /finally \{\s*scannerBusy = false;/);
  assert.match(scanner, /while \(scannerPending\)/);
});

test("BTC benchmark completes before concurrent altcoin metrics", () => {
  const btc = scanner.indexOf("await computeMetrics(BENCH)");
  const workers = scanner.indexOf("const workers = Array.from");
  assert.ok(btc >= 0 && workers > btc);
  assert.match(scanner, /const queue = pairs\.filter\(\(x\) => x !== BENCH\)/);
  assert.match(scanner, /Math\.min\(2, queue\.length\)/);
  assert.match(scanner, /await Promise\.all\(workers\)/);
});

test("scanner avoids a DOM render for every market response", () => {
  assert.match(scanner, /completed % 4 === 0 \|\| completed === pairs\.length/);
  assert.doesNotMatch(scanner, /await computeMetrics\(p\); failed\.delete\(p\); \} catch.*\n\s*renderTable\(\)/);
  assert.match(scanner, /if \(!metrics\[p\]\) failed\.add\(p\)/);
});
