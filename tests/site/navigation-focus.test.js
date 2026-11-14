const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../site/navigation.js"), "utf8");

function harness() {
  const listeners = new Map();
  const classes = new Set();
  const links = [];
  const toggle = {
    attrs: {},
    focusCount: 0,
    contains(target) { return target === this; },
    setAttribute(k, v) { this.attrs[k] = v; },
    focus() { this.focusCount++; document.activeElement = this; },
    addEventListener(type, cb) { listeners.set("toggle:" + type, cb); }
  };
  const nav = {
    attrs: {},
    contains(target) { return links.includes(target); },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    querySelectorAll() { return links; }
  };
  const link = {
    attrs: { href: "#overview" },
    getAttribute(k) { return this.attrs[k]; },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    querySelector() { return { textContent: "Vue générale" }; },
    addEventListener(type, cb) { listeners.set("link:" + type, cb); }
  };
  links.push(link);
  const document = {
    activeElement: null,
    body: { classList: {
      contains(k) { return classes.has(k); },
      add(k) { classes.add(k); },
      remove(k) { classes.delete(k); },
      toggle(k, force) {
        if (force === undefined) force = !classes.has(k);
        if (force) classes.add(k); else classes.delete(k);
      }
    }},
    getElementById(id) { return id === "nav-toggle" ? toggle : id === "dash-nav" ? nav : null; },
    addEventListener(type, cb) { listeners.set("document:" + type, cb); }
  };
  const window = {
    matchMedia() { return { matches: false, addEventListener() {} }; },
    addEventListener(type, cb) { listeners.set("window:" + type, cb); }
  };
  vm.runInNewContext(source, { document, window, localStorage: { getItem() { return null; } }, location: { hash: "" } });
  return { document, toggle, nav, link, listeners, classes };
}

test("Escape ferme le menu et restaure le focus sur le bouton", () => {
  const h = harness();
  h.listeners.get("toggle:click")();
  assert.equal(h.toggle.attrs["aria-expanded"], "true");
  h.document.activeElement = h.link;
  h.listeners.get("document:keydown")({ key: "Escape" });
  assert.equal(h.toggle.attrs["aria-expanded"], "false");
  assert.equal(h.document.activeElement, h.toggle);
  assert.ok("inert" in h.nav.attrs);
});

test("Un clic sur un lien ferme le menu sans forcer le focus sur le bouton", () => {
  const h = harness();
  h.listeners.get("toggle:click")();
  h.document.activeElement = h.link;
  h.listeners.get("link:click")();
  assert.equal(h.toggle.attrs["aria-expanded"], "false");
  assert.equal(h.toggle.focusCount, 0);
  assert.equal(h.link.attrs["aria-current"], "location");
});

test("Un clic extérieur ferme le menu et restaure le focus s'il était dedans", () => {
  const h = harness();
  h.listeners.get("toggle:click")();
  h.document.activeElement = h.link;
  h.listeners.get("document:pointerdown")({ target: {} });
  assert.equal(h.document.activeElement, h.toggle);
  assert.equal(h.toggle.attrs["aria-expanded"], "false");
});
