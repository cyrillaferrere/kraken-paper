const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../../site");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

test("dashboard IDs are unique and every route or legacy anchor has a target", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of html.matchAll(/<a\s+href="#([^"]+)"/g)) {
    if (id.startsWith("/")) {
      const [route, target] = id.slice(1).split("#");
      assert.ok(["terminal", "activite", "accueil", "marches", "portefeuille", "performance"].includes(route), "route inconnue : " + route);
      if (target) assert.ok(ids.includes(target), "cible inconnue : " + target);
    } else assert.ok(ids.includes(id), "missing anchor target: " + id);
  }
});

test("filter inputs, controls and reset buttons have accessible labels", () => {
  for (const id of ["orders", "markers", "positions", "trades", "journal"]) {
    assert.match(html, new RegExp('<label for="' + id + '-search"'));
    assert.match(html, new RegExp('id="' + id + '-reset"'));
    assert.match(html, new RegExp('id="' + id + '-count"[^>]*aria-live="polite"'));
  }
  for (const id of ["orders-side", "markers-trend", "positions-sort", "trades-side", "journal-type"]) {
    assert.match(html, new RegExp('<label for="' + id + '"'));
  }
});

test("all workspace scripts load after app and navigation", () => {
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  const appIndex = scripts.indexOf("app.js");
  assert.ok(appIndex >= 0);
  for (const file of ["workspace.js", "portfolio-workspace.js", "journal-workspace.js"]) {
    assert.ok(scripts.indexOf(file) > appIndex, file);
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});

test("equity SVG is described and interface supports reduced motion", () => {
  assert.match(app, /role="img" aria-label="Performance du portefeuille/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /id="performance-panel"/);
  assert.match(html, /id="trades-panel"/);
  assert.match(html, /href="#\/activite"/);
  assert.match(html, /src="spa-router\.js"/);
});


test("market compact header preserves Kraken live controls and stable unique IDs", () => {
  for (const id of ["market-h","selected-live-pair","selected-live-price","selected-live-status","tf-tabs","ord-toggle","market-focus-toggle","pair-chips","chart-view-note","chart-updated","mlegend","mchart"]) {
    assert.equal([...html.matchAll(new RegExp('id="' + id + '"', "g"))].length, 1, "unique control: " + id);
  }
  const header = html.slice(html.indexOf('id="market-card"'), html.indexOf('id="market-stage"'));
  assert.ok(header.indexOf('class="market-header-live"') > 0);
  assert.ok(header.indexOf('id="selected-live-price"') < header.indexOf('id="tf-tabs"'));
  assert.ok(header.indexOf('id="tf-tabs"') < header.indexOf('id="pair-chips"'));
  assert.ok(header.indexOf('id="pair-chips"') < header.indexOf('class="chart-tools"'));
  assert.equal((header.match(/class="selected-live"/g)||[]).length,1);
});
test("compact OHLC remains tied to the existing live candle feed", () => {
  const markets = fs.readFileSync(path.join(root, "markets.js"), "utf8");
  const compact = fs.readFileSync(path.join(root, "spa-v036.css"), "utf8");
  assert.match(markets, /class="market-ohlc-line"/);
  assert.match(markets, /class="market-indicators-line"/);
  assert.match(markets, /hoveredCandleTime/);
  assert.match(compact, /#market-card > \.card-h/);
  assert.match(compact, /#market-card > #pair-chips/);
  assert.match(compact, /@media\(max-width:760px\)/);
});


test("sélecteur des six intervalles : état actif attaché au bouton, sans thumb mobile", () => {
  const markets = fs.readFileSync(path.join(root, "markets.js"), "utf8");
  const compact = fs.readFileSync(path.join(root, "spa-v036.css"), "utf8");
  const tf = html.slice(html.indexOf('id="tf-tabs"'), html.indexOf('id="ord-toggle"'));
  assert.equal((tf.match(/role="tab"/g) || []).length, 6);
  assert.equal((tf.match(/aria-selected="true"/g) || []).length, 1);
  assert.doesNotMatch(tf, /seg-thumb/);
  assert.match(markets, /b\.setAttribute\("aria-selected", on\)/);
  assert.doesNotMatch(markets, /setProperty\("--idx"/);
  assert.match(compact, /#tf-tabs button\[aria-selected="true"\]/);
  assert.match(compact, /#tf-tabs button:focus-visible/);
});
