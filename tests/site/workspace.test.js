const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness() {
  const elements = {};
  const makeInput = (value = "") => ({
    value, listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    focus() { this.focused = true; }
  });
  for (const name of ["orders", "markers"]) {
    elements[name + "-search"] = makeInput();
    elements[name + "-side"] = makeInput("all");
    elements[name + "-trend"] = makeInput("all");
    elements[name + "-reset"] = makeInput();
    elements[name + "-count"] = { textContent: "" };
  }
  const order = (text, side) => ({
    classList: { contains: (s) => s === "o-row" },
    cells: [{ textContent: text }],
    querySelector: (s) => s === ".tag." + side ? {} : null,
    hidden: false
  });
  const detail = () => ({
    classList: { contains: (s) => s === "o-detail" },
    style: {}, hidden: true
  });
  const marker = (name, h4, d1) => ({
    cells: [{ textContent: name }, {}, {}, { textContent: h4 }, { textContent: d1 }],
    hidden: false
  });
  const orders = [order("O1 ETH/USDC", "buy"), detail(), order("O2 BTC/USDC", "sell"), detail()];
  const markers = [marker("ETH", "Haussière", "Mixte"), marker("BTC", "Baissière", "Baissière")];
  elements.orders = { tBodies: [{ rows: orders }] };
  elements.markers = { tBodies: [{ rows: markers }] };
  const context = {
    document: { getElementById: (id) => elements[id] },
    requestAnimationFrame: (fn) => fn(),
    MutationObserver: class { observe() {} }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../../site/workspace.js"), "utf8"), context);
  return { elements, orders, markers };
}

test("filters orders by crypto and side, then resets", () => {
  const { elements: e, orders } = harness();
  e["orders-search"].value = "eth";
  e["orders-search"].listeners.input();
  assert.equal(orders[0].hidden, false);
  assert.equal(orders[2].hidden, true);
  assert.equal(orders[3].style.display, "none");
  assert.match(e["orders-count"].textContent, /1 \/ 2/);
  e["orders-side"].value = "sell";
  e["orders-side"].listeners.change();
  assert.equal(orders[0].hidden, true);
  assert.match(e["orders-count"].textContent, /aucun résultat/);
  e["orders-reset"].listeners.click();
  assert.equal(orders[0].hidden, false);
  assert.equal(orders[2].hidden, false);
  assert.equal(orders[3].style.display, "");
  assert.equal(e["orders-search"].focused, true);
});

test("filters market trends and resets without changing row data", () => {
  const { elements: e, markers } = harness();
  e["markers-trend"].value = "down";
  e["markers-trend"].listeners.change();
  assert.equal(markers[0].hidden, true);
  assert.equal(markers[1].hidden, false);
  e["markers-search"].value = "eth";
  e["markers-search"].listeners.input();
  assert.match(e["markers-count"].textContent, /aucun résultat/);
  e["markers-reset"].listeners.click();
  assert.equal(markers[0].hidden, false);
  assert.equal(markers[1].hidden, false);
  assert.equal(markers[0].cells[0].textContent, "ETH");
});
