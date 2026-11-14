const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../site");
const script = fs.readFileSync(path.join(root, "chart-preferences.js"), "utf8");
const market = fs.readFileSync(path.join(root, "markets.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ctx = { window: {} };
vm.runInNewContext(script, ctx);
const { normalize, read, write } = ctx.window.KPChartPrefs;

test("chart defaults are 1h / 120 candles / BTC and invalid settings fall back", () => {
  assert.equal(normalize(null).tf, "1h");
  assert.equal(normalize(null).bars, 120);
  assert.equal(normalize(null).pair, "XBTUSDC");
  assert.equal(normalize({ pair: "<img>", tf: "2h", bars: 999 }).pair, "XBTUSDC");
  assert.equal(normalize({ pair: "<img>", tf: "2h", bars: 999 }).tf, "1h");
  assert.equal(normalize({ pair: "<img>", tf: "2h", bars: 999 }).bars, 120);
});

test("chart settings persist in session only and recover from unavailable storage", () => {
  const data = new Map();
  const storage = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  assert.equal(write(storage, { pair: "ETHUSDC", tf: "4h", bars: 240 }), true);
  assert.equal(read(storage).pair, "ETHUSDC");
  assert.equal(read(storage).tf, "4h");
  assert.equal(read(storage).bars, 240);
  assert.equal(read({ getItem() { throw Error("blocked"); } }).tf, "1h");
  assert.equal(write({ setItem() { throw Error("blocked"); } }, {}), false);
});

test("market toolbar exposes explicit refresh and data-read timestamp", () => {
  assert.ok(html.indexOf('src="chart-preferences.js"') < html.indexOf('src="markets.js"'));
  assert.match(html, /id="chart-refresh"/);
  assert.match(html, /id="chart-updated"/);
  assert.match(market, /\$\("chart-refresh"\)\.addEventListener\("click", \(\) => loadChart\(true\)\)/);
  assert.match(market, /stamp\.textContent = "Bougies lues à "/);
  assert.match(market, /if \(!trackedPairs\(\)\.includes\(selected\.pair\)\)/);
  assert.match(market, /viewBars = Number\(button\.dataset\.bars\);\s*saveChartPrefs\(\)/);
  assert.match(market, /selected\.tf = tf; saveChartPrefs\(\); loadChart\(\)/);
});
