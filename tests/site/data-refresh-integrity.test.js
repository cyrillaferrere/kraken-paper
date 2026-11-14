const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = fs.readFileSync(path.join(__dirname, "../../site/app.js"), "utf8");

test("state refresh is single-flight and always releases lock", () => {
  assert.match(app, /let stateLoading = false;/);
  assert.match(app, /async function loadState\(\) \{\s*if \(stateLoading\) return;\s*stateLoading = true;/);
  assert.match(app, /finally \{\s*stateLoading = false;\s*\}/);
});

test("portfolio, equity and journal parse before publication", () => {
  const parse = app.indexOf("const nextState = JSON.parse(p)");
  const equity = app.indexOf("const nextEquity =");
  const journal = app.indexOf("const nextJournal =");
  const commit = app.indexOf("S = nextState;");
  assert.ok(parse >= 0 && parse < equity && equity < journal && journal < commit);
  assert.match(app, /S = nextState;\s*equity = nextEquity;\s*journal = nextJournal;/);
  assert.match(app, /gh\.sha = null;\s*gh\.etag = null;/);
  assert.match(app, /portefeuille incomplet/);
});

test("out-of-order price responses cannot overwrite newer prices or error status", () => {
  assert.match(app, /const request = \+\+priceRequest;/);
  assert.match(app, /if \(request !== priceRequest\) return;\s*live = out/);
  assert.match(app, /if \(request === priceRequest\) liveOk = false;/);
});

test("live ticker updates do not rebuild historical journal or performance SVG", () => {
  assert.match(app, /renderPositions\(\); renderOrders\(\);\s*if \(stateChanged\) \{ renderTrades\(\); renderJournal\(\); renderChart\(\); \}/);
  assert.match(app, /journalLimit = event\.target\.value === "all" \? Infinity : Number\(event\.target\.value\);\s*renderJournal\(\)/);
  assert.match(app, /setEquityPeriod\(b\.dataset\.period\)/);
});
