const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "../../site");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const js = fs.readFileSync(path.join(root, "journal-workspace.js"), "utf8");

test("performance ranges use real timestamped equity cycles", () => {
  for (const period of ["1d", "7d", "30d", "all"]) assert.ok(html.includes('data-period="' + period + '"'));
  assert.match(app, /const end = equity\.length \? equity\[equity\.length - 1\]\.t : 0/);
  assert.match(app, /const pts = equity\.filter\(\(p\) => p\.t >= start\)/);
  assert.match(app, /setEquityPeriod\(b\.dataset\.period\)/);
  assert.match(app, /pts\.length \+ " \/ " \+ equity\.length/);
});

test("journal search, event categories, empty state and reset", () => {
  const controls = {};
  const input = (value) => ({ value, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, focus() { this.focused = true; } });
  controls["journal-search"] = input("");
  controls["journal-type"] = input("all");
  controls["journal-reset"] = input("");
  controls["journal-count"] = { textContent: "" };
  const row = (type, text) => ({ dataset: { eventType: type }, textContent: text, hidden: false });
  const decision = row("decision", "Décision BTC");
  const fill = row("fill", "Achat SOL exécuté");
  const warning = row("warning", "Alerte Kraken");
  controls.journal = { children: [decision, fill, warning] };
  vm.runInNewContext(js, {
    document: { getElementById: (id) => controls[id] },
    requestAnimationFrame: (fn) => fn(),
    MutationObserver: class { observe() {} }
  });
  controls["journal-type"].value = "order";
  controls["journal-type"].handlers.change();
  assert.equal(decision.hidden, true);
  assert.equal(fill.hidden, false);
  controls["journal-search"].value = "btc";
  controls["journal-search"].handlers.input();
  assert.match(controls["journal-count"].textContent, /aucun résultat/);
  controls["journal-reset"].handlers.click();
  assert.equal(decision.hidden, false);
  assert.equal(warning.hidden, false);
  assert.equal(controls["journal-search"].focused, true);
});

test("journal event type comes from original event, escaped for HTML", () => {
  assert.match(app, /data-event-type="\$\{esc\(e\.type\)\}"/);
  for (const id of ["journal-search", "journal-type", "journal-reset", "journal-count"]) assert.ok(html.includes('id="' + id + '"'));
});
