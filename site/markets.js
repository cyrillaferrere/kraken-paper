/* Kraken Paper - marchés : bougies, moyennes mobiles, RSI, volume, marqueurs.
   Tout est calculé dans le navigateur à partir de l'API PUBLIQUE Kraken (OHLC, AssetPairs).
   Aucune clé, aucune donnée inventée : on affiche les bougies telles que Kraken les renvoie. */
(() => {
  "use strict";
  const API = "https://api.kraken.com/0/public/";
  const BENCH = "XBTUSDC";
  // Liste de suivi : paires USDC ouvertes en France, classées par volume 24 h (Ticker public, 13/11/2026),
  // hors stablecoins et memecoins. Le site revérifie chaque paire via AssetPairs?country_code=FR.
  const WATCH = ["XBTUSDC", "ETHUSDC", "SOLUSDC", "XRPUSDC", "LINKUSDC", "AVAXUSDC", "ADAUSDC", "XDCUSDC",
    "LTCUSDC", "BNBUSDC", "XDGUSDC", "TONUSDC", "DOTUSDC", "BCHUSDC"];
  const BASE_NAMES = { XBT: "BTC", XDG: "DOGE" };
  const TF = { "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440 };
  const TF_LBL = { "5m": "5 min", "15m": "15 min", "30m": "30 min", "1h": "1 h", "4h": "4 h", "1d": "1 j" };
  // Cache des bougies par intervalle (minutes) et rafraîchissement du graphique ouvert, adapté à l'intervalle.
  // Au pire une requête OHLC toutes les 30 s pour le graphique (5 min) : très en dessous de la limite publique Kraken.
  const TTL = { 5: 60e3, 15: 120e3, 30: 180e3, 60: 180e3, 240: 300e3, 1440: 900e3 };
  const REFRESH = { 5: 30e3, 15: 60e3, 30: 90e3, 60: 60e3, 240: 120e3, 1440: 300e3 };
  const C = { up: "#34d399", dn: "#f87171", mu: "#8a96b3", line: "#243049", ac: "#7c5cff", ac2: "#22d3ee", warn: "#fbbf24", tx: "#e8ecf6", ma50: "#f472b6" };
  window.KP_WATCH = WATCH;

  const $ = (id) => document.getElementById(id);
  const nf = (d) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (x, d = 2) => x == null || isNaN(x) ? "—" : (x > 0 ? "+" : x < 0 ? "−" : "") + nf(d).format(Math.abs(x));
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const qtyf = (x) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 }).format(x);

  // ---------- indicateurs (fonctions pures, testées hors navigateur) ----------
  function sma(v, n) {
    const out = new Array(v.length).fill(null); let s = 0;
    for (let i = 0; i < v.length; i++) { s += v[i]; if (i >= n) s -= v[i - n]; if (i >= n - 1) out[i] = s / n; }
    return out;
  }
  function rsi(v, n = 14) { // RSI de Wilder
    const out = new Array(v.length).fill(null);
    if (v.length <= n) return out;
    let g = 0, l = 0;
    for (let i = 1; i <= n; i++) { const d = v[i] - v[i - 1]; if (d > 0) g += d; else l -= d; }
    g /= n; l /= n;
    out[n] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    for (let i = n + 1; i < v.length; i++) {
      const d = v[i] - v[i - 1];
      g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n;
      out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    }
    return out;
  }
  function atr(c, n = 14) { // ATR de Wilder, c = [{h,l,c}]
    const out = new Array(c.length).fill(null);
    if (c.length <= n) return out;
    const tr = c.map((b, i) => i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - c[i - 1].c), Math.abs(b.l - c[i - 1].c)));
    let a = 0; for (let i = 1; i <= n; i++) a += tr[i]; a /= n; out[n] = a;
    for (let i = n + 1; i < c.length; i++) { a = (a * (n - 1) + tr[i]) / n; out[i] = a; }
    return out;
  }
  window.KP_IND = { sma, rsi, atr };

  // ---------- accès API publique, en file pour ménager la limite Kraken ----------
  let queue = Promise.resolve();
  const SPACING = 450;
  function apiGet(path) {
    const p = queue.then(async () => {
      const r = await fetch(API + path, { cache: "no-store" });
      const d = await r.json();
      if (d.error && d.error.length) throw new Error(d.error.join(", "));
      return d.result;
    });
    queue = p.catch(() => {}).then(() => new Promise((res) => setTimeout(res, SPACING)));
    return p;
  }
  const cache = new Map(); // "pair|iv" -> {at, bars, pending}
  async function ohlc(pair, iv, force) {
    const k = pair + "|" + iv, c = cache.get(k);
    if (c && c.pending) return c.pending;
    if (c && !force && Date.now() - c.at < TTL[iv]) return c.bars;
    const pending = apiGet(`OHLC?pair=${pair}&interval=${iv}`).then((res) => {
      const bars = window.KPOHLC.parse(res);
      cache.set(k, { at: Date.now(), bars });
      return bars;
    }).catch((e) => { if (c) cache.set(k, c); else cache.delete(k); throw e; });
    cache.set(k, Object.assign({}, c, { pending }));
    return pending;
  }

  // ---------- paires suivies ----------
  let meta = {}, metaLoaded = false; // altname -> {base, dec}
  async function loadMeta(pairs) {
    const miss = pairs.filter((p) => !meta[p]);
    if (!miss.length) return;
    // country_code=FR : Kraken ne renvoie que les paires accessibles depuis la France.
    const res = await apiGet(`AssetPairs?pair=${miss.join(",")}&country_code=FR`);
    metaLoaded = true;
    for (const v of Object.values(res)) {
      if (v.quote !== "USDC" && !v.altname.endsWith("USDC")) continue;
      const b = (v.wsname || v.altname).split("/")[0];
      meta[v.altname] = { base: BASE_NAMES[b] || b, dec: +v.pair_decimals, ok: v.status === "online" };
    }
  }
  let ctx = { S: null, journal: [], price: () => null };
  const selected = { pair: BENCH, tf: "1h" };

  function trackedPairs() {
    const S = ctx.S, out = [];
    const add = (p) => { if (p && !out.includes(p)) out.push(p); };
    if (S) { Object.keys(S.positions || {}).forEach(add); (S.open_orders || []).forEach((o) => add(o.pair)); }
    WATCH.forEach(add);
    const mine = (p) => S && (S.positions[p] || (S.open_orders || []).some((o) => o.pair === p));
    // Une paire de la liste absente de la réponse France (ou hors ligne) est écartée ; on garde toujours ce qu'on détient.
    return out.filter((p) => mine(p) || (meta[p] ? meta[p].ok !== false : !metaLoaded));
  }
  const baseOf = (p) => (meta[p] && meta[p].base) || (ctx.S && ctx.S.pairs[p] && ctx.S.pairs[p].base) || (BASE_NAMES[p.replace(/USDC$/, "")] || p.replace(/USDC$/, ""));
  const decOf = (p) => (meta[p] && meta[p].dec) ?? (ctx.S && ctx.S.pairs[p] && ctx.S.pairs[p].pair_decimals) ?? 2;
  const pxf = (p, x) => x == null || isNaN(x) ? "—" : nf(Math.min(decOf(p), x >= 1000 ? 2 : 8)).format(x);

  // ---------- puces de paires ----------
  function renderChips() {
    const box = $("pair-chips"), pairs = trackedPairs(), S = ctx.S;
    const sig = pairs.join(",") + "|" + (S ? Object.keys(S.positions).join(",") + (S.open_orders || []).map((o) => o.pair).join(",") : "");
    const mark = () => box.querySelectorAll("[data-pair]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.pair === selected.pair));
    if (box.dataset.sig === sig) return mark();
    box.dataset.sig = sig;
    box.innerHTML = pairs.map((p) => {
      const held = S && S.positions[p], ord = S && (S.open_orders || []).some((o) => o.pair === p);
      const tag = held ? '<span class="chip-tag">détenu</span>' : ord ? '<span class="chip-tag">ordre</span>' : "";
      return `<button type="button" class="chip motion-button" data-pair="${esc(p)}" aria-pressed="${p === selected.pair}">${esc(baseOf(p))}${tag}</button>`;
    }).join("");
  }

  // ---------- graphique principal ----------
  let levelPrices = [];
  let chart = null, sCandle, sMa20, sMa50, sVol, sRsi, markersApi, priceLines = [], linesSig = "", markersSig = "";
  let shown = { key: null, lastT: null, bars: [] };
  let viewBars = 120;
  function applyChartRange() {
    if (!chart || !shown.bars.length) return;
    const total = shown.bars.length;
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, total - viewBars), to: total + 3 });
    syncChartRange();
  }
  function syncChartRange() {
    document.querySelectorAll(".chart-range").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.bars) === viewBars));
    });
    const note = $("chart-view-note");
    if (note) {
      const available = shown.bars.length;
      note.textContent = available ? Math.min(viewBars, available) + " / " + available + " bougies disponibles" : "En attente des bougies";
    }
  }
  const LW = () => window.LightweightCharts;

  const fmtTime = (t, opts) => new Date(t * 1000).toLocaleString("fr-FR", Object.assign({ timeZone: "Europe/Paris" }, opts));
  function initChart() {
    if (chart || !LW()) return !!chart;
    const L = LW(), el = $("mchart");
    el.innerHTML = "";
    chart = L.createChart(el, {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: C.mu, fontSize: 11, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        panes: { separatorColor: C.line, separatorHoverColor: "rgba(124,92,255,.25)", enableResize: false } },
      grid: { vertLines: { color: "rgba(36,48,73,.55)" }, horzLines: { color: "rgba(36,48,73,.55)" } },
      rightPriceScale: { borderColor: C.line },
      timeScale: { borderColor: C.line, timeVisible: true, secondsVisible: false, rightOffset: 12, // espace à droite : la dernière bougie ne touche jamais l'échelle de prix
       
        tickMarkFormatter: (t, type) => type <= 1 ? fmtTime(t, { month: "short", year: type === 0 ? "numeric" : undefined })
          : type === 2 ? fmtTime(t, { day: "2-digit", month: "2-digit" }) : fmtTime(t, { hour: "2-digit", minute: "2-digit" }) },
      crosshair: { mode: 0 },
      localization: { locale: "fr-FR", timeFormatter: (t) => fmtTime(t, { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) },
    });
    sCandle = chart.addSeries(L.CandlestickSeries, { upColor: C.up, downColor: C.dn, borderVisible: false, wickUpColor: C.up, wickDownColor: C.dn, priceLineColor: C.ac2,
      // L'échelle inclut les niveaux d'ordres, stops et objectifs pour qu'ils restent visibles.
      autoscaleInfoProvider: (orig) => {
        const r = orig(); if (!r || !r.priceRange || !levelPrices.length) return r;
        return Object.assign({}, r, { priceRange: { minValue: Math.min(r.priceRange.minValue, ...levelPrices), maxValue: Math.max(r.priceRange.maxValue, ...levelPrices) } });
      } }, 0);
    sMa20 = chart.addSeries(L.LineSeries, { color: C.ac2, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, 0);
    sMa50 = chart.addSeries(L.LineSeries, { color: C.ma50, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }, 0);
    sVol = chart.addSeries(L.HistogramSeries, { priceFormat: { type: "custom", formatter: (v) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(v) }, priceLineVisible: false, lastValueVisible: false }, 1);
    sRsi = chart.addSeries(L.LineSeries, { color: C.warn, lineWidth: 1.5, priceLineVisible: false, autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
      priceFormat: { type: "custom", formatter: (v) => nf(0).format(v) } }, 2);
    sRsi.createPriceLine({ price: 70, color: "rgba(248,113,113,.55)", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "" });
    sRsi.createPriceLine({ price: 30, color: "rgba(52,211,153,.55)", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "" });
    sRsi.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
    const panes = chart.panes();
    panes[0].setStretchFactor(3.2); panes[1].setStretchFactor(0.9); panes[2].setStretchFactor(1.1);
    markersApi = L.createSeriesMarkers(sCandle, []);
    sCandle.attachPrimitive(labels);
    chart.subscribeCrosshairMove(legend);
    return true;
  }

  function setPriceFormat(p) {
    const d = Math.min(decOf(p), 8), f = nf(d);
    const pf = { type: "custom", minMove: Math.pow(10, -d), formatter: (v) => f.format(v) };
    sCandle.applyOptions({ priceFormat: pf }); sMa20.applyOptions({ priceFormat: pf }); sMa50.applyOptions({ priceFormat: pf });
  }

  function seriesData(bars) {
    const closes = bars.map((b) => b.c), m20 = sma(closes, 20), m50 = sma(closes, 50), r = rsi(closes, 14);
    return {
      candles: bars.map((b) => ({ time: b.t, open: b.o, high: b.h, low: b.l, close: b.c })),
      ma20: bars.map((b, i) => m20[i] == null ? { time: b.t } : { time: b.t, value: m20[i] }),
      ma50: bars.map((b, i) => m50[i] == null ? { time: b.t } : { time: b.t, value: m50[i] }),
      vol: bars.map((b) => ({ time: b.t, value: b.v, color: b.c >= b.o ? "rgba(52,211,153,.45)" : "rgba(248,113,113,.45)" })),
      rsi: bars.map((b, i) => r[i] == null ? { time: b.t } : { time: b.t, value: r[i] }),
      m20, m50, r,
    };
  }

  let legendData = null;
  let hoveredCandleTime = null;
  function legend(param) {
    if (param !== undefined) hoveredCandleTime = param && param.time != null ? param.time : null;
    const el = $("mlegend"); if (!el || !legendData) return;
    let i = legendData.bars.length - 1;
    if (hoveredCandleTime != null) { const j = legendData.idx.get(hoveredCandleTime); if (j != null) i = j; }
    const b = legendData.bars[i]; if (!b) return;
    const p = selected.pair, d = legendData.data;
    const chg = (b.c - b.o) / b.o * 100;
    el.innerHTML = `<b>${esc(baseOf(p))}/USDC</b> <span class="muted">${esc(TF_LBL[selected.tf] || selected.tf)} · ${fmtTime(b.t, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${i === legendData.bars.length - 1 ? " · bougie en cours" : ""}</span><br>
      O ${pxf(p, b.o)} · H ${pxf(p, b.h)} · B ${pxf(p, b.l)} · C ${pxf(p, b.c)} <span class="${chg >= 0 ? "up" : "dn"}">(${chg >= 0 ? "▲" : "▼"} ${signed(chg)} %)</span><br>
      <span class="sw ma20">MA20 ${pxf(p, d.m20[i])}</span> <span class="sw ma50">MA50 ${pxf(p, d.m50[i])}</span> <span class="sw rsi">RSI 14 ${d.r[i] == null ? "—" : nf(0).format(d.r[i])}</span>`;
  }

  function setChartMsg(msg) { const m = $("mchart-msg"); m.textContent = msg || ""; m.hidden = !msg; }

  let lastChartLoad = 0, chartBusy = false, chartRequest = 0;
  async function loadChart(force) {
    const request = ++chartRequest;
    chartBusy = true;
    try { await loadChartInner(force, request); }
    finally { if (request === chartRequest) chartBusy = false; }
  }
  async function loadChartInner(force, request) {
    const p = selected.pair, iv = TF[selected.tf], key = p + "|" + iv;
    lastChartLoad = Date.now();
    if (!initChart()) { setChartMsg("La bibliothèque de graphiques n'a pas pu se charger (CDN injoignable). Le tableau des marqueurs reste à jour."); return; }
    const wrap = $("mchart-wrap");
    const switching = shown.key !== key;
    if (switching) wrap.classList.add("is-loading");
    try {
      const bars = await ohlc(p, iv, force);
      if (request !== chartRequest || selected.pair !== p || TF[selected.tf] !== iv) return; // réponse ancienne : ne jamais écraser la sélection courante
      const d = seriesData(bars);
      if (switching || !shown.lastT) {
        setPriceFormat(p);
        sCandle.setData(d.candles); sMa20.setData(d.ma20); sMa50.setData(d.ma50); sVol.setData(d.vol); sRsi.setData(d.rsi);
        chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, bars.length - viewBars), to: bars.length + 3 });
        linesSig = ""; markersSig = "";
      } else {
        // Rafraîchissement : on ne pousse que la bougie en cours et les nouvelles, sans déplacer la vue.
        for (let i = 0; i < bars.length; i++) {
          if (bars[i].t < shown.lastT) continue;
          sCandle.update(d.candles[i]); sMa20.update(d.ma20[i]); sMa50.update(d.ma50[i]); sVol.update(d.vol[i]); sRsi.update(d.rsi[i]);
        }
      }
      shown = { key, lastT: bars.length ? bars[bars.length - 1].t : null, bars };
      syncChartRange();
      legendData = { bars, data: d, idx: new Map(bars.map((b, i) => [b.t, i])) };
      legend(); // Conserver la bougie survolée pendant le rafraîchissement des cours.
      overlays();
      setChartMsg("");
    } catch (e) {
      if (request === chartRequest) setChartMsg("Bougies Kraken indisponibles pour l'instant (" + e.message + "). Nouvel essai automatique.");
    } finally {
      if (request === chartRequest) wrap.classList.remove("is-loading");
    }
  }

  // Étiquettes posées sur les lignes pointillées, à gauche du graphique (primitive de série) :
  // l'échelle de droite ne garde que de petites étiquettes de prix, les bougies récentes restent dégagées.
  const labels = {
    items: [], series: null, req: null,
    attached(p) { this.series = p.series; this.req = p.requestUpdate; },
    detached() { this.series = null; this.req = null; },
    set(items) { this.items = items; if (this.req) this.req(); },
    updateAllViews() {},
    paneViews() {
      const self = this;
      return [{ zOrder: () => "top", renderer: () => ({ draw(target) {
        if (!self.series || !self.items.length) return;
        target.useMediaCoordinateSpace(({ context: c, mediaSize }) => {
          c.font = "600 10px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
          c.textBaseline = "middle";
          const H = 15, pts = self.items.map((l) => ({ l, y: self.series.priceToCoordinate(l.price) }))
            .filter((q) => q.y != null && q.y > H / 2 && q.y < mediaSize.height - H / 2).sort((a, b) => a.y - b.y);
          let prev = -1e9; // évite les chevauchements : décale vers le bas si deux niveaux sont proches
          for (const q of pts) {
            const y = Math.max(q.y, prev + H + 1); prev = y;
            const w = c.measureText(q.l.label).width + 10, x = 6;
            c.fillStyle = "rgba(11,15,26,.86)"; c.fillRect(x, y - H / 2, w, H);
            c.strokeStyle = q.l.color; c.lineWidth = 1; c.strokeRect(x + .5, y - H / 2 + .5, w - 1, H - 1);
            c.fillStyle = q.l.text || "#e6ebf5"; c.fillText(q.l.label, x + 5, y + .5);
          }
        });
      } }) }];
    },
  };
  const ORD_KEY = "kp.showOrders";
  let showOrders = (() => { try { return localStorage.getItem(ORD_KEY) !== "0"; } catch { return true; } })();
  function syncOrdBtn() { const b = $("ord-toggle"); if (b) { b.setAttribute("aria-pressed", String(showOrders)); b.textContent = showOrders ? "Ordres : affichés" : "Ordres : masqués"; } }
  document.addEventListener("click", (e) => {
    if (!e.target.closest || !e.target.closest("#ord-toggle")) return;
    showOrders = !showOrders;
    try { localStorage.setItem(ORD_KEY, showOrders ? "1" : "0"); } catch { /* navigation privée */ }
    syncOrdBtn(); linesSig = ""; overlays();
  });
  document.addEventListener("DOMContentLoaded", syncOrdBtn); syncOrdBtn();

  // Ordres en attente, stops, objectifs, prix de revient, et exécutions du journal.
  function overlays() {
    if (!chart || !ctx.S || !shown.bars.length) return;
    const S = ctx.S, p = selected.pair, iv = TF[selected.tf] * 60;
    const lines = [];
    const pos = S.positions[p];
    if (pos) {
      const live = ctx.price(p) ?? (shown.bars.length ? shown.bars[shown.bars.length - 1].c : null);
      const pru = (window.KPLib && window.KPLib.pruLabel) ? window.KPLib.pruLabel(pos, live) : { label: "PRU (prix de revient)", tone: "mu" };
      const col = C[pru.tone] || C.mu;
      lines.push({ price: pos.avg_cost, color: col, lineStyle: 1, label: pru.label, text: col });
    }
    for (const o of S.open_orders || []) {
      if (o.pair !== p) continue;
      if (o.side === "buy") {
        if (o.price != null) lines.push({ price: o.price, color: C.up, lineStyle: 2, label: `${o.id} achat limite` });
        if (o.stop_loss) lines.push({ price: o.stop_loss, color: "rgba(248,113,113,.6)", lineStyle: 3, label: `${o.id} stop prévu` });
        if (o.take_profit) lines.push({ price: o.take_profit, color: "rgba(124,92,255,.75)", lineStyle: 3, label: `${o.id} objectif prévu` });
      } else {
        if (o.price != null) lines.push({ price: o.price, color: C.ac, lineStyle: 2, label: `${o.id} ${o.parent ? "objectif" : "vente limite"}` });
        if (o.stop_loss) lines.push({ price: o.stop_loss, color: C.dn, lineStyle: 2, label: `${o.id} stop` });
      }
    }
    const vis = showOrders ? lines : [];
    // La signature des lignes de prix ignore le texte du P&L (il change toutes les 15 s) :
    // on recrée les traits seulement si un niveau change, et on rafraîchit toujours les étiquettes.
    const lsig = p + showOrders + JSON.stringify(vis.map((l) => [l.price, l.color, l.lineStyle]));
    if (lsig !== linesSig) {
      priceLines.forEach((l) => sCandle.removePriceLine(l));
      levelPrices = vis.map((l) => l.price).filter((x) => x > 0);
      // Sur l'échelle : seulement la petite étiquette de prix, sans titre ; le texte va sur la ligne (primitive).
      priceLines = vis.map((l) => sCandle.createPriceLine({ price: l.price, color: l.color, lineStyle: l.lineStyle, lineWidth: 1, axisLabelVisible: true, title: "" }));
      linesSig = lsig;
    }
    labels.set(vis);
    // exécutions : journal (événements "fill"), complété par closed_trades.
    // Les fills anciens (sans time_source, datés à la fermeture 1 h) sont recalés sur la
    // première bougie affichée qui touche le prix dans l'heure précédant le ts ; l'état n'est pas modifié.
    const trades = new Map();
    for (const e of ctx.journal) if (e.type === "fill" && e.trade) trades.set(e.trade.id, e.trade);
    for (const t of S.closed_trades || []) if (!trades.has(t.id)) trades.set(t.id, t);
    const first = shown.bars[0].t, last = shown.bars[shown.bars.length - 1].t;
    const markTs = (window.KPLib && window.KPLib.fillMarkerTs)
      ? (tr) => window.KPLib.fillMarkerTs(tr, shown.bars, iv)
      : (tr) => Math.floor(tr.ts / iv) * iv;
    const mk = [...trades.values()].filter((t) => t.pair === p && t.ts).map((t) => {
      const bt = markTs(t);
      const buy = t.side === "buy";
      return { time: bt, position: buy ? "belowBar" : "aboveBar", shape: buy ? "arrowUp" : "arrowDown", color: buy ? C.up : C.dn,
        text: (buy ? "Achat " : "Vente ") + pxf(p, t.price) };
    }).filter((m) => m.time != null && m.time >= first && m.time <= last).sort((a, b) => a.time - b.time);
    const msig = p + iv + JSON.stringify(mk);
    if (msig !== markersSig) { markersApi.setMarkers(mk); markersSig = msig; }
    const n = lines.length, m = mk.length;
    $("moverlay-note").textContent = (n || m)
      ? `Sur le graphique : ${n} niveau${n > 1 ? "x" : ""} (ordres, stops, objectifs)${n && !showOrders ? " masqué" + (n > 1 ? "s" : "") : ""} et ${m} exécution${m > 1 ? "s" : ""} visible${m > 1 ? "s" : ""} sur cette période.`
      : "Aucun ordre ni exécution sur cette crypto pour l'instant : les niveaux et les flèches d'achat et de vente s'afficheront ici.";
  }

  // ---------- tableau des marqueurs ----------
  const metrics = {}; // pair -> objet calculé
  function trendOf(price, bars) {
    if (!bars || bars.length < 50 || price == null) return null;
    const cl = bars.map((b) => b.c);
    const m20 = sma(cl, 20).at(-1), m50 = sma(cl, 50).at(-1);
    if (price > m20 && price > m50) return { k: "up", t: "↑ Haussière" };
    if (price < m20 && price < m50) return { k: "dn", t: "↓ Baissière" };
    return { k: "mx", t: "→ Mixte" };
  }
  function perfSince(bars1h, hours, price) {
    if (!bars1h || !bars1h.length || price == null) return null;
    const target = bars1h.at(-1).t - hours * 3600;
    const b = bars1h.find((x) => x.t === target) || bars1h.find((x) => x.t >= target);
    return b ? (price / b.o - 1) * 100 : null;
  }
  async function computeMetrics(p) {
    const [h1, h4, d1] = await Promise.all([ohlc(p, 60), ohlc(p, 240), ohlc(p, 1440)]);
    metrics[p] = { h1, h4, d1 };
  }
  function row(p) {
    const m = metrics[p], live = ctx.price(p);
    const price = live != null ? live : (m && m.h1 && m.h1.length ? m.h1.at(-1).c : null);
    if (!m) return { price, loading: true };
    const ch24 = perfSince(m.h1, 24, price), p7 = perfSince(m.h1, 168, price);
    const b = metrics[BENCH], bp = ctx.price(BENCH) ?? (b && b.h1.length ? b.h1.at(-1).c : null);
    const btc7 = b ? perfSince(b.h1, 168, bp) : null;
    const r = rsi(m.h4.map((x) => x.c), 14).at(-1);
    const a = atr(m.d1.map((x) => ({ h: x.h, l: x.l, c: x.c })), 14).at(-1);
    return { price, ch24, t4: trendOf(price, m.h4), t1: trendOf(price, m.d1), rsi: r, atrp: a != null && price ? a / price * 100 : null,
      rs: p === BENCH ? "ref" : (p7 != null && btc7 != null ? p7 - btc7 : null), p7 };
  }
  const cellTrend = (t) => t ? `<span class="tr ${t.k}">${t.t}</span>` : "—";
  function cellRsi(r) {
    if (r == null) return "—";
    const lbl = r >= 70 ? ["hot", "suracheté"] : r <= 30 ? ["cold", "survendu"] : ["", "neutre"];
    return `<span class="rsi-v ${lbl[0]}">${nf(0).format(r)}</span> <span class="muted">${lbl[1]}</span>`;
  }
  function cellVol(v) {
    if (v == null) return "—";
    const lbl = v >= 6 ? "forte" : v >= 3 ? "moyenne" : "faible";
    return `${nf(1).format(v)} % <span class="muted">${lbl}</span>`;
  }
  function cellRs(rs) {
    if (rs === "ref") return '<span class="muted">référence</span>';
    if (rs == null) return "—";
    return `<span class="${rs >= 0 ? "up" : "dn"}">${rs >= 0 ? "▲" : "▼"} ${signed(rs, 1)} pts</span> <span class="muted">${rs >= 0 ? "plus fort" : "plus faible"}</span>`;
  }
  const cellChg = (x) => x == null ? "—" : `<span class="${x >= 0 ? "up" : "dn"}">${x >= 0 ? "▲" : "▼"} ${signed(x)} %</span>`;

  function setCell(td, html, flash) {
    if (td.dataset.v === html) return;
    const had = td.dataset.v != null && td.dataset.v !== "indisponible";
    td.dataset.v = html;
    td.innerHTML = `<span class="val">${html}</span>`;
    if (flash && had) td.firstChild.classList.add("kpi-updated");
  }
  // Les lignes apparaissent au fil des données reçues ; l'animation d'entrée ne joue qu'à la première insertion.
  const failed = new Set();
  function renderTable() {
    const tb = $("markers").tBodies[0], all = trackedPairs();
    const pairs = all.filter((p) => metrics[p] || failed.has(p));
    const want = new Set(pairs);
    [...tb.rows].forEach((r) => { if (!want.has(r.dataset.pair)) r.remove(); });
    pairs.forEach((p, i) => {
      let tr = [...tb.rows].find((r) => r.dataset.pair === p);
      if (!tr) {
        tr = document.createElement("tr"); tr.dataset.pair = p;
        tr.innerHTML = `<th scope="row"><button type="button" class="linkbtn motion-button" data-pair="${esc(p)}" title="Voir le graphique">${esc(baseOf(p))}</button></th>` + '<td class="r"></td>'.repeat(7);
        tr.classList.add("motion-row-new");
        tr.addEventListener("animationend", () => tr.classList.remove("motion-row-new"), { once: true });
      }
      if (tb.rows[i] !== tr) tb.insertBefore(tr, tb.rows[i] || null);
    });
    const left = all.length - pairs.length;
    $("markers-load").textContent = left > 0 ? `Chargement des marqueurs : ${pairs.length} / ${all.length} cryptos…` : "";
    for (const tr of tb.rows) {
      const p = tr.dataset.pair, r = row(p), td = tr.cells;
      tr.classList.toggle("sel", p === selected.pair);
      td[0].querySelector("button").textContent = baseOf(p);
      setCell(td[1], r.price == null ? "—" : pxf(p, r.price), true);
      if (r.loading) { for (let i = 2; i < 8; i++) setCell(td[i], "indisponible"); continue; }
      setCell(td[2], cellChg(r.ch24)); setCell(td[3], cellTrend(r.t4)); setCell(td[4], cellTrend(r.t1));
      setCell(td[5], cellRsi(r.rsi)); setCell(td[6], cellVol(r.atrp)); setCell(td[7], cellRs(r.rs));
    }
  }

  async function refreshMetrics() {
    const pairs = trackedPairs();
    try { await loadMeta(pairs); } catch (e) { /* méta facultative : décimales par défaut */ }
    renderChips(); renderTable();
    let err = null;
    // BTC d'abord : sert de référence pour la force relative.
    for (const p of [BENCH, ...pairs.filter((x) => x !== BENCH)]) {
      try { await computeMetrics(p); failed.delete(p); } catch (e) { err = e; if (!metrics[p]) failed.add(p); }
      renderTable();
    }
    $("markers-note").textContent = err ? "Certaines données Kraken n'ont pas pu être lues (" + err.message + "), nouvel essai dans 3 min." : "";
  }

  // ---------- interactions ----------
  function selectPair(p) {
    if (!p || p === selected.pair) return;
    hoveredCandleTime = null;
    selected.pair = p;
    renderChips(); renderTable(); loadChart();
  }
  function selectTf(tf, focus) {
    if (!TF[tf]) return;
    const tabs = [...document.querySelectorAll("#tf-tabs [role=tab]")];
    tabs.forEach((b, i) => {
      const on = b.dataset.tf === tf;
      b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
      if (on) { $("tf-tabs").style.setProperty("--idx", i); if (focus) b.focus(); }
    });
    if (tf === selected.tf) return;
    hoveredCandleTime = null;
    selected.tf = tf; loadChart();
  }
  function bind() {
    document.querySelectorAll(".chart-range").forEach((button) => button.addEventListener("click", () => {
      viewBars = Number(button.dataset.bars);
      syncChartRange();
      applyChartRange();
    }));
    $("chart-reset").addEventListener("click", () => {
      applyChartRange();
      hoveredCandleTime = null;
      legend();
    });
    syncChartRange();
    $("pair-chips").addEventListener("click", (e) => { const b = e.target.closest("[data-pair]"); if (b) selectPair(b.dataset.pair); });
    $("markers").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pair]"); if (!b) return;
      selectPair(b.dataset.pair);
      $("market-card").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    const tabs = $("tf-tabs");
    tabs.addEventListener("click", (e) => { const b = e.target.closest("[role=tab]"); if (b) selectTf(b.dataset.tf); });
    tabs.addEventListener("keydown", (e) => {
      const keys = Object.keys(TF), i = keys.indexOf(selected.tf);
      if (e.key === "ArrowRight") { e.preventDefault(); selectTf(keys[(i + 1) % keys.length], true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectTf(keys[(i + keys.length - 1) % keys.length], true); }
    });
  }

  // ---------- point d'entrée appelé par app.js après chaque rendu ----------
  let started = false;
  window.KPMarkets = {
    onState(c) {
      ctx = c;
      if (!started) {
        started = true; bind(); selectTf(selected.tf);
        renderChips(); renderTable(); loadChart(); refreshMetrics();
        setInterval(() => {
          if (document.hidden || chartBusy) return;
          if (Date.now() - lastChartLoad >= REFRESH[TF[selected.tf]]) loadChart(true);
        }, 10e3);
        setInterval(() => { if (!document.hidden) refreshMetrics(); }, 180e3);
        return;
      }
      renderChips(); renderTable(); overlays();
    },
  };
})();
