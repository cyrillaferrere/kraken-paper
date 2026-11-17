/* Tests hors réseau de la couche UX de la feature v0.3.4. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness() {
  const elements = new Map();
  const handlers = new Map();
  function el(id) {
    if (!elements.has(id)) {
      const attrs = {};
      const events = {};
      elements.set(id, {
        id, innerHTML: "", textContent: "",
        replaceChildren() { this.innerHTML = ""; this.textContent = ""; },
        attrs, events, classList: { toggle() {} },
        addEventListener(name, fn) { events[name] = fn; },
        setAttribute(k, v) { attrs[k] = v; },
        removeAttribute(k) { delete attrs[k]; },
        focus() {}, scrollIntoView() {},
      });
    }
    return elements.get(id);
  }
  const periods = ["24h", "7d"].map((p) => {
    const x = el("p-" + p);
    x.dataset = { sparkPeriod: p };
    return x;
  });
  const document = {
    body: { classList: { toggle() {} } },
    getElementById: el,
    querySelectorAll(q) { return q === "[data-spark-period]" ? periods : []; },
    addEventListener(name, cb) { handlers.set(name, cb); },
  };
  const window = {
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    requestAnimationFrame(fn) { fn(); },
  };
  const context = {
    window, document,
    location: { hash: "" },
    history: { replaceState() {} },
    Intl, Number, Array, String, Object,
  };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../../site/focus-ux.js"), "utf8"), context);
  return { ui: window.KPFocus, el, periods };
}

test("Focus marché n'invente aucune position et conserve le dernier cours connu", () => {
  const { ui, el } = harness();
  const S = { pairs: { XBTUSDC: { base: "BTC" } }, positions: {}, open_orders: [] };
  ui.updateMarket("XBTUSDC", { S, price: () => null, liveOk: false, livePairs: {} });
  assert.match(el("focus-position").innerHTML, /Aucune position détenue/);
  assert.match(el("focus-orders").innerHTML, /Aucun ordre ouvert/);
  assert.match(el("focus-freshness").textContent, /indisponible/);
  assert.equal(el("focus-price").textContent, "— USDC");
});

test("Focus marché montre les stop et TP réellement fournis par l'état", () => {
  const { ui, el } = harness();
  const S = { pairs: { ETHUSDC: { base: "ETH" } },
    positions: { ETHUSDC: { qty: 2, avg_cost: 120 } },
    open_orders: [{ id: "O0042", pair: "ETHUSDC", side: "sell", price: 145,
      stop_loss: 108, take_profits: [{ price: 142 }, { price: 150 }] }] };
  ui.updateMarket("ETHUSDC", { S, price: () => 130, liveOk: true, livePairs: { ETHUSDC: 130 } });
  assert.match(el("focus-position").innerHTML, /Prix de revient/);
  assert.match(el("focus-orders").innerHTML, /O0042/);
  assert.match(el("focus-orders").innerHTML, /TP1/);
  assert.match(el("focus-orders").innerHTML, /TP2/);
  assert.equal(el("focus-freshness").textContent, "Cours direct Kraken");
});

test("Micrographe : historique absent explicitement signalé", () => {
  const { ui, el } = harness();
  ui.onPortfolio({ equity: [{ t: 1700000000000, eq: 100 }] });
  assert.match(el("mini-equity").textContent, /insuffisant/);
  assert.doesNotMatch(el("mini-equity").innerHTML, /<svg/);
});

test("Micrographe : ruptures entre cycles non raccordées", () => {
  const { ui, el } = harness();
  const t = 1700000000000, h = 3600000;
  ui.onPortfolio({ equity: [
    { t, eq: 100 },
    { t: t + h, eq: 105 },
    { t: t + 6*h, eq: 95 },
    { t: t + 7*h, eq: 107 },
  ] });
  const svg = el("mini-equity").innerHTML;
  assert.match(svg, /<svg/);
  const paths = svg.match(/<path/g) || [];
  assert.equal(paths.length, 3); // repère horizontal + deux segments séparés
  assert.match(el("mini-perf-summary").textContent, /\+7(?:,00)? USDC/);
});
