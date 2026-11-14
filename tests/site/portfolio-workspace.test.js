const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../../site/portfolio-workspace.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../../site/index.html"), "utf8");

function setup() {
  const elements = {};
  const control = (value) => ({ value, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, focus() { this.focused = true; } });
  for (const name of ["positions", "trades"]) {
    elements[name + "-search"] = control("");
    elements[name + (name === "positions" ? "-sort" : "-side")] = control(name === "positions" ? "default" : "all");
    elements[name + "-reset"] = control("");
    elements[name + "-count"] = { textContent: "" };
  }
  const cell = (textContent) => ({ textContent });
  const row = (name, value, pnl, side) => ({
    cells: [cell(name), cell(""), cell(""), cell(""), cell(value), cell(pnl)],
    textContent: name + " " + value + " " + pnl,
    querySelector: (s) => s === ".tag." + side ? {} : null,
    hidden: false
  });
  const p1 = row("SOL", "499,20 USDC", "−0,80 (−0,16 %)");
  const p2 = row("BTC", "1 000,81 USDC", "+0,81 (+0,08 %)");
  const p3 = row("ADA", "300,00 USDC", "−10,00 (−3,23 %)");
  const t1 = row("ETH ACHAT", "", "", "buy"), t2 = row("SOL VENTE", "", "", "sell");
  const table = (rows) => {
    const body = { rows, insertBefore(item, before) { const old = rows.indexOf(item); if (old >= 0) rows.splice(old, 1); const idx = before == null ? rows.length : rows.indexOf(before); rows.splice(idx < 0 ? rows.length : idx, 0, item); } };
    return { tBodies: [body] };
  };
  elements.positions = table([p1, p2, p3]);
  elements.trades = table([t1, t2]);
  vm.runInNewContext(source, {
    document: { getElementById: (id) => elements[id] },
    requestAnimationFrame: (fn) => fn(),
    MutationObserver: class { observe() {} }
  });
  return { e: elements, p1, p2, p3, t1, t2 };
}

test("position value and signed P&L sort correctly and reset restores order", () => {
  const { e, p1, p2, p3 } = setup();
  e["positions-sort"].value = "value";
  e["positions-sort"].handlers.change();
  assert.equal(e.positions.tBodies[0].rows[0], p2);
  e["positions-sort"].value = "pnl";
  e["positions-sort"].handlers.change();
  assert.equal(e.positions.tBodies[0].rows[0], p2);
  assert.equal(e.positions.tBodies[0].rows[1], p1);
  assert.equal(e.positions.tBodies[0].rows[2], p3);
  e["positions-sort"].value = "default";
  e["positions-sort"].handlers.change();
  assert.equal(e.positions.tBodies[0].rows[0], p1);
  assert.equal(e.positions.tBodies[0].rows[2], p3);
  e["positions-search"].value = "btc";
  e["positions-search"].handlers.input();
  assert.equal(p1.hidden, true);
  assert.equal(p2.hidden, false);
  e["positions-reset"].handlers.click();
  assert.equal(p1.hidden, false);
  assert.equal(e["positions-search"].focused, true);
});

test("trade search and buy/sell filtering preserve rows", () => {
  const { e, t1, t2 } = setup();
  e["trades-side"].value = "sell";
  e["trades-side"].handlers.change();
  assert.equal(t1.hidden, true);
  assert.equal(t2.hidden, false);
  e["trades-search"].value = "eth";
  e["trades-search"].handlers.input();
  assert.match(e["trades-count"].textContent, /aucun résultat/);
  e["trades-reset"].handlers.click();
  assert.equal(t1.hidden, false);
  assert.equal(t2.hidden, false);
});

test("all portfolio controls exist in the HTML", () => {
  for (const id of ["positions-search", "positions-sort", "positions-reset", "positions-count", "trades-search", "trades-side", "trades-reset", "trades-count"]) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
  assert.ok(html.includes('<script src="portfolio-workspace.js"></script>'));
});

test("signed French P&L ordering handles two negative amounts", () => {
  const { e, p1, p3 } = setup();
  e["positions-sort"].value = "pnl";
  e["positions-sort"].handlers.change();
  const rows = e.positions.tBodies[0].rows;
  assert.ok(rows.indexOf(p1) < rows.indexOf(p3), "−0,80 must rank ahead of −10,00");
});
