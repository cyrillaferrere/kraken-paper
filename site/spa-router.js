/* Kraken Paper v0.3.6 — routeur d'interface statique, sans nouvel appel réseau.
   Toutes les données et instances des graphiques restent dans le même document. */
(() => {
  "use strict";
  const main = document.getElementById("overview");
  if (!main) return;
  const views = [
    { id:"accueil", name:"Vue d'ensemble", kicker:"01 · COCKPIT", subtitle:"Capital, exposition et risques en un coup d'œil.",
      blocks:[".workspace-intro",".cockpit"] },
    { id:"marches", name:"Marchés", kicker:"02 · TERMINAL", subtitle:"Chandelier, carnet d'ordres Kraken et scanner des cryptos.",
      blocks:["#market-card","#markers-panel"] },
    { id:"portefeuille", name:"Portefeuille", kicker:"03 · POSITIONS & ORDRES", subtitle:"Positions ouvertes, niveaux de protection et ordres PAPER.",
      blocks:["#positions-panel","#orders-panel"] },
    { id:"performance", name:"Performance", kicker:"04 · ANALYSE", subtitle:"Évolution du portefeuille, comparaison au BTC et résultats quotidiens.",
      blocks:["#performance-panel","#calendar-panel"] },
    { id:"activite", name:"Activité & Bot", kicker:"05 · AUDIT", subtitle:"Décisions de Grok Bot, exécutions, journal et enseignements.",
      blocks:["#decisions-panel","#trades-panel","#journal-panel","#lessons-panel"] },
  ];
  const idMap = new Map(), containers = new Map();
  const routes = new Set(views.map(v=>v.id));
  const legacyTargets = new Map([
    ["overview","accueil"],["market-card","marches"],["markers-panel","marches"],["markers-h","marches"],
    ["positions-panel","portefeuille"],["orders-panel","portefeuille"],["performance-panel","performance"],
    ["calendar-panel","performance"],["cal-h","performance"],["decisions-panel","activite"],
    ["dec-h","activite"],["trades-panel","activite"],["journal-panel","activite"],
    ["lessons-panel","activite"],["les-h","activite"],
  ]);
  const nav = document.getElementById("dash-nav");
  const toggle = document.getElementById("nav-toggle");
  const mobile = document.getElementById("mobile-primary-nav");
  const moreButton = document.getElementById("mobile-more-toggle");
  const moreMenu = document.getElementById("mobile-more-menu");

  for (const view of views) {
    const section = document.createElement("section");
    section.className = "app-view";
    section.id = "view-" + view.id;
    section.dataset.view = view.id;
    section.setAttribute("aria-label", view.name);
    section.hidden = true;
    if (view.id !== "accueil") {
      const head = document.createElement("header");
      head.className = "app-page-head";
      const eyebrow = document.createElement("span");
      eyebrow.className = "app-page-kicker";
      eyebrow.textContent = view.kicker;
      const h = document.createElement("h2");
      h.id = "view-title-" + view.id;
      h.tabIndex = -1;
      h.textContent = view.name;
      const sub = document.createElement("p");
      sub.textContent = view.subtitle;
      head.append(eyebrow,h,sub);
      section.append(head);
      section.setAttribute("aria-labelledby",h.id);
    }
    for (const selector of view.blocks) {
      const node = main.querySelector(selector);
      if (!node) throw new Error("Section Kraken Paper introuvable : " + selector);
      section.append(node); // Déplacer le nœud, pas le cloner : conserver événements et données.
      if (node.id) idMap.set(node.id, view.id);
      node.querySelectorAll("[id]").forEach(el=>idMap.set(el.id,view.id));
    }
    containers.set(view.id,section);
    main.append(section);
  }
  let active = null;

  function parseHash(hash) {
    const raw = decodeURIComponent(String(hash||"").replace(/^#/,""));
    if (!raw) return {route:"accueil",target:null};
    if (raw.startsWith("/")) {
      const body = raw.slice(1), pos = body.indexOf("#");
      const route = pos < 0 ? body : body.slice(0,pos);
      const target = pos < 0 ? null : body.slice(pos+1);
      return { route:routes.has(route)?route:"accueil", target };
    }
    const target = raw;
    return {route:idMap.get(target) || legacyTargets.get(target) || "accueil",target};
  }
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function closeMenus() {
    document.body.classList.remove("nav-open");
    if (nav && window.KPNav?.sync) window.KPNav.sync();
    if (moreMenu) moreMenu.hidden=true;
    moreButton?.setAttribute("aria-expanded","false");
  }
  function activate(route, target=null, {focus=false}={}) {
    if (!routes.has(route)) route="accueil";
    if (active!==route && document.body.classList.contains("market-focus")) window.KPFocus?.close();
    const changed = active!==route;
    active=route;
    for(const [id,section] of containers) section.hidden=(id!==route);
    document.body.dataset.route=route;
    document.querySelectorAll("[data-route]").forEach(link=>{
      const current=link.dataset.route===route;
      if(current) link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });
    const isActivity=route==="activite";
    moreButton?.classList.toggle("is-current",isActivity);
    closeMenus();
    document.title=(views.find(v=>v.id===route)?.name || "Kraken Paper")+" · Kraken Paper";
    window.requestAnimationFrame(()=>{
      if(route==="marches") window.KPMarkets?.resizeChart?.();
      if(route==="performance") window.KPAppUX?.redrawPerformance?.();
      const visibleTarget=target&&document.getElementById(target);
      if(visibleTarget && containers.get(route)?.contains(visibleTarget)) {
        visibleTarget.scrollIntoView({behavior:"auto",block:"start"});
        if(focus && typeof visibleTarget.focus==="function" && visibleTarget.tabIndex>=0) visibleTarget.focus({preventScroll:true});
      } else if(changed) {
        window.scrollTo({top:0,behavior:"instant"});
        const title=document.getElementById("view-title-"+route);
        if(focus && title) title.focus({preventScroll:true});
      }
    });
    document.dispatchEvent(new CustomEvent("kp:view", {detail:{route,changed}}));
  }
  function go(route,target=null,focus=false) {
    if(!routes.has(route)) return;
    const hash="#/"+route+(target?"#"+encodeURIComponent(target):"");
    if(location.hash===hash) activate(route,target,{focus});
    else {
      location.hash=hash;
      activate(route,target,{focus});
    }
  }
  window.addEventListener("hashchange",()=>{const {route,target}=parseHash(location.hash);activate(route,target);});
  document.addEventListener("click",(event)=>{
    const a=event.target.closest?.('a[href^="#"]');
    if(!a || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href=a.getAttribute("href"), {route,target}=parseHash(href);
    if(!href || href==="#") return;
    event.preventDefault();
    go(route,target,true);
  });
  moreButton?.addEventListener("click",()=>{
    moreMenu.hidden=!moreMenu.hidden;
    moreButton.setAttribute("aria-expanded",String(!moreMenu.hidden));
  });
  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape" && moreMenu && !moreMenu.hidden) {
      moreMenu.hidden=true;
      moreButton?.setAttribute("aria-expanded","false");
      moreButton?.focus();
    }
  });
  document.addEventListener("pointerdown",(e)=>{
    if(moreMenu && !moreMenu.hidden && !mobile?.contains(e.target)) {
      moreMenu.hidden=true;
      moreButton?.setAttribute("aria-expanded","false");
    }
  });
  window.KPRouter={navigate:go, active:()=>active, routeFor:(id)=>idMap.get(id)||legacyTargets.get(id)||null, parseHash};
  const first=parseHash(location.hash);
  activate(first.route,first.target);
})();