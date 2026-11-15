/* Kraken Paper - exposition, comptes à rebours, calendrier, fil des décisions, leçons.
   Lecture seule. Données : état passé par app.js, décisions et leçons lues via l'API GitHub avec ETag
   (une réponse 304 ne compte pas dans la limite de 60 requêtes/h) et cache local par sha de fichier. */
(() => {
  "use strict";
  const L = window.KPLib;
  const GH = "https://api.github.com/repos/cyrillaferrere/kraken-paper/";
  const $ = (id) => document.getElementById(id);
  const nf = (d) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const usdc = (x) => x == null || isNaN(x) ? "—" : nf(2).format(x) + " USDC";
  const signed = (x, d = 2) => { if (x == null || isNaN(x)) return "—"; const r = Math.round(x * 10 ** d) / 10 ** d; return (r > 0 ? "+" : r < 0 ? "−" : "") + nf(d).format(Math.abs(r)); };
  const pctS = (x, d = 2) => x == null || isNaN(x) ? "—" : signed(x * 100, d) + " %";
  // Signe lu sur la valeur affichée (2 décimales en %) : pas de ▲ devant « +0,00 % ».
  const r4 = (x) => x == null || isNaN(x) ? x : Math.round(x * 1e4) / 1e4;
  const arrow = (x) => (x = r4(x), x == null ? "" : x > 0 ? "▲ " : x < 0 ? "▼ " : "= ");
  const cls = (x) => (x = r4(x), x > 0 ? "up" : x < 0 ? "dn" : "");
  const esc = L.esc;
  const hm = (t) => new Date(t).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  const dtl = (t) => new Date(t).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } } };

  let ctx = null; // { S, journal, equity, price, orderMath, branch }

  // ---------- API GitHub conditionnelle ----------
  let backoffUntil = 0;
  async function ghGet(path, accept) {
    if (Date.now() < backoffUntil) return { status: "backoff" };
    const key = "kp.gh." + path, c = store.get(key);
    const h = { Accept: accept };
    if (c && c.etag) h["If-None-Match"] = c.etag;
    let r;
    try { r = await fetch(GH + path, { headers: h, cache: "no-store" }); } catch (e) { return { status: "error" }; }
    if (r.status === 304 && c) { await r.text().catch(() => ""); return { status: "ok", body: c.body, fresh: false }; }
    if (r.status === 403 || r.status === 429) { backoffUntil = Date.now() + 10 * 60e3; return { status: "limited" }; }
    if (!r.ok) return { status: "error", code: r.status };
    const body = await r.text();
    store.set(key, { etag: r.headers.get("ETag"), body });
    return { status: "ok", body, fresh: true };
  }

  // ---------- décisions ----------
  let decisions = [], decSource = "journal";
  async function loadDecisions() {
    const r = await ghGet("contents/decisions?ref=main", "application/vnd.github+json");
    if (r.status !== "ok") return false;
    let list; try { list = JSON.parse(r.body); } catch { return false; }
    const files = (Array.isArray(list) ? list : []).filter((f) => f.type === "file" && /\.json$/.test(f.name));
    const out = [];
    for (const f of files) {
      const key = "kp.dec." + f.sha; // un blob est immuable : on ne le relit jamais
      let d = store.get(key);
      if (!d) {
        const b = await ghGet("git/blobs/" + f.sha, "application/vnd.github.raw");
        if (b.status !== "ok") continue;
        try { d = JSON.parse(b.body); } catch { d = { _bad: f.name }; }
        store.set(key, d);
        localStorage.removeItem("kp.gh.git/blobs/" + f.sha);
      }
      (Array.isArray(d) ? d : [d]).forEach((x) => out.push(Object.assign({ _file: f.name }, x)));
    }
    decisions = out; decSource = "api";
    return true;
  }
  function decisionsFromJournal() {
    return ctx.journal.filter((e) => e.type === "decision").map((e) => ({ id: e.decision_id, timestamp: e.timestamp || e.time, rationale: e.rationale, actions: null }));
  }
  let decSig = "";
  function renderDecisions() {
    const S = ctx.S, list = (decSource === "api" ? decisions : decisionsFromJournal()).filter((d) => d && d.id);
    const processed = new Set(S.processed_decisions || []);
    const evs = ctx.journal.filter((e) => e.decision_id);
    const sig = JSON.stringify([decSource, list.map((d) => d.id + (d.rationale || "").length), [...processed], evs.length]);
    if (sig === decSig) return;
    decSig = sig;
    const box = $("dec-feed");
    const wasOpen = new Set([...box.querySelectorAll("details[open]")].map((d) => d.dataset.id));
    const sorted = list.slice().sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")) || String(b.id).localeCompare(String(a.id)));
    if (!sorted.length) { box.innerHTML = '<p class="muted">Pas encore de décision : la première arrive à la prochaine session.</p>'; return; }
    box.innerHTML = sorted.map((d, i) => {
      const done = processed.has(d.id);
      const acts = Array.isArray(d.actions) ? d.actions : null;
      const notes = acts ? acts.filter((a) => a.type === "note") : [];
      const rows = acts ? acts.map((a, idx) => {
        if (a.type === "note") return "";
        const rej = evs.find((e) => e.type === "rejected" && e.decision_id === d.id && e.action_index === idx);
        const placed = evs.find((e) => e.type === "order_placed" && e.decision_id === d.id && e.action_index === idx);
        const res = rej ? ` <span class="dn">⛔ refusée : ${esc(rej.reason)}</span>` : placed ? ` <span class="muted">→ ordre ${esc(placed.order.id)}</span>` : done ? ' <span class="muted">✓</span>' : "";
        return `<li>${esc(L.summarizeAction(a))}${res}</li>`;
      }).join("") : "";
      const open = wasOpen.size ? wasOpen.has(d.id) : i === 0;
      return `<details class="dec" data-id="${esc(d.id)}"${open ? " open" : ""}>
        <summary><span class="chev" aria-hidden="true">▸</span><b>${esc(d.id)}</b> <span class="muted">${d.timestamp ? esc(dtl(d.timestamp)) : ""}</span>
          <span class="st-tag ${done ? "ok" : "wait"}">${done ? "✓ appliquée" : "◷ en attente du moteur"}</span></summary>
        <div class="dec-body">
          <p class="dec-why">${esc(d.rationale || "(pas de justification)")}</p>
          ${rows ? `<h4>Actions</h4><ul class="dec-acts">${rows}</ul>` : acts ? "" : '<p class="muted">Détail des actions indisponible (API GitHub limitée), seule la justification est affichée.</p>'}
          ${notes.length ? `<h4>Notes</h4><ul class="dec-notes">${notes.map((n) => `<li>📝 ${esc(n.text)}</li>`).join("")}</ul>` : ""}
        </div></details>`;
    }).join("");
  }

  // ---------- leçons ----------
  let lessonsDone = false;
  async function loadLessons() {
    // Les leçons sont de la doc : on lit la branche déployée (preprod, feature/…) pour voir la version testée, main sinon.
    let v = null; try { v = await window.KP_VERSION_P; } catch { /* rien */ }
    const ref = v && v.branch && /^(main|preprod|feature\/[\w.-]+)$/.test(v.branch) ? v.branch : "main";
    const r = await ghGet("contents/docs/LESSONS.md?ref=" + encodeURIComponent(ref), "application/vnd.github.raw");
    const el = $("lessons");
    if (r.status === "ok") { if (r.fresh || !lessonsDone) el.innerHTML = L.md(r.body); lessonsDone = true; }
    else if (!lessonsDone) el.innerHTML = '<p class="muted">Leçons indisponibles pour l\'instant (API GitHub). Elles sont aussi dans <a href="https://github.com/cyrillaferrere/kraken-paper/blob/main/docs/LESSONS.md">docs/LESSONS.md</a>.</p>';
  }

  // ---------- exposition ----------
  // Jauge empilée : cash disponible / réservé dans les ordres / investi (valeur en direct).
  // Largeurs via transform scaleX (skill motion : transform seulement), transition uniquement si les données changent.
  let expSig = "";
  function renderExposure() {
    const S = ctx.S, x = L.exposure(S, ctx.price, ctx.orderMath);
    const cb = L.cashBreakdown(S, ctx.orderMath), avail = Math.max(0, cb.available);
    const segs = [
      { k: "free", name: "Cash disponible", v: avail },
      { k: "com", name: "Réservé dans les ordres", v: cb.reserved },
      { k: "inv", name: "Investi en positions", v: x.invested },
    ];
    const tot = x.total > 0 ? x.total : 1;
    const pct = (v) => Math.max(0, Math.min(1, v / tot));
    const bar = $("exp-bar");
    if (!bar.children.length) bar.innerHTML = segs.map((g) => `<span class="eseg eseg-${g.k}"></span>`).join("");
    const sig = segs.map((g) => g.v.toFixed(2)).join("|");
    if (sig !== expSig) {
      const first = !expSig; expSig = sig;
      bar.classList.toggle("eready", !first); // pas de transition au premier affichage
      let off = 0;
      segs.forEach((g, i) => { const f = pct(g.v); bar.children[i].style.transform = `translateX(${(off * 100).toFixed(3)}%) scaleX(${f.toFixed(5)})`; off += f; });
    }
    bar.setAttribute("aria-label", segs.map((g) => `${g.name} ${usdc(g.v)} (${nf(1).format(pct(g.v) * 100)} %)`).join(", "));
    $("exp-txt").innerHTML = segs.map((g) => `<li><span class="sw-${g.k}" aria-hidden="true"></span><span class="e-name">${g.name}</span>
        <b>${usdc(g.v)}</b> <span class="muted">${nf(1).format(pct(g.v) * 100)} %</span></li>`).join("")
      + `<li class="muted e-note">Valeur totale ${usdc(x.total)} · cash total ${usdc(cb.total)} = disponible + réservé (le cash réservé compte dans la valeur totale)</li>`;
    const parts = [];
    if (x.riskPos) parts.push(`${signed(x.riskPos)} USDC sur les positions`);
    if (x.riskPending) parts.push(`${signed(x.riskPending)} USDC sur les achats en attente, s'ils s'exécutent`);
    $("exp-risk").innerHTML = `Si tous les stops sont touchés : <b class="${x.risk < 0 ? "dn" : ""}">${signed(x.risk)} USDC</b> <span class="muted">(${pctS(x.riskPct, 1)} du portefeuille, frais compris)</span>`
      + (parts.length ? `<br><span class="muted">${parts.join(" · ")}</span>` : "")
      + (x.unprotected.length ? `<br><span class="warn-txt">⚠ Sans stop : ${x.unprotected.map(esc).join(", ")}</span>` : "")
      + (x.buysNoStop ? `<br><span class="warn-txt">⚠ ${x.buysNoStop} achat${x.buysNoStop > 1 ? "s" : ""} en attente sans stop</span>` : "")
      + (x.missing ? '<br><span class="muted">Prix manquant pour une position : valeur partielle.</span>' : "");
  }

  // ---------- comptes à rebours ----------
  function renderCountdowns() {
    const S = ctx.S, now = Date.now();
    const c = L.nextCycle(now, S.last_cycle ? new Date(S.last_cycle).getTime() : null);
    $("cd-cycle").textContent = `${hm(c.next)} (dans ${L.duration(c.inMs)})`;
    const prod = (window.KP_VERSION && window.KP_VERSION.env === "prod") || (window.KP_ENV_FROM_HOST && window.KP_ENV_FROM_HOST(location.hostname) === "prod");
    $("cd-cycle-note").innerHTML = c.late
      ? `<span class="warn-txt">⚠ Dernier cycle il y a ${L.duration(c.ageMs)}. En production, la fonction Netlify (minute 9) devrait lancer le cycle ; le cron GitHub (minute 7) prend le relais si besoin. Chaque décision lance aussi un cycle.</span>`
      : `Dernier cycle : ${S.last_cycle ? hm(S.last_cycle) : "—"}. Déclencheur principal : fonction Netlify à la minute 9, uniquement en production${prod ? "" : " (pas encore active ici)"}. Le cron GitHub (minute 7) prend le relais si besoin.`;
    const d = S.last_decision, s = L.nextSession(d && d.timestamp ? new Date(d.timestamp).getTime() : null, now);
    $("cd-session").textContent = !s ? "—" : s.overdue ? `estimée à ${hm(s.at)}, en retard de ${L.duration(-s.inMs)}` : `estimée à ${hm(s.at)} (dans ${L.duration(s.inMs)})`;
    $("cd-session-note").textContent = d ? `Environ toutes les 5 h après la dernière décision (${d.id}). Estimation, pas un horaire fixe.` : "Aucune décision pour l'instant.";
  }

  // ---------- calendrier ----------
  let calSig = "";
  function renderCalendar() {
    const days = L.dailyPerf(ctx.equity);
    const sig = JSON.stringify(days);
    if (sig === calSig) return; calSig = sig;
    const box = $("cal");
    if (!days.length) { box.innerHTML = '<p class="muted">Le calendrier apparaîtra après les premiers cycles.</p>'; return; }
    const fmtDay = (k) => new Date(k + "T12:00:00Z").toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "2-digit", month: "2-digit" });
    box.innerHTML = days.slice(-35).reverse().map((d) => `<div class="cal-d ${cls(d.pct)}" role="listitem">
        <div class="cal-h">${esc(fmtDay(d.day))}${d.partial ? ' <span class="muted">départ</span>' : ""}</div>
        <div>Portefeuille <b class="${cls(d.pct)}">${arrow(d.pct)}${pctS(d.pct)}</b></div>
        <div class="muted">BTC conservé ${arrow(d.hold)}${pctS(d.hold)}</div>
        <div class="muted">Écart ${d.diff == null ? "—" : arrow(d.diff) + signed(d.diff * 100, 2) + " pt"}</div>
      </div>`).join("");
    $("cal-note").textContent = days.length < 7 ? `${days.length} jour${days.length > 1 ? "s" : ""} de données pour l'instant : le calendrier se remplit jour après jour.` : "";
  }

  // ---------- interactions ----------
  document.addEventListener("toggle", (e) => {
    const d = e.target; if (!(d instanceof HTMLDetailsElement) || !d.classList.contains("dec") && !d.classList.contains("fold")) return;
    if (d.open) { const b = d.querySelector(".dec-body, .fold-body"); if (b) { b.classList.remove("motion-expand"); void b.offsetWidth; b.classList.add("motion-expand"); } }
  }, true);

  // ---------- point d'entrée (appelé par app.js à chaque rendu) ----------
  let started = false, lastApi = 0;
  async function refreshRemote() {
    lastApi = Date.now();
    await loadDecisions();
    renderDecisions();
    await loadLessons();
  }
  window.KPExtras = {
    onPrice(c) {
      ctx = c;
      renderExposure();
    },
    onState(c) {
      ctx = c;
      renderExposure(); renderCountdowns(); renderCalendar(); renderDecisions();
      if (!started) { started = true; refreshRemote(); setInterval(() => { if (!document.hidden && ctx) renderCountdowns(); }, 30e3); }
      else if (c.stateChanged && Date.now() - lastApi > 60e3) refreshRemote();
    },
  };
})();
