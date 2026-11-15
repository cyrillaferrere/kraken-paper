const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("site/markets.js", "utf8");
const window = {
  KPChartPrefs: { read: () => ({ pair: "XBTUSDC", tf: "1h", bars: 120 }), write: () => {} },
  sessionStorage: null,
};
const document = { addEventListener() {}, getElementById() { return null; } };
vm.runInNewContext(source, { window, document, localStorage: { getItem: () => null }, Intl, Map, Promise, setTimeout, setInterval });
const build = window.KPMarketOrderLines;
const buy = { id: "O0015", pair: "XBTUSDC", side: "buy", price: 63400, stop_loss: 62000, take_profits: [{ price: 66000 }, { price: 68000 }] };
test("achat limite en attente : seule l'entrée est visible", () => {
  const lines = build([buy], "XBTUSDC");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].price, 63400);
});
test("survol ou toucher : sorties conditionnelles grises, puis masquées", () => {
  const lines = build([buy], "XBTUSDC", "O0015");
  assert.deepEqual(Array.from(lines, l => l.price), [63400, 62000, 66000, 68000]);
  assert.ok(lines.slice(1).every(l => l.color === "#9299a9" && l.lineStyle === 3 && l.label.endsWith("si l'achat passe")));
  assert.equal(build([buy], "XBTUSDC").length, 1);
});
test("achat exécuté : TP et stop sont actifs dans l'ordre de vente", () => {
  const filled = { id: "O0016", pair: "XBTUSDC", side: "sell", parent: "O0015", stop_loss: 62000, take_profits: [{ price: 66000 }] };
  const lines = build([filled], "XBTUSDC");
  assert.deepEqual(Array.from(lines, l => l.price), [66000, 62000]);
  assert.ok(lines.every(l => !l.conditional));
});
test("vente active indépendante : affichage inchangé", () => {
  const lines = build([{ id: "O0020", pair: "XBTUSDC", side: "sell", price: 70000, stop_loss: 65000 }], "XBTUSDC");
  assert.deepEqual(Array.from(lines, l => l.label), ["O0020 vente limite", "O0020 stop"]);
});
