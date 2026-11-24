// Contrats des indicateurs de risque et allocation, sans données vivantes.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const KPLib = require(path.join(root, "site/lib.js"));
const app = fs.readFileSync(path.join(root, "site/app.js"), "utf8");
const page = fs.readFileSync(path.join(root, "site/index.html"), "utf8");

test("allocation inconnue signalée et non inventée", () => {
  const state = {cash: 1000, positions: {XBTUSDC: {qty: 1}}, open_orders: []};
  const a = KPLib.allocationTargets(state, () => 100, () => ({engaged: 0}));
  assert.equal(a.complete, false);
  assert.equal(a.unknown, 100);
  assert.equal(a.totals.reserve, 1000);
  assert.equal(a.targets.medium, .40);
  assert.equal(a.targets.short, .25);
  assert.equal(a.targets.reserve, .35);
});
test("allocation complète : réserve hors fonds réservés", () => {
  const state = {cash: 1000, positions: {XBTUSDC: {qty: 2, compartment: "medium"}},
    open_orders: [{side: "buy", pair:"XBTUSDC", compartment:"short"}]};
  const a = KPLib.allocationTargets(state, () => 100, () => ({engaged: 250}));
  assert.equal(a.complete, true);
  assert.equal(a.totals.medium, 200);
  assert.equal(a.totals.short, 250);
  assert.equal(a.totals.reserve, 750);
  assert.equal(a.total, 1200);
});
test("gauge risque et perte hebdomadaire sans reference fabriquee", () => {
  for(const id of ["g-risk-track", "g-week-track", "g-allocation"]) assert.ok(page.includes(id));
  assert.match(app, /!risk\.unprotected\.length && !risk\.buysNoStop/);
  assert.match(app, /Historique 7 j insuffisant/);
  assert.match(app, /allocation\.complete/);
  assert.match(app, /aria-valuetext/);
});

test("risque courant plafonne la couverture et utilise le stop du groupe", () => {
 const st={cash:900,fees:{maker:0,taker:0},risk_config:{slippage:0},positions:{XBTUSDC:{qty:1,avg_cost:50}},open_orders:[
 {pair:"XBTUSDC",side:"sell",parent:"T1",qty:1,stop_loss:80},
 {pair:"XBTUSDC",side:"sell",qty:1,stop_loss:90},
 {pair:"XBTUSDC",side:"buy",qty:1,price:90,stop_loss:60}]};
 const risk=KPLib.stopRisk(st,()=>100);
 assert.equal(risk.risk,30);
 assert.equal(risk.riskPct,.03);
 assert.equal(risk.buysNoStop,0);
});
