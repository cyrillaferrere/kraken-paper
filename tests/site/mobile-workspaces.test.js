const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const site = path.resolve(__dirname, "../../site");
const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
const css = fs.readFileSync(path.join(site, "style.css"), "utf8");
test("la navigation de production utilise les ancres historiques sans onglets de workspace", () => {
  for (const id of ["overview","market-card","positions-panel","orders-panel","performance-panel","trades-panel","journal-panel"])
    assert.match(html, new RegExp('id="' + id + '"'));
  assert.doesNotMatch(html, /src="workspace-tabs\.js"|data-view-link=/);
  assert.match(html, /src="navigation\.js"/);
});
test("le chandelier reste accessible et les tableaux mobiles conservent leurs libellés", () => {
  assert.match(html, /id="mchart"/);
  assert.match(html, /id="tf-tabs"/);
  assert.match(css, /#positions tbody td:nth-child\(6\)::before/);
  assert.match(css, /#markers tbody td:nth-child\(8\)::before/);
});
