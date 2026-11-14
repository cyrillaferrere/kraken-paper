const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const html = read("site/index.html");
const analog = read("site/analog.css");
const market = read("site/markets.js");

test("la couche analogique reste séparée et le moteur PAPER est intact", () => {
  assert.match(html, /href="style\.css"[\s\S]*href="analog\.css"/);
  assert.match(html, /id="exp-bar"/);
  assert.match(html, /class="analog-scale"/);
  assert.match(html, /id="k-value"/);
  assert.match(html, /id="mchart"/);
  assert.equal(read("VERSION").trim(), "0.3.1");
});

test("le VU d'exposition utilise la jauge existante, sans valeur inventée", () => {
  assert.match(analog, /\.exp-bar::after/);
  assert.match(analog, /\.eseg-free, \.sw-free/);
  assert.match(analog, /\.eseg-inv, \.sw-inv/);
  assert.match(html, /0<\/span><span>EXPOSITION \/ 50<\/span><span>100 %/);
  assert.doesNotMatch(html, /fake[-_]?(value|price|signal)/i);
});

test("Graphite Signal : identité lisible et accessible", () => {
  assert.match(analog, /--ac: #b6ff52/);
  assert.match(analog, /--signal-sans:/);
  assert.match(analog, /--dn: #ff7769/);
  assert.match(html, /GRAPHITE \/ SIGNAL/);
  assert.match(analog, /var\(--analog-mono\)/);
  assert.match(analog, /prefers-reduced-motion:reduce/);
  assert.match(analog, /focus-visible/);
  assert.match(market, /ac: "#b6ff52"/);
  assert.match(market, /CandlestickSeries/);
});
