const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("site/markets.js", "utf8");
test("le module Marchés accepte le flux OHLC sans accès moteur", () => {
  const window = { KPChartPrefs: { read: () => ({ pair: "XBTUSDC", tf: "1h", bars: 120 }), write: () => {} }, sessionStorage: null };
  const document = { addEventListener() {}, getElementById() { return null; } };
  vm.runInNewContext(source, { window, document, localStorage: { getItem: () => null }, Intl, Map, Promise, setTimeout, clearTimeout, setInterval, Date });
  assert.equal(typeof window.KPMarkets.onState, "function");
  assert.equal(window.KPMarkets.selectedPair(), "XBTUSDC");
});
test("le flux OHLC conserve le dernier cours réel et les indicateurs existants", () => {
  assert.match(source, /channel: "ohlc"/);
  assert.match(source, /sCandle\.update\(data\.candles\[i\]\)/);
  assert.match(source, /legendData = \{ bars, data, idx:/);
  assert.match(source, /closeCandleStream\(\)/);
});
