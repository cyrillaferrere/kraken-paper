// v0.3.6.1 : le graphique d'une paire ne doit jamais garder les niveaux ni l'échelle d'une autre paire
// (bug du 18/11 : XRP/USDC affiché sur l'échelle 63 000–71 000 du BTC).
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
const createLevelSync = window.KPChartLevelSync;

const orders = [
  { id: "O0024", pair: "XBTUSDC", side: "sell", stop_loss: 61200, take_profits: [{ price: 70000 }, { price: 75000 }] },
  { id: "O0017", pair: "XBTUSDC", side: "buy", price: 62600, stop_loss: 61200, take_profits: [{ price: 70000 }] },
  { id: "O0025", pair: "XRPUSDC", side: "buy", price: 0.966, stop_loss: 0.928, take_profits: [{ price: 1.05 }] },
];
function fakeChart() {
  const live = new Set(), scale = { opts: [] };
  const series = {
    createPriceLine(o) { const l = { o }; live.add(l); return l; },
    removePriceLine(l) { assert.ok(live.has(l), "ligne déjà retirée"); live.delete(l); },
  };
  scale.applyOptions = (o) => scale.opts.push(o);
  return { series, scale, live, drawn: () => [...live].map((l) => l.o.price).sort((a, b) => a - b) };
}
const pru = (pair, price) => ({ pair, price, color: "#888", lineStyle: 1, label: "PRU" });

test("les lignes d'ordre portent la paire et ne contiennent que la paire demandée", () => {
  const xrp = build(orders, "XRPUSDC");
  assert.deepEqual(Array.from(xrp, (l) => l.price), [0.966]);
  assert.ok(xrp.every((l) => l.pair === "XRPUSDC"));
  assert.ok(build(orders, "XBTUSDC").every((l) => l.pair === "XBTUSDC"));
});

test("XRP : aucun niveau BTC n'est tracé ni compté dans l'échelle", () => {
  const c = fakeChart(), sync = createLevelSync(() => c.series, () => c.scale);
  // Même si une ligne d'une autre paire arrive par erreur, elle est filtrée.
  const vis = sync.sync("XRPUSDC", [pru("XBTUSDC", 64478), ...build(orders, "XBTUSDC"), ...build(orders, "XRPUSDC")], true);
  assert.deepEqual(Array.from(vis, (l) => l.price), [0.966]);
  assert.deepEqual(c.drawn(), [0.966]);
  assert.deepEqual(Array.from(sync.prices()), [0.966]);
  assert.ok(Math.max(...sync.prices()) < 2, "l'échelle XRP ne doit pas monter vers les prix BTC");
});

test("passage BTC → XRP : les anciennes lignes sont retirées et l'échelle repart en autoscale", () => {
  const c = fakeChart(), sync = createLevelSync(() => c.series, () => c.scale);
  sync.sync("XBTUSDC", [pru("XBTUSDC", 64478), ...build(orders, "XBTUSDC")], true);
  assert.deepEqual(c.drawn(), [61200, 62600, 64478, 70000, 75000]);
  // Changement de paire (loadChart) : on vide avant de charger les bougies XRP.
  c.scale.opts.length = 0;
  sync.clear();
  assert.equal(c.live.size, 0);
  assert.deepEqual(Array.from(sync.prices()), [], "aucun prix BTC ne reste dans l'autoscale pendant setData");
  assert.ok(c.scale.opts.some((o) => o.autoScale === true), "l'échelle doit être remise en autoscale");
  c.scale.opts.length = 0;
  sync.sync("XRPUSDC", build(orders, "XRPUSDC"), true);
  assert.deepEqual(c.drawn(), [0.966]);
  assert.ok(c.scale.opts.some((o) => o.autoScale === true), "l'échelle est recalculée quand les niveaux changent");
});

test("rafraîchissement sans changement de niveau : rien n'est recréé", () => {
  const c = fakeChart(), sync = createLevelSync(() => c.series, () => c.scale);
  sync.sync("XRPUSDC", build(orders, "XRPUSDC"), true);
  const before = [...c.live];
  c.scale.opts.length = 0;
  sync.sync("XRPUSDC", build(orders, "XRPUSDC"), true);
  assert.deepEqual([...c.live], before);
  assert.equal(c.scale.opts.length, 0);
});

test("ordres masqués : aucune ligne, aucun prix dans l'échelle", () => {
  const c = fakeChart(), sync = createLevelSync(() => c.series, () => c.scale);
  sync.sync("XBTUSDC", build(orders, "XBTUSDC"), true);
  sync.sync("XBTUSDC", build(orders, "XBTUSDC"), false);
  assert.equal(c.live.size, 0);
  assert.deepEqual(Array.from(sync.prices()), []);
});

test("markets.js vide les niveaux avant setData lors d'un changement de paire ou de TF", () => {
  const i = source.indexOf("if (switching || !shown.lastT)");
  const block = source.slice(i, source.indexOf("sCandle.setData(", i));
  assert.match(block, /levels\.clear\(\)/);
  assert.doesNotMatch(source, /levelPrices|priceLines\s*=/, "plus d'état global de niveaux hors du synchroniseur");
});

test("Recentrer remet l'échelle de prix en automatique", () => {
  const i = source.indexOf('$("chart-reset").addEventListener');
  const block = source.slice(i, source.indexOf("});", i));
  assert.match(block, /autoScale:\s*true/);
});
