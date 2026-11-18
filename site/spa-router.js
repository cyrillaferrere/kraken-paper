/* Kraken Paper v0.3.6 — 2 vues sans rechargement ni clonage du DOM.
   Terminal = cockpit + marchés + portefeuille + performance.
   Activité = décisions, trades, journal et leçons. */
(() => {
  "use strict";
  const main = document.getElementById("overview");
  if (!main) return;
  const views = [
    { id:"terminal", name:"Terminal", blocks:[".workspace-intro",".cockpit","#market-card","#positions-panel","#orders-panel","#performance-panel","#calendar-panel","#markers-panel"] },
    { id:"activite", name:"Activité & Bot", blocks:["#decisions-panel","#trades-panel","#journal-panel","#lessons-panel"] }
  ];
  const legacyRoutes = {
    accueil:["terminal","cockpit"], marches:["terminal","market-card"],
    portefeuille:["terminal","positions-panel"],performance:["terminal","performance-panel"]
  };
  const idMap = new Map(), containers = new Map();
  const nav = document.getElementById("dash-nav");
  const toggle = document.getElementById("nav-toggle");
  const mobile = document.getElementById("mobile-primary-nav");
  const navigationItems = [...document.querySelectorAll("[data-route]")];
  for (const view of views) {
    const section = document.createElement("section");
    section.className="app-view";
    section.id="view-"+view.id;
    section.dataset.view=view.id;
    section.hidden=true;
    section.setAttribute("aria-label",view.name);
    const header=document.createElement("header");
    header.className="app-page-head";
    const kicker=document.createElement("span");
    kicker.className="app-page-kicker";
    kicker.textContent=view.id==="terminal"?"PILOTAGE · PAPER":"DÉCISIONS · HISTORIQUE · AUDIT";
    const h=document.createElement("h2");
    h.id="view-title-"+view.id;
    h.tabIndex=-1;
    h.textContent=view.name;
    const desc=document.createElement("p");
    desc.textContent=view.id==="terminal"
      ? "Capital, marchés, ordres et performances dans un seul espace."
      : "Décisions de Grok Bot, historique des trades et journal audité.";
    header.append(kicker,h,desc);
    section.append(header);
    section.setAttribute("aria-labelledby",h.id);
    if(view.id==="terminal") {
      const toolbar=document.createElement("nav");
      toolbar.className="terminal-quicknav";
      toolbar.setAttribute("aria-label","Accès rapide dans le Terminal");
      for(const [id,label] of [["cockpit","Synthèse"],["market-card","Marché"],["orders-panel","Ordres"],["performance-panel","Performance"]]) {
        const a=document.createElement("a");
        a.href="#/terminal#"+id;
        a.textContent=label;
        a.dataset.terminalJump=id;
        toolbar.append(a);
      }
      section.append(toolbar);
    }
    for(const selector of view.blocks) {
      const node=main.querySelector(selector);
      if(!node) throw new Error("Section Kraken Paper absente : "+selector);
      section.append(node);
      if(node.id) idMap.set(node.id,view.id);
      node.querySelectorAll("[id]").forEach(el=>idMap.set(el.id,view.id));
    }
    containers.set(view.id,section);
    main.append(section);
  }
  let active=null;
  function parseHash(hash) {
    let raw;
    try {raw=decodeURIComponent(String(hash||"").replace(/^#/,""));}
    catch (_) {return {route:"terminal",target:null};}
    if(!raw) return {route:"terminal",target:null};
    if(raw.startsWith("/")) {
      const path=raw.slice(1), i=path.indexOf("#");
      const name=i<0?path:path.slice(0,i);
      const target=i<0?null:path.slice(i+1);
      if(legacyRoutes[name]) return {route:"terminal",target:target||legacyRoutes[name][1]};
      return {route:name==="activite"?"activite":"terminal",target};
    }
    return {route:idMap.get(raw)||"terminal",target:raw};
  }
  function closeMenus() {
    document.body.classList.remove("nav-open");
    window.KPNav?.sync?.();
  }
  function activate(route,target=null,{focus=false}={}) {
    if(!containers.has(route)) route="terminal";
    if(active!==route && document.body.classList.contains("market-focus")) window.KPFocus?.close();
    const changed=active!==route;
    active=route;
    for(const [id,section] of containers) section.hidden=id!==route;
    document.body.dataset.route=route;
    for(const a of navigationItems) {
      let yes=a.dataset.route===route;
      // Les quatre raccourcis mobiles pointent dans le meme Terminal :
      // n'en surligner qu'un seul, celui de la zone effectivement demandee.
      if(yes && a.closest?.("#mobile-primary-nav") && route==="terminal") {
        const selected=target==="market-card"?"market-card"
          :target==="orders-panel"?"orders-panel"
          :target==="performance-panel"?"performance-panel":"cockpit";
        yes=a.getAttribute("href")==="#/terminal#"+selected;
      }
      if(yes) a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    }
    closeMenus();
    document.title=(route==="terminal"?"Terminal":"Activité & Bot")+" · Kraken Paper";
    window.requestAnimationFrame(()=>{
      if(route==="terminal") {
        window.KPMarkets?.resizeChart?.();
        window.KPAppUX?.redrawPerformance?.();
      }
      const element=target?document.getElementById(target):null;
      if(element && containers.get(route).contains(element)) {
        element.scrollIntoView({behavior:"auto",block:"start"});
        if(focus && element.tabIndex>=0) element.focus({preventScroll:true});
      } else if(changed) {
        window.scrollTo({top:0,behavior:"auto"});
        if(focus) document.getElementById("view-title-"+route)?.focus({preventScroll:true});
      }
      document.querySelectorAll("[data-terminal-jump]").forEach(a=>{
        if(target && a.dataset.terminalJump===target) a.setAttribute("aria-current","location");
        else a.removeAttribute("aria-current");
      });
    });
    document.dispatchEvent(new CustomEvent("kp:view",{detail:{route,changed}}));
  }
  function go(route,target=null,focus=false) {
    if(legacyRoutes[route]) {
      target=target||legacyRoutes[route][1];
      route="terminal";
    }
    if(!containers.has(route)) return;
    const hash="#/"+route+(target?"#"+encodeURIComponent(target):"");
    if(location.hash!==hash) location.hash=hash;
    activate(route,target,{focus});
  }
  window.addEventListener("hashchange",()=>{
    const {route,target}=parseHash(location.hash);
    activate(route,target);
  });
  document.addEventListener("click",(event)=>{
    const a=event.target.closest?.('a[href^="#"]');
    if(!a || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href=a.getAttribute("href");
    if(!href || href==="#") return;
    const {route,target}=parseHash(href);
    event.preventDefault();
    go(route,target,true);
  });
  window.KPRouter={navigate:go,active:()=>active,routeFor:id=>idMap.get(id)||null,parseHash};
  const initial=parseHash(location.hash);
  activate(initial.route,initial.target);
})();