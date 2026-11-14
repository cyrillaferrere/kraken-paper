const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../site");
const source = fs.readFileSync(path.join(root, "history-utils.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const { extent, sample, path: svgPath } = sandbox.window.KPHistory;

test("100k cycles compute extrema without argument-spread overflow", () => {
  const points = Array.from({ length: 100000 }, (_, i) => ({ t: i, eq: i === 75321 ? -42 : 100 + i / 1000, hold: i === 54021 ? 900 : null }));
  const bounds = extent(points);
  assert.equal(bounds.min, -42);
  assert.equal(bounds.max, 900);
  const out = sample(points, 1200);
  assert.ok(out.length < 1250, "SVG point budget");
  assert.equal(out[0].t, 0);
  assert.equal(out[out.length - 1].t, 99999);
  assert.ok(out.some((p) => p.t === 75321), "preserve equity trough");
  assert.ok(out.some((p) => p.t === 54021), "preserve benchmark peak");
});

test("missing benchmark values break SVG paths rather than bridging gaps", () => {
  const pts = [{ t: 0, eq: 1, hold: 1 }, { t: 1, eq: 2, hold: null }, { t: 2, eq: 3, hold: 3 }];
  const p = svgPath(pts, "hold", (v) => v, (v) => v);
  assert.equal(p, "M0.0,1.0M2.0,3.0");
  assert.equal(svgPath(pts, "eq", (v) => v, (v) => v), "M0.0,1.0L1.0,2.0L2.0,3.0");
});

test("dashboard uses bounded history helpers and preserves all-cycle counts", () => {
  assert.ok(html.indexOf('src="history-utils.js"') < html.indexOf('src="app.js"'));
  assert.match(app, /const bounds = extent\(pts\)/);
  assert.match(app, /const plot = sample\(pts,/);
  assert.match(app, /const line = \(key\) => path\(plot, key, X, Y\)/);
  assert.match(app, /pts\.length \+ " \/ " \+ equity\.length/);
});
