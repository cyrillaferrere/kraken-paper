// Tests des fonctions pures du dash (site/lib.js) : node --test tests/site/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const L = require("../../site/lib.js");

// orderMath vient de site/app.js (mêmes bouchons DOM que order_math.test.js)
const noop = () => {};
const el = () => ({ textContent: "", className: "", hidden: false, title: "", href: "", style: { setProperty: noop }, classList: { add: noop, remove: noop, toggle: noop }, tBodies: [{}], querySelectorAll: () => [] });
const ctx = { window: { addEventListener: noop }, document: { getElementById: el, addEventListener: noop, querySelectorAll: () => [] },
  location: { hostname: "localhost" }, Intl, Math, Date, JSON, console, setTimeout, setInterval: noop, fetch: () => Promise.reject(new Error("hors ligne")) };
vm.createContext(ctx);
try { vm.runInContext(fs.readFileSync(path.join(__dirname, "../../site/app.js"), "utf8"), ctx); } catch (e) { /* DOM absent */ }
const orderMath = ctx.window.KP_ORDER_MATH;
const norm = (s) => s.replace(/[\u202f\u00a0]/g, " ");

const fees = { maker: 0.004, taker: 0.008, slippage: 0.001 };
const pairs = { XBTUSDC: { pair_decimals: 2 }, ETHUSDC: { pair_decimals: 2 }, SOLUSDC: { pair_decimals: 2 } };
const buy = (id, pair, qty, price, sl, tp) => ({ id, pair, side: "buy", qty, price, stop_loss: sl, take_profit: tp });
const S0 = { cash: 6606.42, fees, pairs, positions: {}, open_orders: [
  buy("O0001", "XBTUSDC", 0.01491041, 66800, 63500, 71500),
  buy("O0002", "ETHUSDC", 0.37284019, 1870, 1755, 2040),
  buy("O0003", "SOLUSDC", 6.59613202, 75.5, 70.5, 83)] };

