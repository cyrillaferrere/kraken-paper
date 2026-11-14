const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../../site/index.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "../../site/markets.js"), "utf8");

test("chart range controls are unique and accessible", () => {
  for (const n of [60, 120, 240]) {
    assert.equal((html.match(new RegExp('data-bars="' + n + '"', "g")) || []).length, 1);
  }
  assert.match(html, /id="chart-reset"/);
  assert.match(html, /id="chart-view-note"[^>]*aria-live="polite"/);
  assert.match(js, /button\.setAttribute\("aria-pressed", String\(Number\(button\.dataset\.bars\) === viewBars\)\)/);
});

test("chart range is a view-only operation and live refresh preserves viewport", () => {
  const handler = js.slice(js.indexOf('document.querySelectorAll(".chart-range").forEach((button) => button.addEventListener'));
  assert.match(handler, /applyChartRange\(\)/);
  assert.doesNotMatch(handler.slice(0, handler.indexOf('    \$\("pair-chips"\)')), /loadChart\(/);
  assert.match(js, /setVisibleLogicalRange\(\{ from: Math\.max\(0, bars\.length - viewBars\)/);
  assert.match(js, /Rafraîchissement : on ne pousse que la bougie en cours et les nouvelles, sans déplacer la vue/);
});
