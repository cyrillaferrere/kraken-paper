const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("site/index.html", "utf8");
const css = fs.readFileSync("site/style.css", "utf8");
const app = fs.readFileSync("site/app.js", "utf8");
const extras = fs.readFileSync("site/extras.js", "utf8");

test("la vue générale n'affiche qu'une seule allocation et un seul résumé du risque", () => {
  for (const id of ["exp-bar", "exp-txt", "exp-risk"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, id + " doit être unique");
  }
  assert.match(html, /id="exp-txt" class="exp-txt"/);
  assert.match(html, /id="exp-risk" class="exp-risk"/);
  assert.doesNotMatch(html, /class="allocation-list"/);
  assert.doesNotMatch(html, /id="exp-txt" class="sr-only"/);
  assert.doesNotMatch(html, /id="exp-risk" class="sr-only"/);
});

test("l'allocation et le risque affichent les montants USDC et leurs pourcentages", () => {
  assert.match(extras, /usdc\(g\.v\)/);
  assert.match(extras, /nf\(1\)\.format\(pct\(g\.v\) \* 100\)\} %/);
  assert.match(extras, /\$\{signed\(x\.risk\)\} USDC/);
  assert.match(extras, /pctS\(x\.riskPct, 1\)/);
});

test("le cockpit garde des panneaux à hauteur naturelle et évite le débordement du risque", () => {
  assert.match(css, /\.cockpit\s*\{[^}]*align-items:start/s);
  assert.match(css, /\.cockpit-side \.risk-block\s*\{[^}]*min-width:0/s);
  assert.match(css, /\.cockpit-side \.exp-risk\s*\{[^}]*overflow-wrap:anywhere/s);
  assert.match(css, /@media\(max-width:640px\)/);
});

test("le nombre de trades clôturés ignore les simples achats", () => {
  assert.match(app, /filter\(t=>t\.realized_pnl!=null\)/);
  assert.match(app, /Number\(t\.realized_pnl\)>0/);
  assert.match(app, /Number\(t\.realized_pnl\)<0/);
});

test("les ticks live ne relancent pas le rendu complet du dashboard", () => {
  assert.match(app, /function renderLive\(\) \{ render\(true\); \}/);
  assert.match(app, /if \(liveOnly\) \{[\s\S]*?KPMarkets\.onPrice[\s\S]*?KPExtras\.onPrice[\s\S]*?return;/);
  assert.match(app, /loadPrices\(\); renderLive\(\)/);
  assert.match(app, /tickerRenderAt = tickerLast; renderLive\(\)/);
  assert.match(app, /function updateLiveTables\(\)/);
  assert.match(app, /data-position-pair/);
  assert.match(app, /data-order-id/);
});

test("les modules Marchés et Extras ont un chemin live ciblé", () => {
  const markets = fs.readFileSync("site/markets.js", "utf8");
  assert.match(markets, /onPrice\(c\) \{[\s\S]*?renderLivePrices\(\);[\s\S]*?overlays\(\);/);
  const extras = fs.readFileSync("site/extras.js", "utf8");
  assert.match(extras, /onPrice\(c\) \{[\s\S]*?renderExposure\(\);[\s\S]*?\},\s*onState/);
});

test("le feedback live est progressif et reste désactivable", () => {
  assert.match(css, /--motion-data:\s*360ms/);
  assert.match(css, /kpi-flash var\(--motion-data\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
