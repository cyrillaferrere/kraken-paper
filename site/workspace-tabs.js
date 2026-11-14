/* Navigation de présentation uniquement : ne modifie jamais les données PAPER. */
(() => {
  "use strict";
  const tabs = [...document.querySelectorAll("[data-view-link]")];
  const panels = [...document.querySelectorAll("[data-workspace]")];
  if (!tabs.length || !panels.length) return;
  const routes = {
    overview: "overview", "market-card": "markets", "markers-h": "markets",
    "positions-panel": "orders", "orders-panel": "orders",
    "performance-panel": "history", "trades-panel": "history",
    "journal-panel": "history", "dec-h": "history", "cal-h": "history",
    "les-h": "history"
  };
  const views = new Set(["overview", "markets", "orders", "history"]);
  function routeFor(hash) {
    const id = decodeURIComponent((hash || "").replace(/^#/, ""));
    if (routes[id]) return routes[id];
    if (views.has(id)) return id;
    const target = document.getElementById(id);
    const panel = target && target.closest("[data-workspace]");
    return panel ? panel.dataset.workspace.split(" ").find(v => views.has(v)) : "overview";
  }
  const headings = {
    overview: ["Vue générale", "Portefeuille, marché et exposition en un regard."],
    markets: ["Marchés", "Cours, chandeliers et marqueurs de marché."],
    orders: ["Positions & ordres", "Exposition, ordres en attente et risques associés."],
    history: ["Analyse & historique", "Performance, décisions, trades et journal de simulation."]
  };
  function render() {
    const view = routeFor(window.location.hash);
    document.body.dataset.workspaceView = view;
    const title = document.getElementById("workspace-title");
    const description = document.getElementById("workspace-description");
    if (title) title.textContent = headings[view][0];
    if (description) description.textContent = headings[view][1];
    panels.forEach(panel => { panel.hidden = !panel.dataset.workspace.split(" ").includes(view); });
    tabs.forEach(tab => {
      if (tab.dataset.viewLink === view) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
  }
  window.addEventListener("hashchange", render);
  render();
})();
