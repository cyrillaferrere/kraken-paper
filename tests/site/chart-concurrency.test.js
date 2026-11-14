const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../site");
const source = fs.readFileSync(path.join(root, "ohlc-utils.js"), "utf8");
const market = fs.readFileSync(path.join(root, "markets.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const parse = sandbox.window.KPOHLC.parse;
const bar = (t, o, h, l, c, v = "12.4") => [t, o, h, l, c, "ignored", v, "ignored"];
const valid = { XXBTZUSD: [bar(1794600000, "69000", "69500", "68500", "69200"), bar(1794603600, "69200", "69400", "68700", "69000")] };

test("valid OHLC candles preserve timestamps, prices and volume", () => {
  const rows = parse(valid);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].h, 69500);
  assert.equal(rows[1].t, 1794603600);
  assert.equal(rows[0].v, 12.4);
});

test("OHLC validator rejects malformed, duplicated and impossible candles", () => {
  assert.throws(() => parse({ last: 12 }), /absent/);
  assert.throws(() => parse({ X: [] }), /Aucune/);
  assert.throws(() => parse({ X: [bar(1, 10, 9, 8, 10)] }), /incohérente/);
  assert.throws(() => parse({ X: [bar(1, 10, 11, 9, "NaN")] }), /incohérente/);
  assert.throws(() => parse({ X: [bar(1, 10, 11, 9, 10, "-1")] }), /incohérente/);
  assert.throws(() => parse({ X: [bar(2, 10, 11, 9, 10), bar(1, 10, 11, 9, 10)] }), /chronologiques/);
  assert.throws(() => parse({ X: [bar(1, 10, 11, 9, 10), bar(1, 10, 11, 9, 10)] }), /chronologiques/);
});

test("stale chart requests cannot overwrite the selected pair, messages or loading status", () => {
  assert.match(market, /const request = \+\+chartRequest/);
  assert.match(market, /loadChartInner\(force, request\)/);
  assert.match(market, /if \(request !== chartRequest \|\| selected\.pair !== p \|\| TF\[selected\.tf\] !== iv\) return/);
  assert.match(market, /if \(request === chartRequest\) setChartMsg/);
  assert.match(market, /if \(request === chartRequest\) wrap\.classList\.remove/);
  assert.match(market, /if \(request === chartRequest\) chartBusy = false/);
  assert.ok(html.indexOf('src="ohlc-utils.js"') < html.indexOf('src="markets.js"'));
});

test("invalid OHLC never enters cache and prior valid chart stays available", () => {
  assert.match(market, /const bars = window\.KPOHLC\.parse\(res\);\s*cache\.set/);
  assert.match(market, /if \(c\) cache\.set\(k, c\); else cache\.delete\(k\)/);
});
