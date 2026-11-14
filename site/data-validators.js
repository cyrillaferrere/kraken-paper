/* Kraken Paper: pure validators for public read-only data. */
(function (root) {
  "use strict";
  function prices(payload, pairs, aliases) {
    if (!payload || !payload.result || !Array.isArray(payload.error) || payload.error.length) throw new Error("Réponse Kraken invalide");
    const values = {};
    for (const pair of pairs) {
      const names = [pair, ...((aliases && aliases[pair]) || [])];
      const entry = names.map((name) => payload.result[name]).find(Boolean);
      const raw = entry && entry.c && entry.c[0];
      const n = raw == null || raw === "" ? NaN : Number(raw);
      if (Number.isFinite(n) && n > 0) values[pair] = n;
    }
    return { values, found: Object.keys(values).length, requested: pairs.length };
  }
  function equity(csv) {
    const lines = String(csv || "").trim().split("\n");
    if (!lines[0] || !/^time,/.test(lines[0].trim())) throw new Error("En-tête equity.csv invalide");
    const out = [];
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const [time, eq, , , , hold] = line.split(",");
      const t = Date.parse(time), value = Number(eq), benchmark = hold === "" || hold == null ? null : Number(hold);
      if (!Number.isFinite(t) || eq === "" || !Number.isFinite(value) || (benchmark !== null && !Number.isFinite(benchmark))) throw new Error("Cycle equity.csv invalide");
      if (out.length && t <= out[out.length - 1].t) throw new Error("Cycles equity.csv non chronologiques");
      out.push({ t, eq: value, hold: benchmark });
    }
    return out;
  }
  function journal(jsonl) {
    const out = [];
    for (const line of String(jsonl || "").split("\n")) {
      if (!line.trim()) continue;
      let item;
      try { item = JSON.parse(line); } catch { throw new Error("Ligne journal.jsonl invalide"); }
      if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.type !== "string") throw new Error("Événement journal.jsonl invalide");
      out.push(item);
    }
    return out;
  }
  root.KPData = Object.freeze({ prices, equity, journal });
})(typeof window !== "undefined" ? window : globalThis);
