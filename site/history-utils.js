/* Pure history helpers: never alter source snapshots or invent observations. */
(function (root) {
  "use strict";
  function extent(points) {
    let min = Infinity, max = -Infinity;
    for (const p of points) for (const value of [p.eq, p.hold]) {
      if (Number.isFinite(value)) { min = Math.min(min, value); max = Math.max(max, value); }
    }
    return min === Infinity ? null : { min, max };
  }
  function sample(points, budget = 1200) {
    if (points.length <= budget) return points;
    const selected = new Set([0, points.length - 1]);
    const buckets = Math.max(1, Math.floor((budget - 2) / 4));
    const span = (points.length - 2) / buckets;
    for (let b = 0; b < buckets; b++) {
      const start = 1 + Math.floor(b * span);
      const end = Math.min(points.length - 1, 1 + Math.floor((b + 1) * span));
      for (const key of ["eq", "hold"]) {
        let low = Infinity, high = -Infinity, lowIdx = -1, highIdx = -1;
        for (let i = start; i < end; i++) {
          const v = points[i][key];
          if (!Number.isFinite(v)) continue;
          if (v < low) { low = v; lowIdx = i; }
          if (v > high) { high = v; highIdx = i; }
        }
        if (lowIdx >= 0) selected.add(lowIdx);
        if (highIdx >= 0) selected.add(highIdx);
      }
    }
    return [...selected].sort((a, b) => a - b).map((i) => points[i]);
  }
  function path(points, key, x, y) {
    let started = false, d = "";
    for (const p of points) {
      const v = p[key];
      if (!Number.isFinite(v)) { started = false; continue; }
      d += (started ? "L" : "M") + x(p.t).toFixed(1) + "," + y(v).toFixed(1);
      started = true;
    }
    return d;
  }
  root.KPHistory = Object.freeze({ extent, sample, path });
})(typeof window !== "undefined" ? window : globalThis);
