"""Vérifie le contrat des lignes PAPER : niveaux et légende en lecture seule."""
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const markets = fs.readFileSync(path.join(root, "site/markets.js"), "utf8");
const html = fs.readFileSync(path.join(root, "site/index.html"), "utf8");
const scale = fs.readFileSync(path.join(root, "site/market-v035.js"), "utf8");

test("le graphique réutilise le système de niveaux et conserve le filtrage de paire", () => {
  assert.match(markets, /function buildOrderLines\(orders, pair, previewId/);
  assert.match(markets, /if \(o\.pair !== pair\) continue/);
  assert.match(markets, /levels\.sync\(p, lines, showOrders\)/);
});
test("les protections conditionnelles ne deviennent pas actives", () => {
  assert.match(markets, /if \(previewId !== o\.id\) continue/);
  assert.match(markets, /futur stop \(inactif\)/);
  assert.match(scale, /Futur stop/);
});
test("légende complète et TP restants numérotés", () => {
  for (const label of ["Cours (bougies)", "PRU", "Achat en attente", "Stop actif", "Objectifs TP", "Conditionnel (inactif)"]) {
    assert.ok(html.includes(label), label);
  }
  assert.match(scale, /order\.tp_filled\|\|0/);
});
