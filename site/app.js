/* Kraken Paper - tableau de bord (lecture seule, aucune donnee inventee). */
(() => {
  "use strict";
  const RAW = "https://raw.githubusercontent.com/cyrillaferrere/kraken-paper/main/state/";
  const TICKER = "https://api.kraken.com/0/public/Ticker?pair=";
  const BENCH = "XBTUSDC";
  const PRICE_EVERY = 15000, STATE_EVERY = 120000, STALE_MS = 2 * 3600 * 1000;

  let S = null, equity = [], journal = [];
  let live = {}, liveOk = null, liveAt = null;
  const seenTrades = new Set(); let firstRender = true;
  const $ = (id) => document.getElementById(id);

  // ---------- format FR ----------
  const nf = (d) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const usdc = (x, d = 2) => x == null || isNaN(x) ? "—" : nf(d).format(x) + " USDC";
  const signed = (x, d = 2) => x == null || isNaN(x) ? "—" : (x > 0 ? "+" : x < 0 ? "−" : "") + nf(d).format(Math.abs(x));
  const pct = (x) => x == null || isNaN(x) ? "—" : signed(x * 100, 2) + " %";
  const px = (x) => x == null ? "—" : nf(x >= 1000 ? 0 : x >= 1 ? 2 : 5).format(x);
  const qty = (x) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 }).format(x);
  const cls = (x) => x > 0 ? "up" : x < 0 ? "dn" : "";
  const dt = (s) => s ? new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const base = (p) => (S && S.pairs[p] && S.pairs[p].base) || (p === BENCH ? "BTC" : p.replace(/USDC$/, ""));

  function setText(id, text, klass) {
    const el = $(id); if (!el) return;
    const changed = el.textContent !== text;
    el.textContent = text;
    if (klass !== undefined) el.className = el.className.replace(/\b(up|dn)\b/g, "").trim() + (klass ? " " + klass : "");
    if (changed && !firstRender) { el.classList.remove("kpi-updated"); void el.offsetWidth; el.classList.add("kpi-updated"); }
  }

  // ---------- données ----------
  async function loadState() {
    const bust = "?t=" + Date.now();
    try {
      const [p, e, j] = await Promise.all([
        fetch(RAW + "portfolio.json" + bust, { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch(RAW + "equity.csv" + bust, { cache: "no-store" }).then((r) => r.ok ? r.text() : ""),
        fetch(RAW + "journal.jsonl" + bust, { cache: "no-store" }).then((r) => r.ok ? r.text() : ""),
      ]);
      S = p;
      equity = e.trim().split("\n").slice(1).filter(Boolean).map((l) => {
        const [time, eq, cash, pos, btc, hold] = l.split(",");
        return { t: new Date(time).getTime(), eq: +eq, hold: hold === "" ? null : +hold };
      }).filter((r) => !isNaN(r.t) && !isNaN(r.eq));
      journal = j.trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      $("alert").hidden = true;
      await loadPrices();
      render();
    } catch (err) {
      showAlert("Impossible de lire l'état du portefeuille sur GitHub (" + err.message + "). Nouvel essai dans 2 min.");
    }
  }

  function pairsNeeded() {
    if (!S) return [BENCH, ...(window.KP_WATCH || [])];
    const s = new Set([BENCH, ...(window.KP_WATCH || []), ...Object.keys(S.positions), ...S.open_orders.map((o) => o.pair)]);
    return [...s];
  }

  async function loadPrices() {
    const pairs = pairsNeeded();
    try {
      const r = await fetch(TICKER + pairs.join(","), { cache: "no-store" });
      const d = await r.json();
      if (d.error && d.error.length) throw new Error(d.error.join(", "));
      const out = {};
      for (const p of pairs) {
        const m = (S && S.pairs[p]) || {};
        const k = [p, m.key, m.altname].find((x) => x && d.result[x]);
        if (k) out[p] = +d.result[k].c[0];
      }
      live = out; liveOk = true; liveAt = new Date();
    } catch (e) {
      liveOk = false;
    }
  }

  const price = (p) => (liveOk && live[p] != null) ? live[p] : (S ? S.last_prices[p] : null);

  // ---------- rendu ----------
  function render() {
    if (!S) return;
    // statut
    const stp = $("st-prices");
    if (liveOk) { stp.textContent = "Prix en direct Kraken · " + liveAt.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" }); stp.className = "pill ok"; }
    else { stp.textContent = "API Kraken injoignable : prix du dernier cycle moteur"; stp.className = "pill warn"; }
    const stc = $("st-cycle");
    const age = S.last_cycle ? Date.now() - new Date(S.last_cycle).getTime() : Infinity;
    stc.textContent = "Dernier cycle moteur : " + dt(S.last_cycle) + (age > STALE_MS ? " · plus de 2 h, moteur en retard ?" : "");
    stc.className = "pill " + (age > STALE_MS ? "err" : "ok");
    if (S.last_cycle_errors && S.last_cycle_errors.length) showAlert("Dernier cycle : " + S.last_cycle_errors.join(" · "));

    // valeurs
    let posVal = 0, missing = false;
    for (const [p, pos] of Object.entries(S.positions)) { const x = price(p); if (x == null) missing = true; else posVal += pos.qty * x; }
    const total = S.cash + posVal;
    const pnl = total - S.start_capital;
    setText("k-value", missing ? "—" : usdc(total));
    $("k-value-sub").textContent = "Départ : " + usdc(S.start_capital) + " le " + dt(S.start_time);
    setText("k-pnl", missing ? "—" : signed(pnl) + " USDC", cls(pnl));
    setText("k-pnl-pct", missing ? "" : pct(pnl / S.start_capital), cls(pnl));
    const btc = price(BENCH);
    const hold = S.benchmark && S.benchmark.btc_qty && btc ? S.benchmark.btc_qty * btc : null;
    if (hold != null && !missing) {
      const gap = total - hold;
      setText("k-bench", signed(gap) + " USDC", cls(gap));
      $("k-bench-sub").textContent = "BTC conservé vaudrait " + usdc(hold);
    } else { setText("k-bench", "—"); $("k-bench-sub").textContent = "Référence fixée au premier cycle"; }
    setText("k-fees", usdc(S.fees_total));
    $("k-fees-sub").textContent = S.closed_trades.length + " trade" + (S.closed_trades.length > 1 ? "s" : "") + " · P&L réalisé " + signed(S.realized_pnl) + " USDC";
    $("cash").textContent = "Cash : " + usdc(S.cash);

    // décision
    const d = S.last_decision;
    $("decision").textContent = d ? (d.rationale || "(pas de commentaire)") : "Pas encore de décision : la première arrive à la session du matin.";
    $("dec-meta").textContent = d ? d.id + " · " + dt(d.timestamp || d.applied) : "";

    renderPositions(); renderOrders(); renderTrades(); renderJournal(); renderChart(hold, missing ? null : total);
    if (firstRender) {
      // Entrée des panneaux : une seule fois au premier rendu, jamais au polling.
      document.querySelectorAll(".kpi, .card").forEach((el, i) => { el.style.setProperty("--i", Math.min(i, 5)); el.classList.add("motion-panel-enter"); });
      firstRender = false;
    }
    if (window.KPMarkets) window.KPMarkets.onState({ S, journal, price });
  }

  function renderPositions() {
    const tb = $("positions").tBodies[0];
    const rows = Object.entries(S.positions).map(([p, pos]) => {
      const x = price(p), val = x == null ? null : pos.qty * x, cost = pos.qty * pos.avg_cost;
      const u = val == null ? null : val - cost;
      return `<tr><td><b>${esc(pos.base)}</b></td><td class="r">${qty(pos.qty)}</td><td class="r">${px(pos.avg_cost)}</td><td class="r">${px(x)}</td><td class="r">${usdc(val)}</td><td class="r ${cls(u)}">${signed(u)} (${pct(u / cost)})</td></tr>`;
    });
    tb.innerHTML = rows.join("") || `<tr><td colspan="6" class="empty">Aucune position, tout est en USDC.</td></tr>`;
  }

  function renderOrders() {
    const tb = $("orders").tBodies[0];
    const rows = S.open_orders.map((o) => {
      const x = price(o.pair);
      const levels = [];
      if (o.price != null) levels.push({ lbl: o.side === "buy" ? "limite" : (o.parent ? "take profit" : "limite"), v: o.price, hit: x != null && (o.side === "buy" ? x <= o.price : x >= o.price) });
      if (o.stop_loss != null && o.side === "sell") levels.push({ lbl: "stop", v: o.stop_loss, hit: x != null && x <= o.stop_loss });
      const hit = liveOk && levels.some((l) => l.hit);
      const lv = levels.map((l) => `${l.lbl} ${px(l.v)}`).join("<br>");
      const dist = levels.map((l) => x == null ? "—" : pct((l.v - x) / x)).join("<br>");
      const extra = o.side === "buy" && (o.stop_loss || o.take_profit) ? `<br><span class="muted">puis ${o.stop_loss ? "stop " + px(o.stop_loss) : ""}${o.stop_loss && o.take_profit ? " / " : ""}${o.take_profit ? "TP " + px(o.take_profit) : ""}</span>` : "";
      return `<tr class="${hit ? "reached" : ""}"><td>${esc(o.id)} · <b>${esc(base(o.pair))}</b>${hit ? '<span class="reached-note">⚡ Niveau atteint en direct, pas encore enregistré par le moteur</span>' : ""}</td><td><span class="tag ${o.side}">${o.side === "buy" ? "ACHAT" : "VENTE"}</span></td><td class="r">${qty(o.qty)}</td><td class="r">${lv}${extra}</td><td class="r">${px(x)}</td><td class="r">${dist}</td></tr>`;
    });
    tb.innerHTML = rows.join("") || `<tr><td colspan="6" class="empty">Aucun ordre ouvert.</td></tr>`;
  }

  const REASON = { limit: "limite", market: "marché", stop_loss: "stop loss", take_profit: "take profit" };
  function renderTrades() {
    const tb = $("trades").tBodies[0];
    const list = S.closed_trades.slice().reverse();
    const rows = list.map((t) => {
      const isNew = !firstRender && !seenTrades.has(t.id);
      return `<tr class="${isNew ? "motion-row-new" : ""}"><td>${dt(t.time)}</td><td><span class="tag ${t.side}">${t.side === "buy" ? "ACHAT" : "VENTE"}</span> ${esc(t.base)} <span class="muted">${REASON[t.reason] || esc(t.reason)}</span></td><td class="r">${qty(t.qty)}</td><td class="r">${px(t.price)}</td><td class="r">${nf(2).format(t.fee)} <span class="muted">${t.liquidity}</span></td><td class="r ${cls(t.realized_pnl)}">${t.realized_pnl == null ? "—" : signed(t.realized_pnl) + " USDC"}</td></tr>`;
    });
    list.forEach((t) => seenTrades.add(t.id));
    tb.innerHTML = rows.join("") || `<tr><td colspan="6" class="empty">Pas encore de trade.</td></tr>`;
  }

  function journalText(e) {
    switch (e.type) {
      case "start": return `Départ de la simulation avec ${usdc(e.capital)}`;
      case "decision": return `Décision ${esc(e.decision_id)} : ${esc(e.rationale)}`;
      case "order_placed": { const o = e.order; return `Ordre ${o.id} posé : ${o.side === "buy" ? "achat" : "vente"} ${qty(o.qty)} ${esc(base(o.pair))} à ${px(o.price)}${o.stop_loss ? " · stop " + px(o.stop_loss) : ""}${o.take_profit ? " · TP " + px(o.take_profit) : ""}`; }
      case "fill": { const t = e.trade; return `✅ Exécuté : ${t.side === "buy" ? "achat" : "vente"} ${qty(t.qty)} ${esc(t.base)} à ${px(t.price)} (${REASON[t.reason] || t.reason})`; }
      case "cancel": return `Ordre ${esc(e.order_id)} annulé${e.reason ? " : " + esc(e.reason) : ""}`;
      case "rejected": return `⛔ Action refusée : ${esc(e.reason)}`;
      case "note": return `📝 ${esc(e.text)}`;
      case "warning": return `⚠️ ${esc(e.text)}`;
      case "market": return null;
      default: return esc(e.type);
    }
  }
  function renderJournal() {
    const items = journal.slice().reverse().map((e) => [e, journalText(e)]).filter(([, t]) => t).slice(0, 40);
    $("journal").innerHTML = items.map(([e, t]) => `<li><time>${dt(e.time)}</time><span>${t}</span></li>`).join("") || "<li>Journal vide.</li>";
  }

  function renderChart() {
    const el = $("chart");
    const pts = equity;
    if (pts.length < 2) { el.innerHTML = `<div class="empty">La courbe apparaîtra après quelques cycles horaires du moteur.<br>${pts.length} point${pts.length > 1 ? "s" : ""} pour l'instant.</div>`; return; }
    const W = el.clientWidth || 600, H = el.clientHeight || 240, pl = 58, pr = 10, pt = 10, pb = 24;
    const vals = pts.flatMap((p) => [p.eq, p.hold]).filter((v) => v != null);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 1) { lo -= 5; hi += 5; }
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const X = (t) => pl + (W - pl - pr) * (t1 === t0 ? 0 : (t - t0) / (t1 - t0));
    const Y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
    const line = (key) => pts.filter((p) => p[key] != null).map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + "," + Y(p[key]).toFixed(1)).join("");
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hi - lo) * f);
    const grid = ticks.map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#243049" stroke-width="1"/><text x="${pl - 6}" y="${Y(v) + 4}" fill="#8a96b3" font-size="11" text-anchor="end">${nf(0).format(v)}</text>`).join("");
    const startY = Y(S.start_capital);
    const fmtT = (t) => new Date(t).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", timeZone: "Europe/Paris" });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
      ${grid}
      <line x1="${pl}" x2="${W - pr}" y1="${startY}" y2="${startY}" stroke="#7c5cff" stroke-dasharray="4 4" opacity=".6"/>
      <path d="${line("hold")}" fill="none" stroke="#fbbf24" stroke-width="1.6" opacity=".85"/>
      <path d="${line("eq")}" fill="none" stroke="#22d3ee" stroke-width="2.2"/>
      <text x="${pl}" y="${H - 6}" fill="#8a96b3" font-size="11">${fmtT(t0)}</text>
      <text x="${W - pr}" y="${H - 6}" fill="#8a96b3" font-size="11" text-anchor="end">${fmtT(t1)}</text>
    </svg>`;
  }

  function showAlert(msg) { const a = $("alert"); a.textContent = msg; a.hidden = false; }

  // ---------- boucles ----------
  loadState();
  setInterval(async () => { if (!S || document.hidden) return; await loadPrices(); render(); }, PRICE_EVERY);
  setInterval(() => { if (!document.hidden) loadState(); }, STATE_EVERY);
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => S && renderChart(), 150); });
})();
