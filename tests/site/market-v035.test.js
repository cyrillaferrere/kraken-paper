/* Kraken Paper v0.3.5: fonctions de présentation pures et mocks sans réseau. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness() {
  const nodes = new Map();
  const get = (id) => {
    if (!nodes.has(id)) nodes.set(id, {
      id, textContent: "", innerHTML: "", dataset: {}, attrs: {},
      addEventListener() {}, setAttribute(k,v) { this.attrs[k]=v; },
      removeAttribute(k) { delete this.attrs[k]; }, click() {},
      classList: { contains() { return false; } }, scrollIntoView() {}, focus() {},
    });
    return nodes.get(id);
  };
  const doc = {
    getElementById: get,
    addEventListener() {},
    querySelectorAll() { return []; },
    hidden: true,
    body: { classList: { contains() { return false; } } },
  };
  const context = {
    document: doc,
    window: {},
    console,
    Date, Intl, Number, Array, Object, String,
    setInterval() {},
    setTimeout() {},
    clearTimeout() {},
    matchMedia() { return { matches: true }; },
  };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,"../../site/market-v035.js"),"utf8"),context);
  return { api: context.window.KPV035, get };
}
const toPlain = (v) => JSON.parse(JSON.stringify(v));

test("Kraken Depth: clé dynamique, tri, prix, quantité et spread", () => {
  const {api} = harness();
  const book=api.normalizeBook({error:[],result:{XBTUSDC:{
    bids:[["100.0","2",1],["102.0","1",1],["101.0","1",1]],
    asks:[["105.0","2",1],["103.0","3",1],["104.0","1",1]],
  }}});
  assert.deepEqual(toPlain(book.bids.map(x=>x[0])),[102,101,100]);
  assert.deepEqual(toPlain(book.asks.map(x=>x[0])),[103,104,105]);
  assert.equal(book.bestBid,102);
  assert.equal(book.bestAsk,103);
  assert.equal(book.spread,1);
  assert.ok(book.spreadPct>0);
});
test("Kraken Depth: refus des carnets vides ou incohérents", () => {
  const {api}=harness();
  assert.equal(api.normalizeBook(null), null);
  assert.equal(api.normalizeBook({error:["EGeneral:Bad"],result:{}}),null);
  assert.equal(api.normalizeBook({error:[],result:{ETHUSDC:{bids:[["102","1"]],asks:[["100","2"]]}}}),null);
  assert.equal(api.normalizeBook({error:[],result:{ETHUSDC:{bids:[["xx","1"]],asks:[["105","2"]]}}}),null);
});
test("Performance: début/fin des cycles observés, pas de valeur inventée", () => {
  const {api}=harness(),t=1700000000000,h=3600000;
  const eq=[{t:t-h,eq:100,hold:100},{t,eq:120,hold:102},{t:t+h,eq:110,hold:104}];
  const x=api.summarizePerformance(eq,"all");
  assert.equal(x.first,100);assert.equal(x.last,110);
  assert.equal(x.pnl,10);assert.equal(x.pct,10);
  assert.ok(Math.abs(x.excessPct-6)<1e-8);
  assert.equal(x.count,3);
  assert.equal(api.summarizePerformance([{t,eq:100}],"7d"),null);
});
test("Performance: comparaison BTC indisponible explicitement", () => {
  const {api}=harness(),t=1700000000000;
  const x=api.summarizePerformance([{t,eq:100},{t:t+3600000,eq:110}],"all");
  assert.equal(x.btcPct,null);assert.equal(x.excessPct,null);
});
test("Timeline: aucun lien décision inventé lorsque la référence est absente", () => {
  const {api}=harness();
  const x=toPlain(api.buildTimeline([
    {type:"decision",decision_id:"D1",time:"2026-11-17T10:00:00Z"},
    {type:"order_placed",order:{id:"O1",pair:"XBTUSDC",price:91000},decision_id:"D1"},
    {type:"fill",trade:{id:"T1",pair:"XBTUSDC",price:91000,side:"buy"}},
    {type:"market",price:92000},
  ]));
  assert.equal(x.length,3);
  assert.equal(x[0].label,"Exécution");
  assert.equal(x[0].id,null);
  assert.equal(x[1].id,"D1");
  assert.equal(x[1].orderId,"O1");
});
test("Focus: niveaux issus des ordres et stop conditionnel au nouvel achat", () => {
  const {api,get}=harness();
  api.onMarket("XBTUSDC",{}, {S:{
    positions:{},
    open_orders:[{id:"O1",pair:"XBTUSDC",side:"buy",price:100,stop_loss:95,take_profit:110}]
  }});
  assert.match(get("chart-order-levels").innerHTML,/si achat exécuté/);
  assert.match(get("chart-order-levels").innerHTML,/data-v035-order="O1"/);
});


test("Réglette : cours, PRU, stop et objectifs sont des niveaux PAPER réels", () => {
  const {api,get}=harness();
  const state={positions:{XBTUSDC:{avg_cost:64000}},open_orders:[
    {id:"O10",pair:"XBTUSDC",side:"buy",price:62500,stop_loss:61000,take_profits:[{price:70000},{price:75000}]},
    {id:"O11",pair:"ETHUSDC",side:"buy",price:2000,stop_loss:1900},
  ]};
  const levels=toPlain(api.collectPriceLevels("XBTUSDC",state,65000));
  assert.deepEqual(levels.map(x=>x.label),["Cours observé","Prix de revient","Achat limite","Stop","TP1","TP2"]);
  assert.equal(levels[3].conditional,true);
  assert.equal(levels[4].conditional,true);
  assert.equal(levels[0].distance,0);
  assert.ok(Math.abs(levels[3].distance - (61000/65000-1)*100)<1e-8);
  api.onMarket("XBTUSDC",{}, {S:state,price:()=>65000});
  assert.match(get("v036-price-scale").innerHTML,/Cours observé/);
  assert.match(get("v036-price-scale").innerHTML,/si achat exécuté/);
  assert.doesNotMatch(get("v036-price-scale").innerHTML,/2 000/);
  assert.match(get("v036-price-scale").attrs["aria-label"],/Stop/);
});
test("Réglette : aucun niveau ni distance fictive si le cours manque",()=>{
  const {api,get}=harness();
  const state={positions:{},open_orders:[]};
  assert.equal(api.collectPriceLevels("XBTUSDC",state,null).length,0);
  api.onMarket("XBTUSDC",{}, {S:state,price:()=>null});
  assert.match(get("v036-price-scale").innerHTML,/Aucun niveau connu/);
});
test("Activité par paire : quatre événements maximum, aucune association temporelle inventée",()=>{
  const {api}=harness();
  const journal=[
    {type:"decision",decision_id:"D1",time:"2026-11-17T08:00:00Z"},
    {type:"order_placed",decision_id:"D1",order:{id:"O1",pair:"XBTUSDC",price:64000}},
    {type:"fill",trade:{id:"T1",pair:"ETHUSDC",price:2000}},
    {type:"fill",trade:{id:"T2",pair:"XBTUSDC",price:63000}},
    {type:"cancel",pair:"XBTUSDC",order_id:"O1"},
    {type:"rejected",decision_id:"D2"},
    {type:"exits_updated",pair:"XBTUSDC"},
    {type:"fill",trade:{id:"T3",pair:"XBTUSDC",price:63500}},
  ];
  const events=toPlain(api.recentPairEvents(journal,"XBTUSDC"));
  assert.equal(events.length,4);
  assert.deepEqual(events.map(e=>e.type),["fill","exits_updated","cancel","fill"]);
  assert.ok(events.every(e=>!e.decisionId));
  assert.equal(api.recentPairEvents(journal,"SOLUSDC").length,0);
});
test("Activité : mise à jour journal affichée quand la paire a déjà été choisie",()=>{
  const {api,get}=harness();
  api.onMarket("XBTUSDC",{}, {S:{positions:{},open_orders:[]},price:()=>65000});
  api.onPortfolio({equity:[],journal:[{type:"order_placed",time:"2026-11-18T08:00:00Z",order:{id:"O7",pair:"XBTUSDC",price:64400}}]});
  assert.match(get("v036-pair-events").innerHTML,/Ordre créé/);
  assert.match(get("v036-pair-events").innerHTML,/Journal/);
});
