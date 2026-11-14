// Tests du calcul des ordres du dash (site/app.js), sans réseau ni navigateur : node --test tests/site/*.test.js
// Les valeurs attendues viennent du moteur (engine/run.py, execute_fill) sur les ordres O0001-O0003 du 13/11/2026.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const noop = () => {};
const el = () => ({ textContent: "", className: "", hidden: false, title: "", href: "", style: { setProperty: noop }, classList: { add: noop, remove: noop, toggle: noop }, tBodies: [{}], querySelectorAll: () => [] });
const ctx = { window: { addEventListener: noop }, document: { getElementById: el, addEventListener: noop, querySelectorAll: () => [] },
  location: { hostname: "localhost" }, Intl, Math, Date, JSON, console, setTimeout, setInterval: noop, fetch: () => Promise.reject(new Error("hors ligne")) };
vm.createContext(ctx);
try { vm.runInContext(fs.readFileSync(path.join(__dirname, "../../site/app.js"), "utf8"), ctx); } catch (e) { /* DOM absent : seules les fonctions pures nous intéressent */ }
const orderMath = ctx.window.KP_ORDER_MATH;

const st = { fees: { maker: 0.004, taker: 0.008, slippage: 0.001 }, positions: {},
  pairs: { XBTUSDC: { pair_decimals: 2 }, ETHUSDC: { pair_decimals: 2 }, SOLUSDC: { pair_decimals: 2 } } };
const buy = (id, pair, qty, price, sl, tp) => ({ id, pair, side: "buy", qty, price, stop_loss: sl, take_profit: tp });

test("achats limites : engagé, perte max, gain visé comme le moteur", () => {
  const cases = [
    [buy("O0001", "XBTUSDC", 0.01491041, 66800, 63500, 71500), 1000.00, -61.70, 61.83],
    [buy("O0002", "ETHUSDC", 0.37284019, 1870, 1755, 2040), 700.00, -51.55, 57.55],
    [buy("O0003", "SOLUSDC", 6.59613202, 75.5, 70.5, 83), 500.00, -39.15, 45.29],
  ];
  for (const [o, engaged, loss, gain] of cases) {
    const m = orderMath(o, st, null);
    assert.strictEqual(m.engaged, engaged, o.id + " engagé");
    assert.strictEqual(m.loss, loss, o.id + " perte max");
    assert.strictEqual(m.gain, gain, o.id + " gain visé");
    assert.ok(Math.abs(m.rr - gain / -loss) < 1e-12);
  }
});

test("stop exécuté au stop -0,1 %, arrondi aux décimales de la paire", () => {
  assert.strictEqual(orderMath(buy("O9", "SOLUSDC", 1, 75.5, 70.5, null), st, null).stopPx, 70.43);
});

test("distance au déclenchement et absence de stop", () => {
  const m = orderMath(buy("O9", "XBTUSDC", 0.01, 66000, null, null), st, 68000);
  assert.ok(Math.abs(m.dLimit - (66000 - 68000) / 68000) < 1e-12);
  assert.strictEqual(m.loss, null);
  assert.strictEqual(m.rr, null);
});

test("vente de sortie : base = prix de revient de la position", () => {
  const s2 = Object.assign({}, st, { positions: { XBTUSDC: { qty: 0.01, avg_cost: 67000 } } });
  const m = orderMath({ id: "O9", pair: "XBTUSDC", side: "sell", qty: 0.01, price: 70000, stop_loss: 64000, parent: "O1" }, s2, 68000);
  assert.strictEqual(m.engaged, 670);
  assert.strictEqual(m.gain, Math.round((700 - 700 * 0.004 - 670) * 100) / 100);
  assert.strictEqual(m.loss, Math.round((639.36 - 639.36 * 0.008 - 670) * 100) / 100);
});

test("environnement déduit de l'adresse (un seul site Netlify)", () => {
  const env = ctx.window.KP_ENV_FROM_HOST;
  assert.strictEqual(env("kraken-paper.netlify.app"), "prod");
  assert.strictEqual(env("preprod--kraken-paper.netlify.app"), "preprod");
  assert.strictEqual(env("feature-ordres--kraken-paper.netlify.app"), "feature");
  assert.strictEqual(env("localhost"), null);
});
