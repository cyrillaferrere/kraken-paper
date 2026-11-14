const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const site = path.resolve(__dirname, "../../site");
const html = fs.readFileSync(path.join(site,"index.html"),"utf8");
const css = fs.readFileSync(path.join(site,"style.css"),"utf8");
const js = fs.readFileSync(path.join(site,"workspace-tabs.js"),"utf8");
test("quatre rubriques avec liens directs et script chargé",()=>{
 for(const view of ["overview","markets","orders","history"]) assert.match(html,new RegExp('data-view-link="'+view+'"'));
 assert.match(html,/src="workspace-tabs\.js"/);
 assert.match(js,/hashchange/);
 assert.match(js,/aria-current/);
});
test("sections essentielles et contenu historique toujours présents",()=>{
 for(const id of ["market-card","positions-panel","orders-panel","performance-panel","trades-panel","journal-panel"])
   assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/data-workspace="overview markets"/);
 assert.match(html,/data-workspace="history"/);
});
test("sections cachées non affichées et accessibilité du graphique préservée",()=>{
 assert.match(css,/\[data-workspace\]\[hidden\]\{display:none!important\}/);
 assert.match(html,/id="mchart-a11y" class="sr-only"/);
 assert.match(html,/aria-describedby="mchart-a11y"/);
});
