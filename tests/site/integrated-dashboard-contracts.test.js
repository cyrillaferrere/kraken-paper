const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../../site");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const html = read("index.html"), app = read("app.js"), markets = read("markets.js");

test("dashboard dependencies load in their required order", () => {
  const scripts = ["lib.js", "data-validators.js", "ohlc-utils.js", "chart-preferences.js",
    "history-utils.js", "markets.js", "extras.js", "app.js", "navigation.js",
    "workspace.js", "portfolio-workspace.js", "journal-workspace.js"];
  let last = -1;
  for (const name of scripts) {
    assert.ok(fs.existsSync(path.join(root, name)), "missing " + name);
    const pos = html.indexOf('src="' + name + '"');
    assert.ok(pos > last, "wrong dependency order for " + name);
    last = pos;
  }
});

test("dashboard data snapshot remains atomic and read only", () => {
  const start = app.indexOf("async function loadState()");
  const end = app.indexOf("function pairsNeeded()", start);
  const block = app.slice(start, end);
  assert.match(block, /const nextEquity = window\.KPData\.equity\(e\)/);
  assert.match(block, /const nextJournal = window\.KPData\.journal\(j\)/);
  assert.ok(block.indexOf("S = nextState") > block.indexOf("const nextJournal"));
  assert.match(block, /if \(stateLoading\) return/);
  assert.match(block, /finally \{\s*stateLoading = false/);
  assert.doesNotMatch(block, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/);
});

test("market chart follows fallback pair on later state updates", () => {
  const block = markets.slice(markets.indexOf("onState(c) {"));
  assert.match(block, /chartPairReset = true/);
  assert.match(block, /if \(chartPairReset\) \{ hoveredCandleTime = null; loadChart\(\); \}/);
  assert.match(block, /if \(trackedPairs\(\)\.join\("\|"\) !== lastTrackedSignature\) refreshMetrics\(\)/);
});

test("market UI controls and status targets exist once", () => {
  for (const id of ["chart-refresh", "chart-updated", "chart-reset", "chart-view-note",
    "pair-chips", "tf-tabs", "markers", "markers-load", "markers-note", "mchart-wrap"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, id);
  }
});
