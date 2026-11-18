/* Kraken Paper v0.3.5 — présentation / lecture seule.
   Carnet: instantanés API publique Kraken. Aucune exécution ni écriture d'état. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const nf = (digits = 2) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits });
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safe = (v) => Number.isFinite(Number(v)) && v != null ? Number(v) : null;
  const money = (v, dp = 2) => safe(v) == null ? "—" : nf(dp).format(v);
  const show = (id, txt) => { const el = $(id); if (el && el.textContent !== txt) el.textContent = txt; };
  const html = (id, txt) => { const el = $(id); if (el && el.innerHTML !== txt) el.innerHTML = txt; };
  const datetime = (s) => {
    const t = typeof s === "number" ? (s < 1e11 ? s * 1000 : s) : Date.parse(s);
    return Number.isFinite(t) ? new Date(t).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Date inconnue";
  };
  const numberPx = (v) => { const n = safe(v); return n == null ? "—" : money(n, n >= 1000 ? 2 : n >= 1 ? 4 : 8); };

  // Une réponse contient une clé de marché dynamique, différente du symbole demandé.
  // Validation stricte: prix/quantité > 0 et tri obligatoire avant métriques.
  function normalizeBook(payload) {
    if (!payload || !Array.isArray(payload.error) || payload.error.length || !payload.result || typeof payload.result !== "object") return null;
    const found = Object.values(payload.result).find((x) => x && Array.isArray(x.bids) && Array.isArray(x.asks));
    if (!found) return null;
    const rows = (items, ascending) => items.map((r) => [safe(r?.[0]), safe(r?.[1])])
      .filter(([p,q]) => p != null && q != null && p > 0 && q > 0)
      .sort((a,b) => ascending ? a[0]-b[0] : b[0]-a[0]).slice(0,10);
    const bids = rows(found.bids, false), asks = rows(found.asks, true);
    if (!bids.length || !asks.length || asks[0][0] < bids[0][0]) return null;
    const bestBid = bids[0][0], bestAsk = asks[0][0], mid = (bestAsk + bestBid) / 2;
    const spread = bestAsk - bestBid;
    const bidsQuote = bids.reduce((v, [p,q]) => v + p*q, 0);
    const asksQuote = asks.reduce((v, [p,q]) => v + p*q, 0);
    return { bids, asks, bestBid, bestAsk, spread, spreadPct: mid ? spread / mid * 100 : null, bidsQuote, asksQuote };
  }

  let pair = null, lastBookPair = null, startedAt = 0, token = 0, busy = false, controller = null, nextAllowed = 0;
  const BOOK_INTERVAL = 18000;
  const marketVisible = () => !window.KPRouter || window.KPRouter.active() === "terminal";
  function clearBook(label) {
    for (const id of ["book-bid", "book-ask", "book-spread"]) show(id, "—");
    show("book-spread-pct", "— %");
    for (const id of ["book-bids","book-asks"]) html(id, '<p class="v035-quiet">Aucune profondeur disponible.</p>');
    show("book-status", label);
  }
  function drawSide(id, rows, maxQuote, klass) {
    const side = rows.map(([price,qty]) => {
      const percent = maxQuote ? Math.min(100, price*qty/maxQuote*100) : 0;
      return '<div class="v035-depth-row ' + klass + '" aria-label="Prix ' + esc(numberPx(price)) + ', quantité ' + esc(money(qty,6)) + '"><i style="width:' + percent.toFixed(1) + '%" aria-hidden="true"></i><span>' + esc(numberPx(price)) + '</span><span>' + esc(money(qty,5)) + '</span></div>';
    }).join("");
    html(id, side);
  }
  function renderBook(book, at) {
    show("book-bid", numberPx(book.bestBid));
    show("book-ask", numberPx(book.bestAsk));
    show("book-spread", money(book.spread, 6));
    show("book-spread-pct", money(book.spreadPct, 3) + " %");
    const maxQuote = Math.max(...book.bids.concat(book.asks).map(([p,q])=>p*q), 1);
    drawSide("book-bids", book.bids, maxQuote, "bid");
    drawSide("book-asks", book.asks, maxQuote, "ask");
    show("book-status", "Instantané Kraken · " + new Date(at).toLocaleTimeString("fr-FR", { timeZone:"Europe/Paris" }) + " · 10 niveaux / côté");
  }
  async function refreshBook(force = false) {
    if (!pair || document.hidden || !marketVisible() || busy || (!force && Date.now() < nextAllowed)) return;
    const requested = pair, current = ++token;
    busy = true;
    controller?.abort();
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    show("book-status", "Lecture du carnet " + pair + "…");
    try {
      const res = await fetch("https://api.kraken.com/0/public/Depth?pair=" + encodeURIComponent(requested) + "&count=10", {
        signal: controller.signal, cache: "no-store"
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const book = normalizeBook(await res.json());
      if (!book) throw new Error("carnet indisponible");
      if (current !== token || requested !== pair) return;
      renderBook(book, Date.now());
      lastBookPair = requested;
      startedAt = Date.now();
    } catch (_) {
      if (current === token && pair === requested) {
        // Un ancien carnet ne doit pas paraître frais après une erreur.
        clearBook("Carnet indisponible · nouvel essai automatique");
      }
    } finally {
      clearTimeout(timeout);
      if (current === token) {
        busy = false;
        nextAllowed = Date.now() + BOOK_INTERVAL;
      }
    }
  }
  function switchPair(p) {
    if (!p || !/^[A-Z0-9]{2,24}$/.test(p)) return;
    if (p === pair) return;
    pair = p;
    token++;
    controller?.abort();
    busy = false;
    nextAllowed = 0;
    clearBook("Chargement du carnet " + p + "…");
    refreshBook(true);
  }
  $("book-refresh")?.addEventListener("click", () => {
    if (!busy) { nextAllowed = 0; refreshBook(true); }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && marketVisible() && pair && Date.now() - startedAt > BOOK_INTERVAL) {
      nextAllowed = 0;
      refreshBook(true);
    }
  });
  setInterval(() => {
    if (pair && !document.hidden && marketVisible()) refreshBook();
  }, 4000);
  document.addEventListener("kp:view", (event) => {
    if (event.detail?.route === "terminal") {
      nextAllowed = 0;
      refreshBook(true);
    } else {
      token++;
      controller?.abort();
      busy = false;
      nextAllowed = 0;
    }
  });

  function renderIndicators(metric) {
    if (!metric || metric.loading) {
      html("focus-indicators", '<p class="focus-empty">Indicateurs non calculés pour cette paire.</p>');
      return;
    }
    const signed = (x, suffix) => x == null ? "—" : (x >= 0 ? "+" : "−") + money(Math.abs(x), 2) + suffix;
    const rsi = metric.rsi == null ? "—" : money(metric.rsi, 1);
    const trend4 = metric.t4?.t || "—", trend1 = metric.t1?.t || "—";
    const cells = [
      ["Tendance 4 h", trend4], ["Tendance 1 j", trend1],
      ["RSI 14 (4 h)", rsi], ["ATR 14 (1 j)", metric.atrp == null ? "—" : money(metric.atrp,1)+" %"],
      ["Variation 24 h", signed(metric.ch24, " %")],
      ["Force vs BTC 7 j", metric.rs === "ref" ? "Référence" : signed(metric.rs," pts")],
    ];
    html("focus-indicators", '<dl class="v035-indicators">' + cells.map(([k,v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join("") + "</dl>");
  }
  function renderOrderLevels(p, ctx) {
    if (!ctx?.S) return;
    const orders = (ctx.S.open_orders || []).filter((o) => o.pair === p);
    const pos = ctx.S.positions?.[p];
    const nodes = [];
    if (pos?.avg_cost != null) nodes.push('<span class="v035-level v035-level-pru">PRU · ' + esc(numberPx(pos.avg_cost)) + '</span>');
    for (const o of orders.slice(0, 9)) {
      const entry = o.side === "buy";
      const showOrder = (price, label, conditional = false) => {
        if (price == null) return;
        nodes.push('<button class="v035-level ' + (entry ? "v035-level-buy" : "v035-level-sell") +
          '" type="button" data-v035-order="' + esc(o.id) + '" title="Ouvrir les détails de l’ordre ' + esc(o.id) + '">' +
          esc(label) + ' · ' + esc(numberPx(price)) + (conditional ? ' <small>si achat exécuté</small>' : '') + '</button>');
      };
      showOrder(o.price, entry ? "Achat limite" : "Vente / objectif");
      showOrder(o.stop_loss, "Stop", entry);
      if (Array.isArray(o.take_profits) && o.take_profits.length) {
        o.take_profits.slice(0,3).forEach((t,i) => showOrder(t.price, "TP" + (i+1), entry));
      } else showOrder(o.take_profit, "Objectif", entry);
    }
    html("chart-order-levels", nodes.length ? '<span class="v035-level-label">NIVEAUX SUR LE GRAPHIQUE</span>' + nodes.join("") : '<span class="hint">Aucun niveau PAPER actif pour cette paire.</span>');
  }
  // Niveaux purement descriptifs issus des positions et ordres PAPER existants.
  // Un stop ou TP associé à un achat en attente n'est pas une protection active.
  function collectPriceLevels(pair, state, price) {
    const rows = [];
    const push = (label, raw, kind, conditional=false, orderId=null) => {
      const value = Number(raw);
      if (raw == null || !Number.isFinite(value) || value <= 0) return;
      rows.push({ label, value, kind, conditional, orderId,
        distance: Number.isFinite(price) && price > 0 ? (value / price - 1) * 100 : null });
    };
    if (Number.isFinite(price) && price > 0) push("Cours observé", price, "current");
    const pos = state?.positions?.[pair];
    if (pos) push("Prix de revient", pos.avg_cost, "pru");
    const orders = Array.isArray(state?.open_orders) ? state.open_orders.filter(o=>o.pair===pair) : [];
    for (const order of orders.slice(0,8)) {
      const pendingBuy = order.side === "buy";
      push(pendingBuy ? "Achat limite" : "Vente limite", order.price, pendingBuy ? "entry" : "target", false, order.id);
      push("Stop", order.stop_loss, "stop", pendingBuy, order.id);
      if (Array.isArray(order.take_profits) && order.take_profits.length) {
        order.take_profits.slice(0,3).forEach((tp,i)=>push("TP"+(i+1),tp.price,"target",pendingBuy,order.id));
      } else push("Objectif",order.take_profit,"target",pendingBuy,order.id);
    }
    return rows;
  }
  const distanceLabel = v => v == null ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "±") + money(Math.abs(v),2) + " %";
  let lastMarketCtx=null, lastMarketPair=null, lastJournal=[], lastPriceSig="", lastPairEventsSig="";
  function renderPriceScale(pair, ctx) {
    const el = $("v036-price-scale");
    if (!el || !ctx?.S) return;
    const current = safe(ctx.price?.(pair)), price = current != null && current > 0 ? current : null;
    const rows = collectPriceLevels(pair,ctx.S,price);
    const sig = JSON.stringify([pair,rows]);
    if (sig === lastPriceSig) return;
    lastPriceSig=sig;
    if (!rows.length) {
      el.innerHTML='<p class="v036-empty">Aucun niveau connu pour cette paire.</p>';
      el.setAttribute("aria-label","Aucun niveau PAPER disponible");
      return;
    }
    const values=rows.map(r=>r.value);
    let min=Math.min(...values), max=Math.max(...values);
    if(min===max){min*=.995;max*=1.005;}
    const span=max-min;
    const line='<div class="v036-ruler-track" aria-hidden="true">' + rows.map(r => {
      const left=Math.max(2,Math.min(98,(r.value-min)/span*100));
      return '<span class="v036-ruler-pin v036-ruler-'+esc(r.kind)+'" style="left:'+left.toFixed(2)+'%" title="'+esc(r.label+' · '+numberPx(r.value))+'"></span>';
    }).join("")+'</div>';
    const items=rows.map(r => {
      const detail=esc(r.label+(r.conditional?" · si achat exécuté":"")+" · "+numberPx(r.value)+" USDC · "+distanceLabel(r.distance));
      return '<li class="v036-level-row v036-kind-'+esc(r.kind)+'" title="'+detail+'"><span class="v036-level-name">'+esc(r.label)+'</span><span class="v036-level-value">'+esc(numberPx(r.value))+' <small>USDC</small></span><span class="v036-level-distance">'+esc(distanceLabel(r.distance))+'</span>'+(r.conditional?'<small class="v036-conditional">si achat exécuté</small>':'')+'</li>';
    }).join("");
    el.innerHTML=line+'<ul class="v036-level-list">'+items+'</ul>';
    el.setAttribute("aria-label",rows.map(r=>r.label+": "+numberPx(r.value)+" USDC, "+distanceLabel(r.distance)+(r.conditional?", si achat exécuté":"")).join(". "));
  }
  const eventLabels = {
    order_placed:"Ordre créé", fill:"Exécution", rejected:"Action refusée",
    cancel:"Ordre annulé", exits_updated:"Protections modifiées",
    exits_update_scheduled:"Protections programmées", market:"Ordre au marché"
  };
  function recentPairEvents(journal,pair) {
    if (!Array.isArray(journal)||!pair) return [];
    return journal.filter(e => {
      if (!e || !Object.prototype.hasOwnProperty.call(eventLabels,e.type)) return false;
      // Référence explicite seulement : aucune association inventée par proximité temporelle.
      return (e.order?.pair || e.trade?.pair || e.pair) === pair;
    }).slice(-4).reverse().map(e=>({
      type:e.type, label:eventLabels[e.type], time:e.time || e.timestamp || e.trade?.ts || null,
      orderId:e.order?.id || e.order_id || e.trade?.order_id || null,
      decisionId:e.decision_id || null,
      price:e.trade?.price ?? e.order?.price ?? e.price ?? null
    }));
  }
  function renderPairEvents(pair,journal) {
    const el=$("v036-pair-events");
    if(!el)return;
    const events=recentPairEvents(journal,pair),sig=JSON.stringify([pair,events]);
    if(sig===lastPairEventsSig)return;
    lastPairEventsSig=sig;
    if(!events.length){
      el.innerHTML='<li class="v036-empty">Aucun événement associé explicitement à cette paire dans le journal disponible.</li>';
      return;
    }
    el.innerHTML=events.map(e=>'<li class="v036-event"><span class="v036-event-time">'+esc(datetime(e.time))+'</span><span class="v036-event-info"><strong>'+esc(e.label)+'</strong>'+(e.orderId?'<small>Ordre '+esc(e.orderId)+'</small>':'')+(e.price!=null?'<small>'+esc(numberPx(e.price))+' USDC</small>':'')+'</span><a href="#/activite#journal-panel" class="v036-event-link" aria-label="Consulter le journal d’audit pour '+esc(e.label)+'">Journal ↗</a></li>').join("");
  }
  function onMarket(p, metric, ctx) {
    lastMarketPair=p;
    lastMarketCtx=ctx;
    switchPair(p);
    renderIndicators(metric);
    renderOrderLevels(p, ctx);
    renderPriceScale(p,ctx);
    renderPairEvents(p,lastJournal);
  }

  // Comparaison sans extrapolation : uniquement la même fenêtre et les mêmes cycles.
  function summarizePerformance(equity, period) {
    const duration = { "1d":86400000, "7d":604800000, "30d":2592000000, "90d":7776000000, "180d":15552000000, "365d":31536000000 };
    const all = (Array.isArray(equity) ? equity : []).filter((e) => Number.isFinite(e?.t) && Number.isFinite(e?.eq)).sort((a,b)=>a.t-b.t);
    if (!all.length) return null;
    const end = all[all.length-1].t, start = period==="all" ? -Infinity : end - (duration[period] || duration["7d"]);
    const pts = all.filter((e) => e.t >= start);
    if (pts.length < 2) return null;
    const a = pts[0], b = pts[pts.length-1];
    const p = b.eq - a.eq, changePct = a.eq ? p/a.eq*100 : null;
    const btcAvailable = Number.isFinite(a.hold) && Number.isFinite(b.hold) && a.hold > 0;
    const btcPct = btcAvailable ? (b.hold/a.hold-1)*100 : null;
    return { first:a.eq, last:b.eq, pnl:p, pct:changePct, btcPct,
      excessPct:btcPct == null || changePct == null ? null : changePct-btcPct,
      count:pts.length, firstTime:a.t, lastTime:b.t };
  }
  let lastEquity = [], activePeriod = "all";
  function refreshPerformance() {
    const summary = summarizePerformance(lastEquity, activePeriod);
    if (!summary) {
      for (const id of ["perf-start","perf-end","perf-change","perf-vs-btc"]) show(id, "—");
      return;
    }
    show("perf-start", money(summary.first)+" USDC");
    show("perf-end", money(summary.last)+" USDC");
    show("perf-change", (summary.pnl > 0 ? "+" : "") + money(summary.pnl)+" USDC · "+(summary.pct == null ? "—" : (summary.pct > 0 ? "+" : "")+money(summary.pct)+" %"));
    show("perf-vs-btc", summary.excessPct == null ? "—" : (summary.excessPct > 0 ? "+" : "") + money(summary.excessPct)+" pts");
    const end = $("perf-change");
    if (end) end.className = summary.pnl < 0 ? "dn" : summary.pnl > 0 ? "up" : "";
    const gap = $("perf-vs-btc");
    if (gap) gap.className = summary.excessPct < 0 ? "dn" : summary.excessPct > 0 ? "up" : "";
  }
  document.querySelectorAll(".equity-range").forEach((b) => b.addEventListener("click", () => {
    activePeriod = b.dataset.period;
    refreshPerformance();
  }));

  function buildTimeline(journal) {
    if (!Array.isArray(journal)) return [];
    const types = new Set(["decision","order_placed","fill","rejected","cancel","exits_updated","exits_update_scheduled"]);
    return journal.filter((e)=>e && types.has(e.type)).slice(-80).reverse().map((e) => {
      const id = e.decision_id ? String(e.decision_id) : null;
      const order = e.order || null, tr = e.trade || null;
      const orderId = order?.id || e.order_id || tr?.order_id || null;
      const symbol = order?.pair || tr?.pair || e.pair || null;
      const labels = { decision:"Décision", order_placed:"Ordre créé", fill:"Exécution", rejected:"Refus", cancel:"Annulation", exits_updated:"Protections modifiées", exits_update_scheduled:"Protections programmées" };
      return { type:e.type, label:labels[e.type], when:e.time || e.timestamp || tr?.ts || null, id, orderId:String(orderId || ""),
        symbol, side:tr?.side || order?.side || null, price:tr?.price ?? order?.price ?? null, reason:e.reason || null };
    }).slice(0,36);
  }
  let timelineOpen = false, timelineSig = "";
  const toggle = $("timeline-toggle"), timeline = $("event-timeline");
  toggle?.addEventListener("click", () => {
    timelineOpen = !timelineOpen;
    timeline.hidden = !timelineOpen;
    toggle.setAttribute("aria-expanded", String(timelineOpen));
    toggle.textContent = timelineOpen ? "Masquer la chronologie" : "Afficher la chronologie";
  });
  function renderTimeline(journal) {
    const events = buildTimeline(journal);
    const sig = JSON.stringify(events);
    if (sig === timelineSig) return;
    timelineSig = sig;
    html("event-timeline-list", events.length ? events.map((e) => {
      const stamp = datetime(e.when);
      const desc = (e.symbol ? esc(e.symbol) + " · " : "") + (e.side ? (e.side==="buy"?"Achat":"Vente") + " · " : "") + (e.price == null ? "" : numberPx(e.price)+" USDC");
      const anchor = e.id ? '<a href="#dec-h" data-v035-decision="' + esc(e.id) + '">Décision ' + esc(e.id) + '</a>' : "";
      const badge = e.orderId ? '<button type="button" data-v035-order="' + esc(e.orderId) + '">Ordre ' + esc(e.orderId) + '</button>' : "";
      return '<div class="v035-event v035-event-' + esc(e.type) + '"><time>' + esc(stamp) + '</time><div><strong>' + esc(e.label) + '</strong><small>' + desc + '</small><div class="v035-event-refs">' + anchor + badge + '</div></div></div>';
    }).join("") : '<p class="hint">Aucun événement de décision ou d’exécution disponible.</p>');
  }
  document.addEventListener("click", (event) => {
    const o = event.target.closest("[data-v035-order]");
    if (o) {
      const id = o.dataset.v035Order;
      const button = [...document.querySelectorAll("#orders .o-toggle")].find((b) => b.dataset.oid === id);
      if (!button) return;
      if (document.body.classList.contains("market-focus")) window.KPFocus?.close();
      window.KPRouter?.navigate("portefeuille", "orders-panel");
      if (button.getAttribute("aria-expanded") !== "true") button.click();
      $("orders-panel")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start" });
      button.focus({preventScroll:true});
      return;
    }
    const a = event.target.closest("[data-v035-decision]");
    if (!a) return;
    const ref = a.dataset.v035Decision;
    const details = [...document.querySelectorAll("#dec-feed details[data-id]")].find((x)=>x.dataset.id===ref);
    if (!details) return;
    event.preventDefault();
    window.KPRouter?.navigate("activite", "decisions-panel");
    details.open = true;
    details.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    details.querySelector("summary")?.focus({ preventScroll:true });
  });

  function onPortfolio(data) {
    lastEquity = data.equity || [];
    lastJournal = Array.isArray(data.journal) ? data.journal : [];
    renderTimeline(lastJournal);
    if (lastMarketPair) renderPairEvents(lastMarketPair,lastJournal);
    refreshPerformance();
  }
  window.KPV035 = { onMarket, onPortfolio, normalizeBook, summarizePerformance, buildTimeline, collectPriceLevels, recentPairEvents };
})();
