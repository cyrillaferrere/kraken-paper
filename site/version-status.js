/* Pure helpers for the permanent header. No trading actions. */
(function (root) {
  "use strict";
  const tiers = [
    [0,.004,.008],[2500,.003,.006],[10000,.0022,.0038],[25000,.002,.0035],
    [50000,.0015,.003],[100000,.0012,.0025],[250000,.001,.0022],
    [500000,.0008,.002],[1000000,.0006,.0018],[2500000,.0004,.0015],
    [5000000,.0002,.0012],[10000000,0,.001]
  ];
  function feeTier(trades, nowMs) {
    const start = nowMs - 30 * 86400000;
    const vol = (Array.isArray(trades) ? trades : []).reduce((sum, t) => {
      const ms = Number(t.ts) * 1000;
      return Number.isFinite(ms) && ms >= start && ms <= nowMs
        ? sum + Number(t.qty || 0) * Number(t.price || 0) : sum;
    }, 0);
    let tier = tiers[0];
    for (const next of tiers) if (vol >= next[0]) tier = next;
    return { volume30d: vol, maker: tier[1], taker: tier[2] };
  }
  root.KPVersionStatus = Object.freeze({ feeTier });
})(typeof window !== "undefined" ? window : globalThis);
