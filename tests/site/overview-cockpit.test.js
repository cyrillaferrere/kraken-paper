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
  assert.match(css, /--motion-data:\s*600ms/);
  assert.match(css, /kpi-flash var\(--motion-data\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("le flash reste strictement ancré à la valeur modifiée", () => {
  assert.match(css, /\.kpi-updated\s*\{\s*position:\s*relative;\s*isolation:\s*isolate;/);
  assert.match(css, /\.kpi-updated::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*-2px -4px;/);
  assert.match(app, /const put = \(id, value, klass\) => \{[^\n]*const changed = el\.textContent !== value;/);
  assert.match(app, /if \(changed\) \{ el\.textContent = value; if \(!firstRender\)/);
});

test("le cockpit supprime les explications visibles et évite le chevauchement du benchmark", () => {
  assert.match(html, /class="benchmark-item"/);
  assert.doesNotMatch(html, /allocation-context/);
  assert.doesNotMatch(html, /<small>depuis le départ<\/small>/);
  assert.match(html, /id="cd-cycle-note" class="sr-only"/);
  assert.match(css, /\.benchmark-box\s*\{\s*display:flex;\s*flex-direction:column/);
  assert.match(css, /\.benchmark-item>strong\s*\{[^}]*overflow-wrap:anywhere/);
  assert.doesNotMatch(extras, /cash réservé compte dans la valeur totale/);
  assert.match(extras, /class="risk-summary"/);
});

test("les références des pourcentages restent accessibles sans sous-titres", () => {
  assert.match(app, /el\.title = "Référence : " \+ ref/);
  assert.match(app, /el\.setAttribute\("aria-label"/);
  assert.doesNotMatch(app, /pct\(value\) \+ \(ref \? " " \+ ref/);
});

test("la grille cockpit s'adapte à la largeur réelle du panneau", () => {
  assert.match(css, /#overview\s*\{[^}]*container-type:inline-size/);
  assert.match(css, /@container \(min-width:1120px\)/);
  assert.match(css, /@container \(min-width:700px\) and \(max-width:1119px\)/);
  assert.match(css, /@container \(max-width:699px\)/);
  assert.match(css, /\.sr-only\s*\{[^}]*clip:rect\(0,0,0,0\)/);
});

test("les textes de diagnostic restent masqués visuellement par sr-only", () => {
  assert.match(html, /id="k-value-sub" class="sr-only"/);
  assert.match(html, /id="k-bench-sub" class="sr-only"/);
  assert.match(html, /id="cd-cycle-note" class="sr-only"/);
  assert.match(html, /id="cd-session-note" class="sr-only"/);
  assert.match(css, /\.system-strip small\.sr-only\s*\{\s*position:absolute !important/);
});

test("les valeurs réellement actualisées déclenchent un feedback local", () => {
  assert.match(css, /--motion-data:\s*720ms/);
  assert.match(css, /\.kpi-updated\s*\{[^}]*animation:value-flash/);
  assert.match(app, /flashLiveValue\(priceCell, px\(x\)\)/);
  assert.match(app, /flashLiveValue\(valueCell, usdc\(val\)\)/);
  assert.match(markets, /flashLiveValue\(\$\("selected-live-price"\)/);
  assert.match(markets, /setCell\(tr\.cells\[1\],[\s\S]*?, true\)/);
  assert.match(extras, /class="e-amount"/);
  assert.match(extras, /class="risk-summary"/);
});
