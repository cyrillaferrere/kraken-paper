const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const css = fs.readFileSync(path.join(__dirname, "../../site/style.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../../site/index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "../../site/app.js"), "utf8");

test("mobile dashboard uses cards for all four dense tables", () => {
  assert.match(css, /@media \(max-width: 680px\)/);
  for (const id of ["orders", "positions", "trades", "markers"]) {
    assert.match(css, new RegExp("#" + id + " tbody tr"));
    assert.match(css, new RegExp("#" + id + " thead"));
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test("mobile orders keep compact primary fields and expandable secondary details", () => {
  assert.match(css, /grid-template-areas: "identity identity" "amount distance"/);
  assert.match(css, /Montant engagé/);
  assert.match(css, /Déclenchement/);
  assert.match(css, /#orders tbody tr\.o-detail:not\(\[hidden\]\)/);
  assert.match(app, /aria-expanded="\$\{open\}"/);
  assert.match(app, /const expanded = new Set\(\)/);
});

test("mobile cards preserve legible metric labels and accessible filters", () => {
  for (const label of ["Prix de revient", "P&L latent", "P&L réalisé", "Tendance 4 h", "Force vs BTC"]) {
    assert.ok(css.includes(label), label);
  }
  for (const id of ["orders-search", "positions-sort", "trades-search", "markers-trend"]) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
  assert.match(css, /min-height: 42px/);
});

test("desktop table layout remains available", () => {
  assert.match(css, /table \{ width: 100%; border-collapse: collapse/);
  assert.match(css, /\.tbl-wrap \{ overflow-x: auto/);
  assert.match(css, /@media \(max-width: 680px\)/);
});
