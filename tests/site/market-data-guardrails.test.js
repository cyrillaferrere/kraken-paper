const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "../../site");
const source = fs.readFileSync(path.join(root, "data-validators.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const { prices, equity, journal } = sandbox.window.KPData;

test("Kraken prices reject invalid values and report partial coverage", () => {
  const result = prices({ error: [], result: { BTC: { c: ["68200.25"] }, ETH: { c: ["0"] }, SOL: { c: ["bad"] } } }, ["XBTUSDC", "ETHUSDC", "SOLUSDC"], { XBTUSDC: ["BTC"], ETHUSDC: ["ETH"], SOLUSDC: ["SOL"] });
  assert.equal(result.found, 1);
  assert.equal(result.requested, 3);
  assert.equal(result.values.XBTUSDC, 68200.25);
  assert.equal(result.values.ETHUSDC, undefined);
  assert.throws(() => prices({ error: ["EGeneral:Temporary lockout"], result: {} }, ["BTC"]), /invalide/);
});

test("equity parser preserves missing benchmark and rejects malformed or reordered cycles", () => {
  const head = "time,equity_usdc,cash_usdc,positions_usdc,btc_price,btc_hold_usdc\n";
  const a = "2026-11-13T22:56:49+01:00,6606.42,6606.42,0,68358,\n";
  const b = "2026-11-13T23:56:49+01:00,6607.42,6606.42,1,68358,6500\n";
  const rows = equity(head + a + b);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].hold, null);
  assert.equal(rows[1].hold, 6500);
  assert.throws(() => equity(head + b + a), /chronologiques/);
  assert.throws(() => equity(head + a + "bad-date,foo,,,,\n"), /invalide/);
});

test("journal parser never silently drops malformed audit events", () => {
  assert.equal(journal('{"type":"start","capital":6606.42}\n').length, 1);
  assert.throws(() => journal('{"type":"start"}\n{bad}\n'), /invalide/);
  assert.throws(() => journal('{"time":"today"}\n'), /invalide/);
});

test("dashboard loads validators before app and labels partial prices", () => {
  assert.ok(html.indexOf('src="data-validators.js"') < html.indexOf('src="app.js"'));
  assert.match(app, /window\.KPData\.equity\(e\)/);
  assert.match(app, /window\.KPData\.journal\(j\)/);
  assert.match(app, /window\.KPData\.prices\(d, pairs, aliases\)/);
  assert.match(app, /Prix Kraken " \+ \(partial \? "partiels/);
});