test("md : le HTML est échappé, seuls les liens http(s) passent", () => {
  const h = L.md("# Titre\n\n<script>alert(1)</script> **gras** et *ital* `x<y`\n\n- a\n- [lien](https://ex.com/a?b=1&c=2)\n- [bad](javascript:alert(1))\n\n---\n> cite");
  assert.ok(!h.includes("<script>"));
  assert.ok(h.includes("&lt;script&gt;"));
  assert.ok(h.includes("<h3>Titre</h3>"));
  assert.ok(h.includes("<strong>gras</strong>") && h.includes("<em>ital</em>") && h.includes("<code>x&lt;y</code>"));
  assert.ok(h.includes('<a href="https://ex.com/a?b=1&amp;c=2" rel="noopener noreferrer" target="_blank">lien</a>'));
  assert.ok(!/href="javascript/.test(h));
  assert.ok(h.includes("<hr>") && h.includes("<blockquote>cite</blockquote>") && h.includes("<ul><li>a</li>"));
  assert.ok(!L.md('[x](https://a.b/" onmouseover="alert(1))').includes('" onmouseover'));
});

test("md : docs/LESSONS.md se rend sans HTML brut", () => {
  const h = L.md(fs.readFileSync(path.join(__dirname, "../../docs/LESSONS.md"), "utf8"));
  assert.ok(h.includes("<h3>Leçons de Kraken Paper</h3>"));
  assert.ok(h.includes("<strong>RSI &lt; 30</strong>"));
});

test("summarizeAction : actions en français", () => {
  assert.strictEqual(norm(L.summarizeAction({ type: "place_limit", pair: "BTC/USDC", side: "buy", quote_amount: 1000, price: 66800, stop_loss: 63500, take_profit: 71500 })),
    "Achat limite de 1 000 USDC de BTC à 66 800, stop 63 500, objectif 71 500");
  assert.strictEqual(norm(L.summarizeAction({ type: "place_limit", pair: "SOL/USDC", side: "buy", quote_amount: 500, price: 75.5, stop_loss: 70.5, take_profit: 83 })),
    "Achat limite de 500 USDC de SOL à 75,50, stop 70,50, objectif 83,00");
  assert.strictEqual(L.summarizeAction({ type: "cancel", order_id: "O0002" }), "Annulation de l'ordre O0002");
  assert.strictEqual(L.summarizeAction({ type: "note", text: "x" }), "Note : x");
  assert.strictEqual(norm(L.summarizeAction({ type: "market_sell", pair: "XDGUSDC", qty: 12.5 })), "Vente au marché de 12,5 DOGE");
});

test("dailyPerf : jours de Paris, base = clôture de la veille, peu de jours", () => {
  const t = (s) => new Date(s).getTime();
  assert.deepStrictEqual(L.dailyPerf([]), []);
  const one = L.dailyPerf([{ t: t("2026-11-13T22:56:49+01:00"), eq: 6606.42, hold: 6579.99 }]);
  assert.strictEqual(one.length, 1); assert.strictEqual(one[0].pct, 0); assert.ok(one[0].partial);
  const d = L.dailyPerf([
    { t: t("2026-11-13T22:00:00+01:00"), eq: 1000, hold: 1000 },
    { t: t("2026-11-13T23:30:00+01:00"), eq: 1010, hold: 990 },   // 22:30 UTC : encore le 13 à Paris
    { t: t("2026-11-14T00:30:00+01:00"), eq: 1020, hold: 1000 },  // 23:30 UTC le 13 : déjà le 14 à Paris
    { t: t("2026-11-14T20:00:00+01:00"), eq: 999.8, hold: 1029.6 },
  ]);
  assert.deepStrictEqual(d.map((x) => x.day), ["2026-11-13", "2026-11-14"]);
  assert.ok(Math.abs(d[0].pct - 0.01) < 1e-12 && Math.abs(d[0].hold + 0.01) < 1e-12);
  assert.ok(Math.abs(d[1].pct - (999.8 / 1010 - 1)) < 1e-12);
  assert.ok(Math.abs(d[1].hold - 0.04) < 1e-12);
  assert.ok(Math.abs(d[1].diff - (d[1].pct - d[1].hold)) < 1e-12);
  assert.strictEqual(d[1].partial, false);
});

test("nextCycle : prochain :07, retard honnête au-delà de 75 min", () => {
  const now = new Date("2026-11-14T01:30:00+01:00").getTime();
  const c = L.nextCycle(now, new Date("2026-11-14T01:02:00+01:00").getTime());
  assert.strictEqual(c.next, new Date("2026-11-14T02:07:00+01:00").getTime());
  assert.strictEqual(c.late, false);
  const e = L.nextCycle(new Date("2026-11-14T01:05:00+01:00").getTime(), null);
  assert.strictEqual(e.next, new Date("2026-11-14T01:07:00+01:00").getTime());
  assert.strictEqual(L.nextCycle(now, now - 2 * 3600e3).late, true);
  // heure d'été : :07 reste :07 à Paris
  assert.strictEqual(L.nextCycle(new Date("2026-07-01T10:20:00+02:00").getTime(), null).next, new Date("2026-07-01T11:07:00+02:00").getTime());
});

test("nextSession : décision + 5 h, en retard sinon", () => {
  const dec = new Date("2026-11-13T23:55:00+01:00").getTime();
  const s = L.nextSession(dec, dec + 3600e3);
  assert.strictEqual(s.at, dec + 5 * 3600e3); assert.strictEqual(s.inMs, 4 * 3600e3); assert.strictEqual(s.overdue, false);
  assert.strictEqual(L.nextSession(dec, dec + 6 * 3600e3).overdue, true);
  assert.strictEqual(L.nextSession(null, dec), null);
  assert.strictEqual(L.duration(4 * 3600e3 + 5 * 60e3), "4 h 05");
  assert.strictEqual(L.duration(12 * 60e3), "12 min");
});

test("exposure : O0001-O0003 en attente, 2 200 réservés, risque −152,40", () => {
  const x = L.exposure(S0, () => null, orderMath);
  assert.strictEqual(x.invested, 0);
  assert.strictEqual(Math.round(x.committed * 100) / 100, 2200);
  assert.strictEqual(Math.round(x.riskPending * 100) / 100, -152.40);
  assert.strictEqual(x.riskPos, 0);
  assert.strictEqual(x.total, 6606.42);
  assert.deepStrictEqual(x.unprotected, []); assert.strictEqual(x.buysNoStop, 0);
});

test("exposure : position au prix en direct, sortie avec stop, position sans stop signalée", () => {
  const S = { cash: 5606.42, fees, pairs, positions: { XBTUSDC: { qty: 0.01491041, avg_cost: 67067.2 }, SOLUSDC: { qty: 1, avg_cost: 80 } },
    open_orders: [{ id: "O0004", pair: "XBTUSDC", side: "sell", qty: 0.01491041, price: 71500, stop_loss: 63500, parent: "O0001" }] };
  const live = { XBTUSDC: 68000, SOLUSDC: 76 };
  const x = L.exposure(S, (p) => live[p], orderMath);
  assert.ok(Math.abs(x.invested - (0.01491041 * 68000 + 76)) < 1e-9);
  assert.deepStrictEqual(x.unprotected, ["SOL"]);
  const m = orderMath(S.open_orders[0], S, 68000);
  assert.strictEqual(x.riskPos, m.loss); assert.ok(x.riskPos < 0);
  assert.strictEqual(x.committed, 0);
  assert.strictEqual(L.exposure(S, (p) => (p === "SOLUSDC" ? null : live[p]), orderMath).missing, true);
});

test("proximity : à moins de 1 % du déclenchement seulement", () => {
  const o = S0.open_orders[0], m = orderMath(o, S0, 67200);
  const p = L.proximity(o, m, 67200);
  assert.strictEqual(p.kind, "achat limite"); assert.ok(Math.abs(p.dist - 400 / 67200) < 1e-12);
  assert.strictEqual(L.proximity(o, orderMath(o, S0, 68000), 68000), null);
  assert.strictEqual(L.proximity(o, m, null), null);
  const s = { id: "O0004", pair: "XBTUSDC", side: "sell", qty: 0.01, price: 71500, stop_loss: 63500, parent: "O0001" };
  const S = { ...S0, positions: { XBTUSDC: { qty: 0.01, avg_cost: 67000 } } };
  assert.strictEqual(L.proximity(s, orderMath(s, S, 63900), 63900).kind, "stop");
  assert.strictEqual(L.proximity(s, orderMath(s, S, 71000), 71000).kind, "objectif");
});
