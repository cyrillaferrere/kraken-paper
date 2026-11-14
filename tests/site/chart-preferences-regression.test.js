const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../site/chart-preferences.js"), "utf8");
function load() {
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.window.KPChartPrefs;
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test("préférences absentes ou malformées : retour aux valeurs par défaut", () => {
  const prefs = load();
  const expected = { pair: "XBTUSDC", tf: "1h", bars: 120 };
  assert.deepEqual(plain(prefs.normalize(null)), expected);
  assert.deepEqual(plain(prefs.normalize([])), expected);
  assert.deepEqual(plain(prefs.normalize(["ETHUSDC", "5m", 60])), expected);
  assert.deepEqual(plain(prefs.normalize({ pair: "eth", tf: "2h", bars: 99 })), expected);
});

test("préférences valides conservées et stockage compatible", () => {
  const prefs = load();
  const storage = {
    value: null,
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; }
  };
  assert.equal(prefs.write(storage, { pair: "ETHUSDC", tf: "4h", bars: 240 }), true);
  assert.deepEqual(plain(prefs.read(storage)), { pair: "ETHUSDC", tf: "4h", bars: 240 });
  storage.value = "{invalid";
  assert.deepEqual(plain(prefs.read(storage)), { pair: "XBTUSDC", tf: "1h", bars: 120 });
});

test("stockage indisponible : lecture et écriture sans exception", () => {
  const prefs = load();
  const storage = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } };
  assert.deepEqual(plain(prefs.read(storage)), { pair: "XBTUSDC", tf: "1h", bars: 120 });
  assert.equal(prefs.write(storage, { pair: "XBTUSDC" }), false);
});
