/* Journal : exploration de l'affichage uniquement. Les événements restent intacts. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const list = $("journal");
  if (!list) return;
  const search = $("journal-search"), type = $("journal-type"), count = $("journal-count");
  const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const groups = {
    decision: ["decision"],
    order: ["order_placed", "fill", "cancel", "rejected"],
    warning: ["warning", "rejected"],
    note: ["note"]
  };
  let scheduled = false;
  function update() {
    scheduled = false;
    const rows = Array.from(list.children).filter((li) => li.dataset.eventType);
    let shown = 0;
    for (const li of rows) {
      const matchText = norm(li.textContent).includes(norm(search.value.trim()));
      const matchType = type.value === "all" || (groups[type.value] || []).includes(li.dataset.eventType);
      li.hidden = !(matchText && matchType);
      if (!li.hidden) shown++;
    }
    count.textContent = shown + " / " + rows.length + " événements chargés" + (rows.length && !shown ? " — aucun résultat" : "");
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  search.addEventListener("input", schedule);
  type.addEventListener("change", schedule);
  $("journal-reset").addEventListener("click", () => {
    search.value = "";
    type.value = "all";
    schedule();
    search.focus();
  });
  new MutationObserver(schedule).observe(list, { childList: true });
  schedule();
})();
