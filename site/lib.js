/* Kraken Paper - fonctions pures du dash (sans DOM, testées par node --test tests/site/*.test.js). */
(() => {
  "use strict";
  const nf = (d) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const px = (x) => x == null || isNaN(x) ? "—" : nf(x >= 1000 ? 0 : x >= 1 ? 2 : 5).format(x);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HOUR = 3600e3;

  // ---------- mini rendu Markdown sûr : tout le HTML est échappé d'abord ----------
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, t, u) => `<a href="${u}" rel="noopener noreferrer" target="_blank">${t}</a>`);
  }
  function md(text) {
    const out = []; let list = null, para = [];
    const flushP = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };
    const flushL = () => { if (list) { out.push(`<${list.t}>` + list.items.map((i) => "<li>" + inline(i) + "</li>").join("") + `</${list.t}>`); list = null; } };
    for (const raw of String(text || "").replace(/\r/g, "").split("\n")) {
      const line = raw.trimEnd();
      let m;
      if (!line.trim()) { flushP(); flushL(); continue; }
      if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flushP(); flushL(); const n = Math.min(m[1].length + 2, 6); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
      if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushP(); flushL(); out.push("<hr>"); continue; }
      if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(m[1]); continue; }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(m[1]); continue; }
      if ((m = line.match(/^>\s?(.*)$/))) { flushP(); flushL(); out.push("<blockquote>" + inline(m[1]) + "</blockquote>"); continue; }
      if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += " " + line.trim(); continue; }
      flushL(); para.push(line.trim());
    }
    flushP(); flushL();
    return out.join("\n");
  }

  // ---------- actions d'une décision, en français ----------
  const base = (p) => { const b = String(p || "").toUpperCase().replace("/", "").replace(/USDC$/, ""); return b === "XBT" ? "BTC" : b === "XDG" ? "DOGE" : b; };
  function amount(a) {
    if (a.quote_amount != null) return nf(0).format(a.quote_amount) + " USDC de " + base(a.pair);
    if (a.qty != null) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 }).format(a.qty) + " " + base(a.pair);
    return base(a.pair);
  }
  function exits(a) {
    const p = [];
    if (a.stop_loss) p.push("stop " + px(a.stop_loss));
    if (a.take_profit) p.push("objectif " + px(a.take_profit));
    return p.length ? ", " + p.join(", ") : "";
  }
  function summarizeAction(a) {
    switch (a && a.type) {
      case "place_limit": return (a.side === "sell" ? "Vente limite de " : "Achat limite de ") + amount(a) + " à " + px(a.price) + exits(a);
      case "market_buy": return "Achat au marché de " + amount(a) + exits(a);
      case "market_sell": return "Vente au marché de " + amount(a);
      case "cancel": return "Annulation de l'ordre " + (a.order_id || a.id || "?");
      case "note": return "Note : " + (a.text || "");
      default: return "Action inconnue (" + (a && a.type) + ")";
    }
  }

  // ---------- performance par jour (heure de Paris) ----------
  const dayKey = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(t));
  function dailyPerf(rows) {
    const pts = rows.filter((r) => r && !isNaN(r.t) && r.eq != null).slice().sort((a, b) => a.t - b.t);
    const days = [];
    for (const r of pts) {
      const k = dayKey(r.t);
      let d = days[days.length - 1];
      if (!d || d.day !== k) { d = { day: k, first: r, last: r, n: 0 }; days.push(d); }
      d.last = r; d.n++;
    }
    return days.map((d, i) => {
      const start = i > 0 ? days[i - 1].last : d.first; // clôture de la veille, sinon premier point du jour
      const pct = start.eq ? d.last.eq / start.eq - 1 : null;
      const hold = start.hold != null && d.last.hold != null && start.hold ? d.last.hold / start.hold - 1 : null;
      return { day: d.day, points: d.n, pct, hold, diff: pct != null && hold != null ? pct - hold : null, partial: i === 0 };
    });
  }

  // ---------- comptes à rebours ----------
  function nextCycle(now, lastCycleMs) {
    const d = new Date(now); d.setUTCMinutes(7, 0, 0); // :07 à Paris = :07 UTC (décalage d'heures entières)
    let next = d.getTime(); if (next <= now) next += HOUR;
    const age = lastCycleMs ? now - lastCycleMs : null;
    return { next, inMs: next - now, late: age != null && age > 75 * 60e3, ageMs: age };
  }
  function nextSession(lastDecisionMs, now, everyMs = 5 * HOUR) {
    if (!lastDecisionMs) return null;
    const at = lastDecisionMs + everyMs;
    return { at, inMs: at - now, overdue: at < now };
  }
  function duration(ms) {
    const m = Math.max(0, Math.round(ms / 60e3)), h = Math.floor(m / 60);
    return h ? `${h} h ${String(m % 60).padStart(2, "0")}` : `${m} min`;
  }

  // ---------- exposition et risque ----------
  // orderMath : la même fonction que le tableau des ordres (règles du moteur, nettes de frais).
  function exposure(st, price, orderMath) {
    let invested = 0, missing = false;
    const unprotected = [];
    for (const [p, pos] of Object.entries(st.positions || {})) {
      const x = price(p); if (x == null) { missing = true; continue; }
      invested += pos.qty * x;
      const covered = (st.open_orders || []).filter((o) => o.pair === p && o.side === "sell" && o.stop_loss != null).reduce((s, o) => s + o.qty, 0);
      if (covered + 1e-12 < pos.qty) unprotected.push(base(p));
    }
    const total = st.cash + invested;
    let committed = 0, riskPos = 0, riskPending = 0, buysNoStop = 0;
    for (const o of st.open_orders || []) {
      const m = orderMath(o, st, price(o.pair));
      if (o.side === "buy") { committed += m.engaged || 0; if (m.loss != null) riskPending += m.loss; else buysNoStop++; }
      else if (m.loss != null) riskPos += m.loss;
    }
    return { total, invested, cash: st.cash, investedPct: total ? invested / total : 0, committed, committedPct: total ? committed / total : 0,
      riskPos, riskPending, risk: riskPos + riskPending, riskPct: total ? (riskPos + riskPending) / total : 0, unprotected, buysNoStop, missing };
  }

  // ---------- proximité d'un déclenchement ----------
  function proximity(o, m, live, thr = 0.01) {
    if (live == null) return null;
    const lv = [];
    if (o.side === "buy" && m.limit != null) lv.push({ kind: "achat limite", p: m.limit });
    if (o.side === "sell" && m.tp != null) lv.push({ kind: "objectif", p: m.tp });
    if (o.side === "sell" && m.stop != null) lv.push({ kind: "stop", p: m.stop });
    let best = null;
    for (const l of lv) { const d = Math.abs(l.p - live) / live; if (d <= thr && (!best || d < best.dist)) best = { kind: l.kind, dist: d }; }
    return best;
  }

  const api = { md, esc, summarizeAction, dailyPerf, dayKey, nextCycle, nextSession, duration, exposure, proximity };
  if (typeof window !== "undefined") window.KPLib = api;
  if (typeof module !== "undefined") module.exports = api;
})();
