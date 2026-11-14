/* Only chart preferences; no trading state, credentials or decisions. */
(function (root) {
  "use strict";
  const KEY = "kraken-paper-chart-v1";
  const intervals = ["5m", "15m", "30m", "1h", "4h", "1d"];
  const ranges = [60, 120, 240];
  function normalize(input) {
    const o = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    return {
      pair: typeof o.pair === "string" && /^[A-Z0-9]{2,20}USDC$/.test(o.pair) ? o.pair : "XBTUSDC",
      tf: intervals.includes(o.tf) ? o.tf : "1h",
      bars: (typeof o.bars === "number" && ranges.includes(o.bars)) ? o.bars : 120,
    };
  }
  function read(storage) {
    try { return normalize(JSON.parse(storage.getItem(KEY))); } catch { return normalize(null); }
  }
  function write(storage, preferences) {
    try { storage.setItem(KEY, JSON.stringify(normalize(preferences))); return true; } catch { return false; }
  }
  root.KPChartPrefs = Object.freeze({ normalize, read, write });
})(typeof window !== "undefined" ? window : globalThis);
