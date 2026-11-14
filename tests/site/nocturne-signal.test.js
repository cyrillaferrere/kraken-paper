const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");
test("la restauration reprend l'identité graphique de production", () => {
  const css = read("site/style.css");
  const html = read("site/index.html");
  assert.match(css, /--ac:\s*#7c5cff/);
  assert.match(css, /--ac2:\s*#22d3ee/);
  assert.match(html, /Simulation de trading — argent fictif, prix réels Kraken/);
  assert.doesNotMatch(html, /workspace-premium\.css|analog\.css/);
  assert.match(html, /src="navigation\.js"/);
});
test("le chandelier reprend la palette de production sans toucher aux séries", () => {
  const market = read("site/markets.js");
  assert.match(market, /ac: "#7c5cff"/);
  assert.match(market, /ma50: "#f472b6"/);
  assert.match(market, /CandlestickSeries/);
  assert.match(market, /LineSeries/);
});
