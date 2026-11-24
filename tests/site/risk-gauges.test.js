const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const lib=require("../../site/lib.js");
const app=fs.readFileSync(path.join(__dirname,"../../site/app.js"),"utf8");
const page=fs.readFileSync(path.join(__dirname,"../../site/index.html"),"utf8");
const fixture=()=>({cash:900,fees:{maker:0,taker:0},risk_config:{slippage:0},positions:{XBTUSDC:{qty:1,avg_cost:50}},open_orders:[
{pair:"XBTUSDC",side:"sell",parent:"T1",qty:1,stop_loss:80},
{pair:"XBTUSDC",side:"sell",qty:1,stop_loss:90},
{pair:"XBTUSDC",side:"buy",qty:1,price:90,stop_loss:60}]});
test("risque courant plafonne la couverture et utilise le stop hérité",()=>{
 const a=lib.stopRisk(fixture(),()=>100);
 assert.equal(a.risk,30); assert.equal(a.riskPct,.03); assert.equal(a.buysNoStop,0);
});
test("frais et glissement inclus dans le risque positif",()=>{
 const s=fixture();s.fees={maker:.004,taker:.008};s.risk_config={slippage:.002};
 const a=lib.stopRisk(s,()=>100);
 assert.ok(Math.abs(a.risk-(100-80*.998*.992+90*1.004-80*.998*.992))<1e-9);
});
test("protections manquantes et cours indisponibles explicitement signalés",()=>{
 const s=fixture();s.open_orders=s.open_orders.filter(o=>o.side==="buy");delete s.open_orders[0].stop_loss;
 const a=lib.stopRisk(s,()=>100);
 assert.equal(a.unprotected.length,1);assert.equal(a.buysNoStop,1);
 assert.equal(lib.stopRisk(s,()=>null).missing,true);
});
test("stop au-dessus de l’achat et point mort suspendu",()=>{
 const s=fixture();s.open_orders[0].stop_loss=95;s.open_orders[0].breakeven_deferred={since:1};
 const a=lib.stopRisk(s,()=>100);
 assert.ok(a.warnings.some(x=>x.includes("stop au-dessus")));
 assert.ok(a.warnings.some(x=>x.includes("point mort suspendu")));
});
test("jauges 6/8%, historique non fabriqué, pas d’allocation 0.2.2",()=>{
 assert.match(app,/value >= 6 && value < limit/);
 assert.match(app,/value >= limit/);
 assert.match(app,/Historique 7 j insuffisant/);
 assert.ok(page.includes("g-risk-track")&&page.includes("g-week-track"));
 assert.ok(page.includes("g-allocation"));
 assert.equal(lib.allocationTargets,undefined);
});
