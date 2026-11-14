/* Kraken Paper - tableau de bord (lecture seule, aucune donnee inventee). */
(() => {
  "use strict";
  // État lu via l'API GitHub (pas de cache de 5 min), sans jeton. Repli sur raw.githubusercontent.com si la limite est atteinte.
  const GH_API = "https://api.github.com/repos/cyrillaferrere/kraken-paper/";
  const RAW = "https://raw.githubusercontent.com/cyrillaferrere/kraken-paper/main/state/";
  const FILES = ["portfolio.json", "equity.csv", "journal.jsonl"];
  const TICKER = "https://api.kraken.com/0/public/Ticker?pair=";
  const BENCH = "XBTUSDC";
  const PRICE_EVERY = 15000, STATE_EVERY = 120000, STALE_MS = 2 * 3600 * 1000;

  let S = null, equity = [], journal = [], stateChanged = false;
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
  // gh.mode : "api" ou "raw" (repli). On interroge d'abord le sha du dernier commit de main avec If-None-Match :
  // une réponse 304 ne compte pas dans la limite de 60 requêtes/h. Les 3 fichiers ne sont relus que si le sha change.
  const gh = { mode: "api", sha: null, etag: null, retryAt: 0, remaining: null };
  class RateLimited extends Error { constructor(reset) { super("limite API GitHub atteinte"); this.reset = reset; } }
  function noteLimit(r) {
    const rem = r.headers.get("X-RateLimit-Remaining"), reset = r.headers.get("X-RateLimit-Reset");
    if (rem != null) gh.remaining = +rem;
    if (r.status === 403 || r.status === 429 || (r.status !== 304 && !r.ok && gh.remaining === 0)) throw new RateLimited(reset ? +reset * 1000 : 0);
    return r;
  }
  async function fromApi() {
    const h = { Accept: "application/vnd.github.sha" };
    if (gh.etag && S) h["If-None-Match"] = gh.etag;
    const r = noteLimit(await fetch(GH_API + "commits/main", { headers: h, cache: "no-store" }));
    if (r.status === 304) return null;
    if (!r.ok) throw new Error("API GitHub " + r.status);
    const sha = (await r.text()).trim();
    gh.etag = r.headers.get("ETag") || gh.etag;
    if (sha === gh.sha && S) return null;
    if (gh.remaining != null && gh.remaining < FILES.length) throw new RateLimited(0);
    const texts = await Promise.all(FILES.map(async (f) => {
      const x = noteLimit(await fetch(GH_API + "contents/state/" + f + "?ref=" + sha, { headers: { Accept: "application/vnd.github.raw" }, cache: "no-store" }));
      if (!x.ok) { if (f === "portfolio.json") throw new Error("API GitHub " + x.status); return ""; }
      return x.text();
    }));
    gh.sha = sha;
    return texts;
  }
  async function fromRaw() {
    const bust = "?t=" + Date.now();
    return Promise.all(FILES.map((f) => fetch(RAW + f + bust, { cache: "no-store" }).then((r) => {
      if (!r.ok) { if (f === "portfolio.json") throw new Error(r.status); return ""; }
      return r.text();
    })));
  }
  function setSource() {
    const el = $("st-src");
    if (gh.mode === "api") { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = "Source de secours : copie GitHub, jusqu'à 5 min de retard";
    el.title = gh.retryAt ? "Retour à l'API GitHub vers " + new Date(gh.retryAt).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }) : "";
  }

  async function loadState() {
    try {
      let texts = null;
      if (gh.mode === "api" || Date.now() >= gh.retryAt) {
        try { texts = await fromApi(); gh.mode = "api"; }
        catch (e) {
          // Limite atteinte (403/429), réseau ou erreur de l'API : on passe sur la copie raw et on réessaie l'API plus tard.
          gh.mode = "raw"; gh.retryAt = Math.max(e.reset || 0, Date.now() + 10 * 60 * 1000);
          texts = await fromRaw();
        }
      } else texts = await fromRaw();
      setSource();
      if (!texts) return; // rien de neuf depuis le dernier commit : pas de rendu inutile
      const [p, e, j] = texts;
      S = JSON.parse(p);
      equity = e.trim().split("\n").slice(1).filter(Boolean).map((l) => {
        const [time, eq, cash, pos, btc, hold] = l.split(",");
        return { t: new Date(time).getTime(), eq: +eq, hold: hold === "" ? null : +hold };
      }).filter((r) => !isNaN(r.t) && !isNaN(r.eq));
      journal = j.trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      $("alert").hidden = true;
      await loadPrices();
      stateChanged = true;
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
    // Comme sur Kraken : les achats en attente réservent leur montant (frais maker compris). La valeur totale ne change pas.
    const cb = window.KPLib ? window.KPLib.cashBreakdown(S, orderMath) : { total: S.cash, reserved: 0, available: S.cash };
    $("cash").textContent = "Cash total " + usdc(cb.total) + " · réservé dans les ordres " + usdc(cb.reserved) + " · cash disponible " + usdc(cb.available);

    renderPositions(); renderOrders(); renderTrades(); renderJournal(); renderChart(hold, missing ? null : total);
    if (firstRender) {
      // Entrée des panneaux : une seule fois au premier rendu, jamais au polling.
      document.querySelectorAll(".kpi, .card").forEach((el, i) => { el.style.setProperty("--i", Math.min(i, 5)); el.classList.add("motion-panel-enter"); });
      firstRender = false;
    }
    if (window.KPMarkets) window.KPMarkets.onState({ S, journal, price, orderMath });
    if (window.KPExtras) window.KPExtras.onState({ S, journal, equity, price, orderMath, branch: (window.KP_VERSION && window.KP_VERSION.branch) || "main", stateChanged });
    stateChanged = false;
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

  // ---------- ordres : calculs nets de frais, mêmes règles que engine/run.py ----------
  // Achat limite : exécuté au prix limite en maker. Stop : vente au stop −0,1 % en taker. Objectif : vente limite en maker.
  // Les frais sont arrondis à 6 décimales par exécution, comme money() dans le moteur ; l'affichage est au centime.
  const cents = (x) => Math.round(x * 100) / 100;
  const money = (x) => Math.round(x * 1e6) / 1e6;
  const roundTo = (x, d) => { const f = Math.pow(10, d); return Math.round(x * f) / f; };
  function orderMath(o, st, live) {
    const f = Object.assign({ maker: 0.004, taker: 0.008, slippage: 0.001 }, st.fees || {});
    const pd = (st.pairs && st.pairs[o.pair] && st.pairs[o.pair].pair_decimals) ?? 2;
    const sellNet = (qty, px, rate) => { const g = qty * px; return g - money(g * rate); };
    let basis = null, limit = o.price ?? null, stop = o.stop_loss ?? null, tp = null;
    if (o.side === "buy") {
      const g = o.qty * o.price; basis = g + money(g * f.maker);
      tp = o.take_profit ?? null;
    } else {
      const pos = st.positions && st.positions[o.pair];
      basis = pos ? o.qty * pos.avg_cost : null;
      tp = o.price ?? null;
    }
    const stopPx = stop != null ? roundTo(stop * (1 - f.slippage), pd) : null;
    const loss = stopPx != null && basis != null ? cents(sellNet(o.qty, stopPx, f.taker) - basis) : null;
    const gain = tp != null && basis != null ? cents(sellNet(o.qty, tp, f.maker) - basis) : null;
    const rr = loss != null && gain != null && loss < 0 ? gain / -loss : null;
    const dist = (lvl) => lvl == null || live == null ? null : (lvl - live) / live;
    return { engaged: basis == null ? null : cents(basis), limit, stop, stopPx, tp, loss, gain, rr,
      dLimit: dist(limit), dStop: dist(stop), dTp: o.side === "sell" ? dist(tp) : null };
  }
  window.KP_ORDER_MATH = orderMath;

  const expanded = new Set();
  const distTxt = (d, lbl) => d == null ? "—" : `${lbl ? lbl + " " : ""}${d < 0 ? "↓" : "↑"} ${pct(d)}`;
  let nearPrev = new Map(), nearNow = new Map();
  function renderOrders() {
    const tb = $("orders").tBodies[0];
    nearPrev = nearNow; nearNow = new Map();
    const rows = S.open_orders.map((o) => {
      const x = price(o.pair), m = orderMath(o, S, x);
      const hitL = x != null && m.limit != null && (o.side === "buy" ? x <= m.limit : x >= m.limit);
      const hitS = x != null && o.side === "sell" && m.stop != null && x <= m.stop;
      const hit = liveOk && (hitL || hitS);
      const pair = esc(base(o.pair)) + "/USDC";
      const dist = o.side === "buy" ? distTxt(m.dLimit) : [m.dTp != null ? distTxt(m.dTp, "obj.") : null, m.dStop != null ? distTxt(m.dStop, "stop") : null].filter(Boolean).join("<br>") || "—";
      const limitLbl = o.side === "buy" ? px(m.limit) : m.limit != null ? px(m.limit) + (o.parent ? ' <span class="muted">objectif</span>' : "") : '<span class="muted">aucun</span>';
      const stopTxt = m.stop != null ? px(m.stop) : '<span class="warn-txt">⚠ pas de stop</span>';
      const tpTxt = m.tp != null ? px(m.tp) : "—";
      const lossTxt = m.loss != null ? `<span class="dn">${signed(m.loss)} USDC</span>` : m.stop == null ? '<span class="warn-txt">non bornée</span>' : "—";
      const gainTxt = m.gain != null ? `<span class="${cls(m.gain)}">${signed(m.gain)} USDC</span>` : "—";
      const rrTxt = m.rr != null ? nf(2).format(m.rr) + " : 1" : "—";
      const created = dt(o.created), dec = o.decision_id ? esc(o.decision_id) : (o.parent ? "sortie de " + esc(o.parent) : "—");
      const open = expanded.has(o.id);
      const near = window.KPLib ? window.KPLib.proximity(o, m, liveOk ? x : null, 0.01) : null;
      const wasNear = nearPrev.get(o.id);
      nearNow.set(o.id, near ? near.kind : null);
      const flash = near && nearPrev.has(o.id) && wasNear !== near.kind; // surlignage unique au changement d'état, jamais clignotant
      const prox = near ? `<span class="prox${flash ? " kpi-updated" : ""}">◎ à ${nf(1).format(near.dist * 100)} % du déclenchement (${near.kind})</span>` : "";
      const note = hit ? '<span class="reached-note">⚡ Niveau atteint en direct, pas encore enregistré par le moteur</span>' : "";
      const main = `<tr class="o-row${hit ? " reached" : ""}">
        <td><button type="button" class="o-toggle motion-button" aria-expanded="${open}" aria-controls="od-${esc(o.id)}" data-oid="${esc(o.id)}"><span class="chev" aria-hidden="true">▸</span><span class="o-toggle-label">${open ? "Réduire" : "Détails"}</span><span class="sr"> de l'ordre </span></button>${esc(o.id)} · <b>${pair}</b> <span class="tag ${o.side} m-only">${o.side === "buy" ? "ACHAT" : "VENTE"}</span><span class="o-meta">${created} · ${dec}</span>${prox}${note}</td>
        <td class="c-s"><span class="tag ${o.side}">${o.side === "buy" ? "ACHAT" : "VENTE"}</span></td>
        <td class="r">${m.engaged != null ? usdc(m.engaged) : "—"}<br><span class="muted">${qty(o.qty)} ${esc(base(o.pair))}</span></td>
        <td class="r c-x">${limitLbl}<br><span class="muted">${px(x)}</span></td><td class="r">${dist}</td>
        <td class="r c-x">${stopTxt}</td><td class="r c-x">${tpTxt}</td><td class="r c-x">${lossTxt}</td><td class="r c-x">${gainTxt}</td><td class="r c-x">${rrTxt}</td></tr>`;
      const det = `<tr class="o-detail" id="od-${esc(o.id)}"${open ? "" : " hidden"}><td colspan="10"><dl class="o-dl">
        <div><dt>Prix limite</dt><dd>${limitLbl}</dd></div><div><dt>Prix actuel</dt><dd>${px(x)}</dd></div>
        <div><dt>Stop</dt><dd>${stopTxt}</dd></div><div><dt>Objectif</dt><dd>${tpTxt}</dd></div>
        <div><dt>Perte max</dt><dd>${lossTxt}</dd></div><div><dt>Gain visé</dt><dd>${gainTxt}</dd></div>
        <div><dt>Gain / risque</dt><dd>${rrTxt}</dd></div><div><dt>Créé</dt><dd>${created}</dd></div><div class="wide"><dt>Décision</dt><dd>${dec}</dd></div></dl></td></tr>`;
      return main + det;
    });
    tb.innerHTML = rows.join("") || `<tr><td colspan="10" class="empty">Aucun ordre ouvert.</td></tr>`;
  }
  // Détail mobile : ouverture uniquement sur action de l'utilisateur ; le polling ne rejoue pas l'animation.
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".o-toggle"); if (!b) return;
    const id = b.dataset.oid, row = document.getElementById("od-" + id), open = !expanded.has(id);
    if (open) expanded.add(id); else expanded.delete(id);
    b.setAttribute("aria-expanded", open);
    const label = b.querySelector(".o-toggle-label"); if (label) label.textContent = open ? "Réduire" : "Détails";
    if (row) { row.hidden = !open; if (open) { const dl = row.querySelector(".o-dl"); dl.classList.remove("motion-expand"); void dl.offsetWidth; dl.classList.add("motion-expand"); } }
  });

  // ---------- version du site (écrite au déploiement par scripts/deploy.sh) ----------
  const ENV_LBL = { prod: "PROD", preprod: "PRÉPROD", feature: "FEATURE", local: "LOCAL" };
  // L'environnement se déduit d'abord de l'adresse (un seul site Netlify) :
  // kraken-paper.netlify.app = prod, preprod--kraken-paper... = préprod, feature-<nom>--kraken-paper... = feature.
  function envFromHost(h) {
    if (h === "kraken-paper.netlify.app") return "prod";
    if (/^preprod--kraken-paper\.netlify\.app$/.test(h)) return "preprod";
    if (/^feature-[a-z0-9-]+--kraken-paper\.netlify\.app$/.test(h)) return "feature";
    if (/--kraken-paper\.netlify\.app$/.test(h)) return "feature"; // autre déploiement non production (aperçu, lien unique)
    return null;
  }
  window.KP_ENV_FROM_HOST = envFromHost;
  async function loadVersion() {
    let v = null;
    try { const r = await fetch("version.json", { cache: "no-store" }); if (r.ok) v = await r.json(); } catch (e) { /* site local : pas de version.json */ }
    const env = envFromHost(location.hostname) || (v && ENV_LBL[v.env] ? v.env : "local");
    const b = $("env-badge"); b.textContent = ENV_LBL[env]; b.className = "badge env env-" + env;
    b.title = env === "prod" ? "Production" : env === "preprod" ? "Préproduction : site de test" : env === "feature" ? "Branche de développement" : "Version locale non déployée";
    window.KP_VERSION = v;
    if (!v) return v;
    $("b-version").textContent = "v" + v.version;
    const c = $("b-commit"); c.textContent = "commit " + String(v.commit).slice(0, 7); c.href = "https://github.com/cyrillaferrere/kraken-paper/commit/" + encodeURIComponent(v.commit);
    $("b-branch").textContent = "branche " + v.branch;
    $("b-time").textContent = v.built ? " · déployé le " + dt(v.built) : "";
    if (env !== "prod") document.title = "[" + ENV_LBL[env] + "] " + document.title;
    return v;
  }
  window.KP_VERSION_P = loadVersion();

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
    $("journal").innerHTML = items.map(([e, t]) => `<li data-event-type="${esc(e.type)}"><time>${dt(e.time)}</time><span>${t}</span></li>`).join("") || "<li>Journal vide.</li>";
  }

  let equityPeriod = "all";
  const equityWindows = { "1d": 86400000, "7d": 604800000, "30d": 2592000000 };
  function setEquityPeriod(period) {
    if (period !== "all" && !equityWindows[period]) return;
    equityPeriod = period;
    document.querySelectorAll(".equity-range").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.period === period)));
    renderChart();
  }
  document.querySelectorAll(".equity-range").forEach((b) => b.addEventListener("click", () => setEquityPeriod(b.dataset.period)));
  function renderChart() {
    const el = $("chart");
    const end = equity.length ? equity[equity.length - 1].t : 0;
    const start = equityPeriod === "all" ? -Infinity : end - equityWindows[equityPeriod];
    const pts = equity.filter((p) => p.t >= start);
    const note = $("equity-period-note");
    if (note) note.textContent = pts.length + " / " + equity.length + " cycles affichés";
    if (pts.length < 2) { el.innerHTML = `<div class="empty">Pas assez de cycles sur cette période (${pts.length} point${pts.length > 1 ? "s" : ""}). Choisissez une période plus longue.</div>`; return; }
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
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Performance du portefeuille et du BTC conservé, ${pts.length} cycles de ${fmtT(t0)} à ${fmtT(t1)}">
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
