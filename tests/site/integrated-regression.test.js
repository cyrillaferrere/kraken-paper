const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../../site");
const portfolio = fs.readFileSync(path.join(root, "portfolio-workspace.js"), "utf8");
const markets = fs.readFileSync(path.join(root, "markets.js"), "utf8");

test("sorting disconnects observer only while moving rows and always reconnects", () => {
  assert.match(portfolio, /const observer = new MutationObserver\(schedule\)/);
  assert.match(portfolio, /observer\.disconnect\(\);\s*try\s*\{/);
  assert.match(portfolio, /finally\s*\{\s*observe\(\);\s*\}/);
  assert.doesNotMatch(portfolio, /let sorting = false/);
});

test("candle range label is grounded in available data and updated after load", () => {
  assert.match(markets, /Math\.min\(viewBars, available\)/);
  assert.match(markets, /bougies disponibles/);
  assert.match(markets, /En attente des bougies/);
  assert.match(markets, /shown = \{ key, lastT: bars\.length \? bars\[bars\.length - 1\]\.t : null, bars \};[\s\S]*?syncChartRange\(\)/);
});

test("range change does not force a remote candle fetch", () => {
  const start = markets.indexOf('document.querySelectorAll(".chart-range").forEach((button) => button.addEventListener("click"');
  const end = markets.indexOf('    $("pair-chips")', start);
  assert.ok(start > 0 && end > start);
  assert.doesNotMatch(markets.slice(start, end), /loadChart\(/);
});
