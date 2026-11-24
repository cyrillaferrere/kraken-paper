"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exécute les vrais formateurs de app.js, sans DOM ni réseau.
const source = fs.readFileSync(path.join(__dirname, "../../site/app.js"), "utf8");
const start = source.indexOf("  function pendingExitText(pending) {");
const end = source.indexOf("  function renderOrders() {", start);
assert.ok(start >= 0 && end > start, "formateurs présents dans app.js");
const code = source.slice(start, end);
const ctx = {
  px: (n) => String(n),
  qty: (n) => String(n),
  base: (pair) => pair.replace("USDC", ""),
  esc: (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;"),
  nf: () => ({ format: (n) => String(n) }),
  dt: (iso) => new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
};
vm.createContext(ctx);
vm.runInContext(code, ctx);

test("pending_exits affiche heure Paris, nouveau stop, TP et maintien de l'ancien stop", () => {
  const text = ctx.pendingExitText({
    active_from: Date.parse("2026-11-14T22:00:00Z") / 1000,
    stop_loss: 62000,
    action: { take_profits: [{ price: 69000, fraction: 0.5 }, { price: 72000, fraction: 0.5 }] }
  });
  assert.match(text, /23:00:00/);
  assert.match(text, /nouveau stop 62000/);
  assert.match(text, /TP1 69000 \(50 %\)/);
  assert.match(text, /TP2 72000 \(50 %\)/);
  assert.match(text, /ancien stop maintenu/);
});
test("order_placed journalise deux TP et échappe l'identifiant", () => {
  const text = ctx.orderPlacedText({
    id: "<test>", side: "buy", qty: 0.02, pair: "XBTUSDC", price: 64000, stop_loss: 62000,
    take_profits: [{ price: 69000, fraction: 0.5 }, { price: 72000, fraction: 0.5 }]
  });
  assert.match(text, /&lt;test>/);
  assert.match(text, /TP1 69000 \(50 %\)/);
  assert.match(text, /TP2 72000 \(50 %\)/);
});
test("order_placed conserve le TP unique historique", () => {
  const text = ctx.orderPlacedText({ id: "old", side: "buy", qty: 0.02, pair: "XBTUSDC", price: 64000, take_profit: 69000 });
  assert.match(text, / · TP 69000/);
  assert.doesNotMatch(text, /TP1/);
});

test("le graphique distingue le point mort actif et suspendu et les sorties héritées", () => {
  const market = fs.readFileSync(path.join(__dirname, "../../site/markets.js"), "utf8");
  const start = market.indexOf("function buildOrderLines(");
  const end = market.indexOf("window.KPMarketOrderLines",start);
  const chart = vm.createContext({C:{dn:"#ef4444"}});
  vm.runInContext(market.slice(start,end),chart);
  const group={id:"S1",pair:"XBTUSDC",side:"sell",parent:"B1",stop_loss:101,entry_price:100,breakeven_after_tp1:true,tp_filled:1,take_profits:[{price:120}]};
  const buy={id:"B2",pair:"XBTUSDC",side:"buy",price:98,stop_loss:90,take_profits:[{price:110}]};
  const levels=chart.buildOrderLines([group,buy],"XBTUSDC","B2");
  assert.ok(levels.some(l=>l.label.includes("stop remonté")));
  assert.ok(levels.some(l=>l.conditional && l.price===101 && l.label.includes("S1")));
  assert.ok(!levels.some(l=>l.conditional && l.price===90));
  group.breakeven_deferred={since:1};
  const suspended=chart.buildOrderLines([group],"XBTUSDC");
  assert.ok(suspended.some(l=>l.label.includes("point mort suspendu")));
  assert.ok(!suspended.some(l=>l.label.includes("stop remonté")));
});
