const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const s = fs.readFileSync(path.join(__dirname, "../../site/markets.js"), "utf8");

test("scanner progress reflects completed requests instead of only rendered rows", () => {
  assert.match(s, /scannerCompleted = completed/);
  assert.match(s, /scannerTotal = pairs\.length/);
  assert.match(s, /Analyse en cours : \$\{scannerCompleted\} \/ \$\{scannerTotal\}/);
  assert.match(s, /Données indisponibles : \$\{left\} \/ \$\{all\.length\}/);
});

test("scanner stops showing loading when the wave finishes", () => {
  assert.match(s, /finally \{\s*scannerBusy = false;\s*renderTable\(\)/);
  assert.match(s, /if \(scannerBusy\) \{ scannerPending = true; return; \}/);
});

test("new tracked pairs refresh immediately after a portfolio snapshot", () => {
  assert.match(s, /lastTrackedSignature = pairs\.join\("\|"\)/);
  assert.match(s, /if \(trackedPairs\(\)\.join\("\|"\) !== lastTrackedSignature\) refreshMetrics\(\)/);
});

test("benchmark stays first and altcoin requests remain bounded", () => {
  const btc = s.indexOf("await computeMetrics(BENCH)");
  const workers = s.indexOf("const workers = Array.from");
  assert.ok(btc >= 0 && workers > btc);
  assert.match(s, /Math\.min\(2, queue\.length\)/);
});
