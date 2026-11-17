/* Kraken Paper v0.3.6 — validation du routeur sans réseau, dépendance ni browser. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness(initialHash="") {
  const byId=new Map(), handlers=new Map(), selectors=new Map(), created=[];
  function node(tag,id) {
    const attrs={}; const classes=new Set();
    const n={tagName:tag,id:id||"",children:[],dataset:{},hidden:false,attributes:attrs,
      className:"",textContent:"",tabIndex:-1,
      classList:{add(x){classes.add(x);},remove(x){classes.delete(x);},
        contains(x){return classes.has(x)},toggle(x,v){if(v)classes.add(x);else classes.delete(x);}},
      append(...xs){for(const x of xs){if(x.parent)x.parent.children=x.parent.children.filter(y=>y!==x);x.parent=this;this.children.push(x);}},
      querySelectorAll(){return[]},setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]},
      contains(t){return this===t||this.children.some(c=>c.contains?.(t))},
      addEventListener(){},focus(){},scrollIntoView(){},
    };
    if(id)byId.set(id,n);
    created.push(n);
    return n;
  }
  const root=node("main","overview");
  const nav=node("nav","dash-nav");
  const toggle=node("button","nav-toggle");
  const mobile=node("nav","mobile-primary-nav");
  const more=node("button","mobile-more-toggle");
  const moreMenu=node("div","mobile-more-menu");
  const nodes={
    ".workspace-intro":node("div","intro"),
    ".cockpit":node("section","cockpit"),
    "#market-card":node("section","market-card"),
    "#markers-panel":node("section","markers-panel"),
    "#positions-panel":node("section","positions-panel"),
    "#orders-panel":node("section","orders-panel"),
    "#performance-panel":node("section","performance-panel"),
    "#calendar-panel":node("section","calendar-panel"),
    "#decisions-panel":node("section","decisions-panel"),
    "#trades-panel":node("section","trades-panel"),
    "#journal-panel":node("section","journal-panel"),
    "#lessons-panel":node("section","lessons-panel"),
  };
  root.querySelector=s=>nodes[s]||null;
  root.append(...Object.values(nodes));
  const document={
    body:{dataset:{},classList:node("body").classList},
    getElementById:(id)=>byId.get(id)||created.find(n=>n.id===id)||null,
    createElement:(name)=>node(name),
    querySelectorAll:()=>[],
    addEventListener:(name,fn)=>handlers.set(name,fn),
    dispatchEvent:()=>{},
  };
  const location={hash:initialHash};
  const window={requestAnimationFrame:fn=>fn(),matchMedia:()=>({matches:true}),
    scrollTo(){},addEventListener:(name,fn)=>handlers.set("window:"+name,fn)};
  const context={window,document,location,CustomEvent:class{constructor(name,opts){this.name=name;this.detail=opts.detail;}},
    decodeURIComponent,encodeURIComponent};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,"../../site/spa-router.js"),"utf8"),context);
  return{router:window.KPRouter,root,nodes,byId,location,handlers};
}
test("Cinq vues : un seul exemplaire de chaque composant, aucun clone",()=>{
  const a=harness(), sections=a.root.children.filter(x=>x.className==="app-view");
  assert.equal(sections.length,5);
  assert.equal(sections[0].children.includes(a.nodes[".cockpit"]),true);
  assert.equal(sections[1].children.includes(a.nodes["#market-card"]),true);
  assert.equal(sections[1].children.includes(a.nodes["#markers-panel"]),true);
  assert.equal(sections[2].children.includes(a.nodes["#orders-panel"]),true);
  assert.equal(sections[3].children.includes(a.nodes["#performance-panel"]),true);
  assert.equal(sections[4].children.includes(a.nodes["#journal-panel"]),true);
  assert.equal(sections.filter(x=>!x.hidden).length,1);
  assert.equal(a.router.active(),"accueil");
});
test("Liens historiques et URLs de vues : deep links conservés",()=>{
  const a=harness("#orders-panel");
  assert.equal(a.router.active(),"portefeuille");
  assert.equal(a.router.parseHash("#dec-h").route,"activite");
  assert.equal(a.router.parseHash("#market-card").route,"marches");
  assert.equal(a.router.parseHash("#/performance").route,"performance");
  assert.equal(a.router.parseHash("#/portefeuille#orders-panel").target,"orders-panel");
  a.router.navigate("marches","market-card");
  assert.equal(a.router.active(),"marches");
  assert.equal(a.location.hash,"#/marches#market-card");
  assert.equal(a.root.children.filter(x=>x.className==="app-view"&&!x.hidden).length,1);
});
test("Route inconnue : accueil sans effacer le document",()=>{
  const a=harness("#/route-inconnue");
  assert.equal(a.router.active(),"accueil");
  a.router.navigate("activite");
  assert.equal(a.router.active(),"activite");
  assert.equal(a.nodes["#decisions-panel"].parent.hidden,false);
});
