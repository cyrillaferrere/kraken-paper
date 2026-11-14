const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");
test("la version cible de préproduction est 0.3.1", () => {
  assert.equal(read("VERSION").trim(), "0.3.1");
  assert.match(read("scripts/netlify-build.sh"), /VERSION/);
  assert.match(read("site/app.js"), /"v" \+ v\.version/);
});
test("Nocturne Signal remplace la palette violette et les doublons desktop", () => {
  const css=read("site/style.css");
  const theme=css.slice(css.indexOf("/* v0.3.1 — NOCTURNE SIGNAL"));
  assert.match(theme,/--ac:#b4d779/);
  assert.match(theme,/\.workspace-tabs \{ display:none; \}/);
  assert.match(theme,/prefers-reduced-motion:reduce/);
  assert.doesNotMatch(theme,/#7c5cff|rgba\(124,92,255/);
  assert.match(read("site/index.html"), /logo-dot/);
});
test("la palette du chandelier est cohérente sans changer ses séries", () => {
 const market=read("site/markets.js");
 const alternative = read("site/index.html").includes('href="analog.css"');
 assert.match(market, alternative ? /ac: "#b6ff52"/ : /ac: "#b4d779"/);
 assert.match(market, alternative ? /ma50: "#ffc475"/ : /ma50: "#d8b983"/);
 assert.match(market,/CandlestickSeries/);
 assert.match(market,/LineSeries/);
});
