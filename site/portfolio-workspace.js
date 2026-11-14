/* Kraken Paper : exploration visuelle du portefeuille et des trades.
   Le tri et les filtres agissent uniquement sur le DOM, jamais sur l'état PAPER. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const number = (s) => {
    const clean = String(s || "").replace(/[\u00a0\u202f\s]/g, "").replace(",", ".").replace(/[^0-9.+\-]/g, "");
    const n = Number.parseFloat(clean);
    return Number.isFinite(n) ? n : -Infinity;
  };
  function setup(name) {
    const tb = $(name)?.tBodies[0];
    if (!tb) return;
    const search = $(name + "-search"), choice = $(name + (name === "positions" ? "-sort" : "-side"));
    const count = $(name + "-count");
    let scheduled = false;
    const initialOrder = new WeakMap();
    let sequence = 0;
    function update() {
      scheduled = false;
      const rows = Array.from(tb.rows).filter((row) => !row.querySelector(".empty"));
      rows.forEach((row) => { if (!initialOrder.has(row)) initialOrder.set(row, sequence++); });
      if (name === "positions") {
        const col = choice.value === "value" ? 4 : choice.value === "pnl" ? 5 : 0;
        const sorted = rows.slice().sort((a, b) => {
          if (choice.value === "default") return initialOrder.get(a) - initialOrder.get(b);
          if (choice.value === "name") return norm(a.cells[0]?.textContent).localeCompare(norm(b.cells[0]?.textContent), "fr");
          return number(b.cells[col]?.textContent) - number(a.cells[col]?.textContent);
        });
        sorted.forEach((row, i) => {
          if (tb.rows[i] !== row) tb.insertBefore(row, tb.rows[i] || null);
        });
      }
      let shown = 0;
      for (const row of rows) {
        const matchText = !norm(search.value) || norm(name === "positions" ? row.cells[0]?.textContent : row.textContent).includes(norm(search.value));
        const matchSide = name === "positions" || choice.value === "all" || !!row.querySelector(".tag." + choice.value);
        row.hidden = !(matchText && matchSide);
        if (!row.hidden) shown++;
      }
      count.textContent = shown + " / " + rows.length + " affiché" + (shown > 1 ? "s" : "") + (rows.length && !shown ? " — aucun résultat" : "");
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }
    search.addEventListener("input", schedule);
    choice.addEventListener("change", schedule);
    $(name + "-reset").addEventListener("click", () => {
      search.value = "";
      choice.value = name === "positions" ? "default" : "all";
      schedule();
      search.focus();
    });
    new MutationObserver(schedule).observe(tb, { childList: true, subtree: true, characterData: true });
    schedule();
  }
  setup("positions");
  setup("trades");
})();
