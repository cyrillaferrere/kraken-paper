const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const css = fs.readFileSync(path.resolve(__dirname,"../../site/spa-v036.css"),"utf8");
const html = fs.readFileSync(path.resolve(__dirname,"../../site/index.html"),"utf8");
const focus = fs.readFileSync(path.resolve(__dirname,"../../site/focus-ux.js"),"utf8");
const market = fs.readFileSync(path.resolve(__dirname,"../../site/market-v035.js"),"utf8");

test("cartes d'ordres hauteur fixe avec details accessibles",()=>{
  assert.match(css, /#focus-orders \.focus-order-list \{[\s\S]*?grid-auto-rows:94px/);
  assert.match(css, /#focus-orders \.focus-order-list li \{[^}]*height:94px/);
  assert.match(css, /-webkit-line-clamp:2/);
  assert.match(focus, /aria-label=/);
  assert.match(focus, /title=/);
});
test("prix et pourcentage du spread ont des lignes distinctes et reservees",()=>{
  assert.match(html, /id="book-spread"/);
  assert.match(html, /id="book-spread-pct"/);
  assert.match(market, /show\("book-spread-pct", money\(book\.spreadPct, 3\) \+ " %"\)/);
  assert.match(market, /show\("book-spread-pct", "— %"\)/);
  assert.match(css, /#market-context \.v035-book-spread > span \{[\s\S]*?height:100px/);
});
test("carnet conserve la place des dix niveaux pendant le rafraichissement",()=>{
  assert.match(css, /#market-context \.v035-book-rows \{[\s\S]*?min-height:287px/);
  assert.match(css, /#market-context \.v035-depth-row \{[\s\S]*?height:26px/);
  assert.match(css, /#book-status \{[\s\S]*?min-height:34px/);
});
