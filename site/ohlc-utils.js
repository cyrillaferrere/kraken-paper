/* Pure OHLC validation for read-only Kraken chart data. */
(function (root) {
  "use strict";
  function parse(result) {
    if (!result || typeof result !== "object") throw new Error("OHLC Kraken invalide");
    const key = Object.keys(result).find((x) => x !== "last");
    if (!key || !Array.isArray(result[key])) throw new Error("OHLC Kraken absent");
    const bars = result[key].map((r) => {
      if (!Array.isArray(r) || r.length < 7) throw new Error("Bougie Kraken incomplète");
      const [t, o, h, l, c, v] = [r[0], r[1], r[2], r[3], r[4], r[6]].map(Number);
      if (![t, o, h, l, c, v].every(Number.isFinite) || t <= 0 || Math.floor(t) !== t || Math.min(o, h, l, c) <= 0 || v < 0 || h < Math.max(o, l, c) || l > Math.min(o, h, c)) throw new Error("Bougie Kraken incohérente");
      return { t, o, h, l, c, v };
    });
    if (!bars.length) throw new Error("Aucune bougie Kraken disponible");
    for (let i = 1; i < bars.length; i++) if (bars[i].t <= bars[i - 1].t) throw new Error("Bougies Kraken non chronologiques");
    return bars;
  }
  root.KPOHLC = Object.freeze({ parse });
})(typeof window !== "undefined" ? window : globalThis);
