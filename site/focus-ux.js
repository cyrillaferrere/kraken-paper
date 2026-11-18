/* Kraken Paper — UX v0.3.4, lecture seule. Aucun effet sur les décisions et l'exécution. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const market = $("market-card"), trigger = $("market-focus-toggle");
  const money = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
  const quantity = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 });
  const escape = (x) => String(x ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const usd = (n) => Number.isFinite(Number(n)) && n !== null ? money.format(Number(n)) + " USDC" : "—";
  const fmtPrice = (n) => {
    const x = Number(n);
    return n == null || !Number.isFinite(x) ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: x >= 1000 ? 2 : x >= 1 ? 4 : 8 }).format(x);
  };
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let focused = false, lastMarket = null, lastPortfolioKey = "", sparkPeriod = "24h";

  function setText(id, value) {
    const element = $(id);
    if (element && element.textContent !== value) element.textContent = value;
  }
  function setHtml(id, content) {
    const element = $(id);
    if (element && element.innerHTML !== content) element.innerHTML = content;
  }
  function setFocus(value) {
    if (!market || !trigger) return;
    focused = Boolean(value);
    document.body.classList.toggle("market-focus", focused);
    trigger.setAttribute("aria-pressed", String(focused));
    trigger.setAttribute("aria-label", focused ? "Quitter le mode Focus marché" : "Ouvrir le mode Focus marché");
    setText("market-focus-label", focused ? "Quitter le Focus" : "Mode Focus");
    // Le mode Focus est une vue agrandie, non une boîte de dialogue modale.
    market.removeAttribute("role");
    market.removeAttribute("aria-modal");
    trigger.focus({ preventScroll:true });
    window.requestAnimationFrame(() => window.KPMarkets?.resizeChart?.());
  }
  trigger?.addEventListener("click", () => setFocus(!focused));
  document.addEventListener("keydown", (event) => {
    if (focused && event.key === "Escape") {
      event.preventDefault();
      setFocus(false);
    }
  });

  function updateMarket(pair, ctx) {
    if (!pair || !ctx?.S) return;
    lastMarket = { pair, ctx };
    const S = ctx.S, orders = Array.isArray(S.open_orders) ? S.open_orders.filter((o) => o.pair === pair) : [];
    const base = S.pairs?.[pair]?.base || (pair === "XBTUSDC" ? "BTC" : pair.replace(/USDC$/, ""));
    const current = ctx.price?.(pair);
    setText("focus-pair-name", base + " / USDC");
    setText("focus-price", fmtPrice(current) + " USDC");
    const fresh = Boolean(ctx.liveOk && ctx.livePairs?.[pair] != null);
    const label = fresh ? "Cours direct Kraken" : Number.isFinite(Number(current)) && current != null ? "Dernier prix connu — pas en direct" : "Cours indisponible";
    setText("focus-freshness", label);
    const position = S.positions?.[pair];
    if (position) {
      const qty = Number(position.qty), avg = Number(position.avg_cost);
      const pnl = Number.isFinite(current) && Number.isFinite(qty) && Number.isFinite(avg) ? qty * (current - avg) : null;
      setHtml("focus-position", '<dl class="focus-facts"><div><dt>Quantité</dt><dd>' + quantity.format(qty) + " " + escape(base) + '</dd></div><div><dt>Prix de revient</dt><dd>' + fmtPrice(avg) + ' USDC</dd></div><div><dt>P&L latent</dt><dd class="' + (pnl != null ? pnl >= 0 ? "up" : "dn" : "") + '">' + (pnl == null ? "—" : usd(pnl)) + "</dd></div></dl>");
    } else {
      setHtml("focus-position", '<p class="focus-empty">Aucune position détenue sur cette paire.</p>');
    }
    if (!orders.length) {
      setHtml("focus-orders", '<p class="focus-empty">Aucun ordre ouvert sur cette paire.</p>');
    } else {
      const items = orders.map((o) => {
        const limit = o.price != null ? fmtPrice(o.price) : "—";
        const stop = o.stop_loss != null ? fmtPrice(o.stop_loss) : "—";
        const tiers = Array.isArray(o.take_profits) && o.take_profits.length ? o.take_profits.map((t,i) => "TP" + (i + 1) + " " + fmtPrice(t.price)).join(" · ") : o.take_profit != null ? "TP " + fmtPrice(o.take_profit) : "";
        const desc = "Limite " + limit + " · Stop " + stop + (tiers ? " · " + tiers : "");
        return '<li><button type="button" data-focus-order="' + escape(o.id) + '" title="' + escape(desc) + '" aria-label="' + escape(o.id + " · " + (o.side === "buy" ? "Achat" : "Vente") + ". " + desc + ". Voir les détails") + '"><span class="focus-order-copy"><b>' + escape(o.id) + " · " + (o.side === "buy" ? "Achat" : "Vente") + "</b><small>" + escape(desc) + '</small></span><span class="focus-order-arrow" aria-hidden="true">↗</span></button></li>';
      }).join("");
      setHtml("focus-orders", '<ul class="focus-order-list">' + items + "</ul>");
    }
  }
  function visitPair(pair) {
    if (!pair || !window.KPMarkets?.selectPair) return;
    window.KPMarkets.selectPair(pair);
    if (window.KPRouter) window.KPRouter.navigate("marches", "market-card");
    else market.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }
  document.addEventListener("click", (event) => {
    const p = event.target.closest("[data-market-pair]");
    if (p) { event.preventDefault(); visitPair(p.dataset.marketPair); return; }
    const order = event.target.closest("[data-focus-order]");
    if (order) {
      const id = order.dataset.focusOrder;
      if (focused) setFocus(false);
      window.KPRouter?.navigate("portefeuille", "orders-panel");
      const b = [...document.querySelectorAll("#orders .o-toggle")].find((el) => el.dataset.oid === id);
      if (b) {
        if (b.getAttribute("aria-expanded") !== "true") b.click();
        $("orders-panel")?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
        b.focus({ preventScroll: true });
      }
    }
  });

  function drawSpark(equity) {
    const all = Array.isArray(equity) ? equity.filter((p) => Number.isFinite(p.t) && Number.isFinite(p.eq)) : [];
    const end = all.length ? all[all.length - 1].t : 0;
    const start = end - (sparkPeriod === "24h" ? 24 : 168) * 3600000;
    const points = all.filter((p) => p.t >= start && p.t <= end);
    const holder = $("mini-equity");
    if (!holder) return;
    document.querySelectorAll("[data-spark-period]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sparkPeriod === sparkPeriod)));
    if (points.length < 2) {
      holder.replaceChildren();
      holder.textContent = "Historique insuffisant sur cette période";
      holder.setAttribute("aria-label", "Historique insuffisant sur " + sparkPeriod);
      setText("mini-perf-summary", "Moins de deux cycles disponibles");
      return;
    }
    const lo = Math.min(...points.map((p) => p.eq)), hi = Math.max(...points.map((p) => p.eq));
    const minY = lo === hi ? lo - 1 : lo, maxY = lo === hi ? hi + 1 : hi;
    const w = 600, h = 90, pad = 7, t0 = points[0].t, t1 = points[points.length-1].t;
    const x = (p) => pad + (p.t-t0)/(t1-t0)*(w-2*pad);
    const y = (p) => h-pad-(p.eq-minY)/(maxY-minY)*(h-2*pad);
    let paths = [], segment = "", previous = null;
    for (const p of points) {
      // Un intervalle absent ne devient jamais une fausse performance continue.
      if (previous && p.t - previous.t > 2.5 * 3600000) { if (segment) paths.push(segment); segment = ""; }
      segment += (segment ? " L" : "M") + x(p).toFixed(2) + " " + y(p).toFixed(2);
      previous = p;
    }
    if (segment) paths.push(segment);
    const delta = points[points.length-1].eq - points[0].eq;
    const text = (delta > 0 ? "+" : "") + money.format(delta) + " USDC · " + points.length + " cycles";
    const color = delta > 0 ? "#42d6a2" : delta < 0 ? "#ff7e8a" : "#91acb5";
    const pathsMarkup = paths.map((d) => '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>').join("");
    holder.innerHTML = '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true"><path d="M0 83 H600" stroke="#33444d" stroke-width="1" stroke-dasharray="3 7"/>' + pathsMarkup + '</svg>';
    holder.setAttribute("aria-label", "Historique réel, " + sparkPeriod + ", " + text + ". Des ruptures indiquent les cycles absents.");
    setText("mini-perf-summary", text);
  }
  let lastEquity = [];
  function onPortfolio({ equity }) {
    const all = Array.isArray(equity) ? equity : [];
    const key = sparkPeriod + "|" + all.length + "|" + (all.length ? all[all.length-1].t + ":" + all[all.length-1].eq : "");
    if (key === lastPortfolioKey) return;
    lastPortfolioKey = key;
    lastEquity = all;
    drawSpark(all);
  }
  document.querySelectorAll("[data-spark-period]").forEach((b) => b.addEventListener("click", () => {
    sparkPeriod = b.dataset.sparkPeriod;
    lastPortfolioKey = "";
    onPortfolio({ equity: lastEquity });
  }));

  // Le routeur SPA v0.3.6 gère désormais intégralement la navigation mobile.
  window.KPFocus = { updateMarket, onPortfolio, close: () => setFocus(false) };
})();
