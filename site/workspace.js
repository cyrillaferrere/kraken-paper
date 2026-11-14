/* Kraken Paper 0.2.1 — filtres de présentation uniquement.
   Aucune mutation des données de simulation, ni requête réseau. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const tables = [
    { name: "orders", search: "orders-search", choice: "orders-side", count: "orders-count" },
    { name: "markers", search: "markers-search", choice: "markers-trend", count: "markers-count" }
  ];
  const filters = (config) => {
    const tb = $(config.name)?.tBodies[0];
    if (!tb) return;
    const query = norm($(config.search).value), choice = $(config.choice).value;
    let total = 0, visible = 0;
    if (config.name === "orders") {
      let lastVisible = true;
      for (const row of tb.rows) {
        if (row.classList.contains("o-detail")) {
          row.style.display = lastVisible ? "" : "none";
          continue;
        }
        if (!row.classList.contains("o-row")) continue;
        total++;
        const text = norm(row.cells[0]?.textContent);
        const side = row.querySelector(".tag.buy") ? "buy" : row.querySelector(".tag.sell") ? "sell" : "";
        lastVisible = (!query || text.includes(query)) && (choice === "all" || side === choice);
        row.hidden = !lastVisible;
        if (lastVisible) visible++;
      }
    } else {
      for (const row of tb.rows) {
        total++;
        const text = norm(row.cells[0]?.textContent);
        const trends = [norm(row.cells[3]?.textContent), norm(row.cells[4]?.textContent)];
        const matchTrend = choice === "all" || trends.some((t) => choice === "up" ? t.includes("haussiere") : choice === "down" ? t.includes("baissiere") : t.includes("mixte"));
        const show = (!query || text.includes(query)) && matchTrend;
        row.hidden = !show;
        if (show) visible++;
      }
    }
    $(config.count).textContent = visible + " / " + total + " affiché" + (visible > 1 ? "s" : "") + (total && !visible ? " — aucun résultat, modifiez les filtres" : "");
  };
  for (const config of tables) {
    const tb = $(config.name)?.tBodies[0];
    if (!tb) continue;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; filters(config); });
    };
    $(config.search).addEventListener("input", schedule);
    $(config.choice).addEventListener("change", schedule);
    $(config.name + "-reset").addEventListener("click", () => {
      $(config.search).value = "";
      $(config.choice).value = "all";
      schedule();
      $(config.search).focus();
    });
    new MutationObserver(schedule).observe(tb, { childList: true, subtree: true, characterData: true });
    schedule();
  }
})();
