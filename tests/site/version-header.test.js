const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const base = path.join(__dirname, "../../site");
const read = (p) => fs.readFileSync(path.join(base, p), "utf8");
const html = read("index.html");
const app = read("app.js");
const css = read("style.css");

test("versions Dash / Moteur persistent dans le shell global de chaque vue", () => {
  const header = html.indexOf('id="build"');
  const main = html.indexOf('<main');
  const routes = ["terminal", "activite"];
  assert.ok(header > 0 && header < main, "en-tête versions hors des vues masquables");
  assert.match(html, /id="b-versions"/);
  assert.match(html, /id="b-version">Dash/);
  assert.match(html, /id="b-engine"[^>]*>Moteur v/);
  assert.match(app, /"Dash v" \+ v\.version/);
  assert.match(app, /"Moteur v" \+ \(S\.engine_version \|\| "0\.1\.0"\)/);
  for (const route of routes) {
    assert.match(html, new RegExp('data-route="' + route + '"'));
    assert.ok(header < html.indexOf('data-route="' + route + '"'));
  }
});

test("versions visibles sur mobile 320px et 390px, sans etre masquees par la navigation", () => {
  assert.match(html, /name="viewport" content="width=device-width/);
  assert.match(css, /@media \(max-width: 600px\)\s*\{\s*\.build\s*\{[^}]*flex-wrap: wrap/);
  assert.match(css, /#b-versions\s*\{[^}]*width: 100%/);
  assert.doesNotMatch(css, /#b-versions\s*\{[^}]*(?:display:\s*none|visibility:\s*hidden)/);
  assert.ok(html.indexOf('id="build"') < html.indexOf('id="nav-toggle"'));
});

test("palier PAPER actualise sans attendre un fill et sans volume ancien", () => {
  const context = {};
  vm.runInNewContext(read("version-status.js"), context);
  const feeTier = context.KPVersionStatus.feeTier;
  const now = Date.UTC(2026, 10, 18);
  assert.equal(feeTier([], now).maker, .004);
  const trades = [{ts: (now - 86400000) / 1000, qty: 1, price: 3100}];
  assert.equal(feeTier(trades, now).maker, .003);
  assert.equal(feeTier(trades, now).taker, .006);
  trades.push({ts: (now - 31 * 86400000) / 1000, qty: 100, price: 100000});
  assert.equal(feeTier(trades, now).maker, .003);
  assert.match(app, /KPVersionStatus\.feeTier\(S\.closed_trades, Date\.now\(\)\)/);
});
