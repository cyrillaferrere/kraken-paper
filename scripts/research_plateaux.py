#!/usr/bin/env python3
"""Kraken Paper R-01: standalone research on official spot OHLCVT archives.

Requires Python 3.11+ only. Does not access engine/, decisions/ or state/.
"""
import argparse
import csv
import hashlib
import io
import json
import math
import random
import statistics
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

DAY = 86400
HORIZON = 48 * 3600
EMBARGO = HORIZON
MAKER, TAKER, SLIP = 0.004, 0.008, 0.001
ASSETS = {"BTC": ("XBT", "BTC"), "ETH": ("ETH",), "SOL": ("SOL",)}
ARCHIVE_SHA256_CACHE = {}


def sha256(path):
    stat = Path(path).stat()
    key = (str(Path(path).resolve()), stat.st_size, stat.st_mtime_ns)
    if key in ARCHIVE_SHA256_CACHE:
        return ARCHIVE_SHA256_CACHE[key]
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    ARCHIVE_SHA256_CACHE[key] = digest.hexdigest()
    return ARCHIVE_SHA256_CACHE[key]


def read_candles(data, source):
    """Official no-header CSV: timestamp,O,H,L,C,volume,trades."""
    output = {}
    for row in csv.reader(io.StringIO(data.decode("utf-8-sig"))):
        if not row:
            continue
        if len(row) < 7:
            raise ValueError(f"Bad OHLCVT row in {source}")
        try:
            ts = int(row[0])
            o, h, l, c, vol = map(float, row[1:6])
            trades = int(float(row[6]))
        except (ValueError, TypeError) as exc:
            raise ValueError(f"Unparseable OHLCVT row in {source}") from exc
        if (not all(math.isfinite(x) for x in (o, h, l, c, vol))
                or min(o, h, l, c) <= 0 or l > min(o, c) or h < max(o, c)
                or vol < 0 or trades < 0):
            raise ValueError(f"Invalid OHLCVT at {ts} in {source}")
        bar = (ts, o, h, l, c, vol, trades)
        if ts in output and output[ts] != bar:
            raise ValueError(f"Conflicting timestamp {ts} in {source}")
        output[ts] = bar
    return output


def gather(archives, base, minutes):
    """Read only selected spot pair/timeframe entries; never infer missing candles."""
    names = {f"{symbol}{quote}_{minutes}.CSV"
             for symbol in ASSETS[base] for quote in ("USDC", "USD")}
    by_quote = {"USDC": {}, "USD": {}}
    sources = {"USDC": [], "USD": []}
    hashes = {}
    for archive in archives:
        archive = Path(archive)
        if archive.suffix.lower() == ".zip":
            with zipfile.ZipFile(archive) as zf:
                matches = sorted(name for name in zf.namelist()
                                 if Path(name).name.upper() in names)
                batches = [(name, zf.read(name)) for name in matches]
        elif archive.suffix.lower() == ".csv":
            batches = [(archive.name, archive.read_bytes())]
        else:
            continue
        for name, raw in batches:
            basename = Path(name).name.upper()
            if basename not in names:
                continue
            quote = "USDC" if basename.removesuffix(f"_{minutes}.CSV").endswith("USDC") else "USD"
            candles = read_candles(raw, f"{archive.name}:{name}")
            for ts, bar in candles.items():
                if ts in by_quote[quote] and by_quote[quote][ts] != bar:
                    raise ValueError(f"Conflicting official archives at {ts} for {base}/{quote}")
                by_quote[quote][ts] = bar
            if str(archive) not in hashes:
                hashes[str(archive)] = sha256(archive)
            sources[quote].append({
                "archive": str(archive),
                "entry": name,
                "archive_sha256": hashes[str(archive)],
                "csv_sha256": hashlib.sha256(raw).hexdigest(),
            })
    for quote in ("USDC", "USD"):
        bars = sorted(by_quote[quote].values())
        if len(bars) < 3 or bars[-1][0] - bars[0][0] < 1095 * DAY:
            continue
        coverage = len(bars) / (1 + (bars[-1][0] - bars[0][0]) // (minutes * 60))
        if coverage >= .95:
            return quote, bars, coverage, sources[quote]
    raise ValueError(f"Missing >=3 years or <95% coverage: {base} {minutes}m")


def extend_api(bars, base, quote, minutes):
    """Append only continuous, fully closed REST OHLC candles (720 max)."""
    url = "https://api.kraken.com/0/public/OHLC?" + urlencode({
        "pair": ASSETS[base][0] + quote, "interval": minutes,
    })
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            raw = response.read()
        payload = json.loads(raw)
        if payload.get("error"):
            return bars, {"status": "api_error", "details": payload["error"]}
        series = next(value for key, value in payload["result"].items() if key != "last")
        # The final Kraken REST candle is still forming and MUST be excluded.
        fetched = [(int(x[0]), float(x[1]), float(x[2]), float(x[3]),
                    float(x[4]), float(x[6]), int(x[7])) for x in series[:-1]]
        new = [bar for bar in fetched if bar[0] > bars[-1][0]]
        fingerprint = hashlib.sha256(raw).hexdigest()
        if not new:
            return bars, {"status": "nothing_new", "response_sha256": fingerprint}
        step = minutes * 60
        if (new[0][0] != bars[-1][0] + step
                or any(new[j][0] - new[j - 1][0] != step for j in range(1, len(new)))):
            return bars, {"status": "gap_after_archive_ignored",
                          "last_archive_utc": bars[-1][0],
                          "first_api_utc": new[0][0],
                          "response_sha256": fingerprint}
        return bars + new, {
            "status": "extended", "appended": len(new), "url": url,
            "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
            "response_sha256": fingerprint,
        }
    except (OSError, ValueError, KeyError, StopIteration) as exc:
        return bars, {"status": "api_unavailable", "error_type": type(exc).__name__}


def pct_rank(values, i, length):
    current = values[i]
    previous = values[i-length:i]
    if current is None or len(previous) != length or any(v is None for v in previous):
        return None
    return sum(v <= current for v in previous) / length


def build_features(bars, minutes):
    """All features rely exclusively on the current and earlier CLOSED candles."""
    count = len(bars)
    width = 24 if minutes == 60 else 16
    window = 360 if minutes == 60 else 180
    drop_steps = 96 * 60 // minutes
    trend_steps = 30 * 24 * 60 // minutes
    forward = 48 * 60 // minutes
    step = minutes * 60
    atr, norm, ranges = [None]*count, [None]*count, [None]*count
    for i in range(14, count):
        if bars[i][0] - bars[i-14][0] != 14*step:
            continue
        tr = [max(bars[k][2]-bars[k][3],
                  abs(bars[k][2]-bars[k-1][4]),
                  abs(bars[k][3]-bars[k-1][4]))
              for k in range(i-13, i+1)]
        atr[i] = sum(tr)/14
        norm[i] = atr[i]/bars[i][4]
    for i in range(width-1, count):
        if bars[i][0]-bars[i-width+1][0] != (width-1)*step:
            continue
        sample = bars[i-width+1:i+1]
        ranges[i] = (max(x[2] for x in sample)-min(x[3] for x in sample))/bars[i][4]
    minimum = max(width+window, width+drop_steps, trend_steps, 30)
    results = []
    for i in range(minimum, count-forward):
        earlier = max(width+drop_steps, trend_steps)
        if (bars[i][0]-bars[i-earlier][0] != earlier*step
                or atr[i] is None or atr[i] <= 0):
            continue
        rp = pct_rank(ranges, i, window)
        ap = pct_rank(norm, i, window)
        if rp is None or ap is None:
            continue
        slope = abs(bars[i][4]-bars[i-width+1][4])/atr[i]
        plateau = rp <= .35 and ap <= .50 and slope <= 2
        first = i-width+1  # first observed candle of plateau, inclusive
        post_drop = bars[first][4]/bars[first-drop_steps][4] <= .98
        trend = bars[i][4]/bars[i-trend_steps][4]-1
        regime = "bull" if trend > .05 else "bear" if trend < -.05 else "sideways"
        volband = "low" if ap < 1/3 else "high" if ap > 2/3 else "medium"
        min_now = min(x[3] for x in bars[i-5:i+1])
        min_old = min(x[3] for x in bars[i-11:i-5])
        support = (min_now >= min_old-.25*atr[i]
                   and bars[i][4] > min(min_now, min_old)+.5*atr[i])
        recent = bars[i][4]-bars[i-6][4]
        prior = bars[i-6][4]-bars[i-12][4]
        decel = recent-prior >= .5*atr[i] and recent >= -.5*atr[i]
        strong = sum((bars[k][4]-bars[k][3])/(bars[k][2]-bars[k][3])
                     for k in range(i-3, i+1) if bars[k][2] > bars[k][3])/4 > .60
        prev_vol = sum(x[5] for x in bars[i-15:i-3])/12
        dry = (prev_vol > 0 and
               sum(x[5] for x in bars[i-3:i+1])/4/prev_vol < .8)
        def rsi(j):
            diff = [bars[k][4]-bars[k-1][4] for k in range(j-13, j+1)]
            gains = sum(max(0, x) for x in diff)
            losses = sum(max(0, -x) for x in diff)
            return 100-100/(1+gains/max(losses, 1e-10))
        recovery = rsi(i)-rsi(i-3) > 3 and rsi(i) < 60
        results.append({
            "i": i, "ts": bars[i][0], "atr": atr[i], "plateau": plateau,
            "post_drop": post_drop, "regime": regime, "vol": volband,
            "score": sum((support, decel, strong, dry, recovery)),
        })
    return results


def outcome(bars, signal, minutes):
    i = signal["i"]
    close, atr = bars[i][4], signal["atr"]
    upper, lower = close + 1.5*atr, close-atr
    step = minutes*60
    for k in range(i+1, i+1+48*60//minutes):
        if bars[k][0]-bars[k-1][0] != step:
            return "missing"
        if bars[k][3] <= lower:
            return "down"  # pessimistic when both thresholds hit in one bar
        if bars[k][2] >= upper:
            return "up"
    return "flat"


def select_plateaux(features, minutes):
    cooldown = HORIZON//(minutes*60)
    last, result = -10**9, []
    for signal in features:
        if signal["plateau"] and signal["i"]-last >= cooldown:
            result.append(signal)
            last = signal["i"]
    return result


def pair_controls(plateaux, features, first, last, minutes, drop_only=False):
    signals = [x for x in plateaux if first <= x["ts"] < last
               and (x["post_drop"] or not drop_only)]
    controls = [x for x in features if first <= x["ts"] < last
                and not x["plateau"] and (x["post_drop"] or not drop_only)
                and all(abs(x["ts"]-p["ts"]) >= HORIZON for p in signals)]
    used, matched = [], []
    for p in signals:
        choices = [c for c in controls
                   if c["regime"] == p["regime"] and c["vol"] == p["vol"]
                   and c["post_drop"] == p["post_drop"]
                   and all(abs(c["ts"]-u) >= HORIZON for u in used)]
        if choices:
            c = min(choices, key=lambda x: (abs(x["ts"]-p["ts"]), x["ts"]))
            used.append(c["ts"])
            matched.append((p, c))
    return matched, len(signals)


def block_ci(pairs, bars, minutes, repeats=1000):
    weekly = defaultdict(list)
    for p, c in pairs:
        first, second = outcome(bars, p, minutes), outcome(bars, c, minutes)
        if first != "missing" and second != "missing":
            weekly[p["ts"]//(7*DAY)].append((int(first == "up"), int(second == "up")))
    if len(weekly) < 8:
        return None
    groups, rng, deltas = list(weekly.values()), random.Random(73), []
    for _ in range(repeats):
        drawn = [x for _ in groups for x in rng.choice(groups)]
        deltas.append(sum(a-b for a, b in drawn)/len(drawn))
    deltas.sort()
    return [round(deltas[int(.025*repeats)]*100, 2),
            round(deltas[int(.975*repeats)]*100, 2)]


def trade(bars, signal, minutes):
    i, atr = signal["i"], signal["atr"]
    price = bars[i][4]-.25*atr
    if price <= 0:
        return None
    end = i+48*60//minutes
    latest = i+12*60//minutes
    step = minutes*60
    for j in range(i+1, min(latest, end)+1):
        if bars[j][0]-bars[j-1][0] != step:
            return None
        if bars[j][1] < price:
            return None  # resting buy opened below limit: maker status unverifiable; cancel
        if bars[j][3] <= price:
            stop, target = price-atr, price+1.5*atr
            for k in range(j, end+1):
                if k > j and bars[k][0]-bars[k-1][0] != step:
                    return None
                if bars[k][3] <= stop:
                    exit_price = min(stop, bars[k][1]) if k > j else stop
                    reason = "stop"
                    break
                if k > j and bars[k][2] >= target:
                    # A target in the fill candle may predate the entry: never claim it.
                    exit_price, reason = target, "target"
                    break
            else:
                exit_price, reason = bars[end][4], "timeout"
            net = exit_price*(1-SLIP)*(1-TAKER)/(price*(1+MAKER))-1
            return {"ts": signal["ts"], "net": net, "reason": reason}
    return None


def economics(signals, bars, minutes, start, end):
    relevant = [s for s in signals if start <= s["ts"] < end]
    balance, peak, worst, executed = 1., 1., 0., []
    for signal in relevant:
        fill = trade(bars, signal, minutes)
        if fill is None:
            continue
        balance *= 1+fill["net"]
        peak = max(peak, balance)
        worst = min(worst, balance/peak-1)
        executed.append(fill)
    first = next((b[4] for b in bars if b[0] >= start), None)
    last = next((b[4] for b in reversed(bars) if b[0] < end), None)
    hodl = last/first/(1+MAKER)-1 if first and last else None
    return {"signals": len(relevant), "fills": len(executed),
            "net_expectancy_pct": round(100*statistics.mean(x["net"] for x in executed), 3)
                                  if executed else None,
            "strategy_net_pct": round(100*(balance-1), 3),
            "worst_realized_drawdown_pct": round(100*worst, 3),
            "hodl_mark_to_market_pct": round(100*hodl, 3) if hodl is not None else None}


def run(bars, minutes):
    features = build_features(bars, minutes)
    plateaux = select_plateaux(features, minutes)
    fold_start = bars[0][0]+365*DAY
    results = []
    while fold_start+90*DAY <= bars[-1][0]:
        start, stop = fold_start+EMBARGO, fold_start+90*DAY-EMBARGO
        strata = []
        for post_drop in (False, True):
            matched, detected = pair_controls(
                plateaux, features, start, stop, minutes, post_drop)
            matched = [(p, c) for p, c in matched
                       if outcome(bars, p, minutes) != "missing"
                       and outcome(bars, c, minutes) != "missing"]
            def count(events):
                labels = [outcome(bars, event, minutes) for event in events]
                return {"n": len(events), "up": labels.count("up"),
                        "down": labels.count("down"), "flat": labels.count("flat"),
                        "up_pct": round(100*labels.count("up")/len(events), 2)
                                  if events else None}
            for regime in ("all", "bull", "bear", "sideways"):
                pairs = [(p, c) for p, c in matched
                         if regime == "all" or p["regime"] == regime]
                chosen = [p for p, _ in pairs]
                controls = [c for _, c in pairs]
                subset = [p for p in chosen if p["score"] >= 3]
                candidates = [p for p in plateaux
                              if (p["post_drop"] or not post_drop)
                              and (regime == "all" or p["regime"] == regime)]
                strata.append({
                    "post_drop": post_drop, "regime": regime,
                    "plateaux_detected": detected if regime == "all" else
                        sum(1 for p in plateaux if start <= p["ts"] < stop
                            and (p["post_drop"] or not post_drop)
                            and p["regime"] == regime),
                    "matched_plateaux": count(chosen),
                    "matched_reference": count(controls),
                    "score3": count(subset),
                    "delta_up_ci95_points": block_ci(pairs, bars, minutes),
                    "economics": economics(candidates, bars, minutes, start, stop),
                })
        results.append({
            "train_end_utc": datetime.fromtimestamp(fold_start-EMBARGO, timezone.utc).isoformat(),
            "test_start_utc": datetime.fromtimestamp(start, timezone.utc).isoformat(),
            "test_end_utc": datetime.fromtimestamp(stop, timezone.utc).isoformat(),
            "strata": strata,
        })
        fold_start += 90*DAY
    return results


def render_markdown(result):
    lines = [
        "# Kraken Paper — backtest Kraken spot hors-échantillon",
        "",
        "Exécution sur les archives déclarées ci-dessous. Aucun ordre réel.",
        "",
        "Plateau : compression range (35e percentile), ATR (50e), pente <=2 ATR.",
        "Rebond : +1,5 ATR avant -1 ATR sous 48 h ; ambiguïtés = échec.",
        "Sous-hypothèse : baisse de 2 % dans les 96 h précédant le plateau.",
        "Appariement régime 30 jours et volatilité ; fenêtres 90 jours purgées 48 h.",
        "Entrée limite maker 0,4 %, sortie taker 0,8 % + 0,1 % glissement.",
        "",
        "| Instrument | Fenêtre test | Hypothèse | Régime | N apparié | Plateau ↑ % | Référence ↑ % | IC95 écart pts | Fills | Espérance nette % | DD réalisé % | Stratégie % | HODL % |",
        "|---|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|",
    ]
    def fmt(value):
        return "n/d" if value is None else str(value)
    for section in result["assets"].values():
        for fold in section["folds"]:
            for row in fold["strata"]:
                p, c, e = row["matched_plateaux"], row["matched_reference"], row["economics"]
                ci = row["delta_up_ci95_points"]
                fields = [
                    section["instrument"] + " " + str(section["timeframe_min"]) + "m",
                    fold["test_start_utc"][:10] + " / " + fold["test_end_utc"][:10],
                    "post -2 %" if row["post_drop"] else "plateau",
                    row["regime"], str(p["n"]), fmt(p["up_pct"]), fmt(c["up_pct"]),
                    f"[{ci[0]}; {ci[1]}]" if ci else "n/d (<8 semaines)",
                    str(e["fills"]), fmt(e["net_expectancy_pct"]),
                    fmt(e["worst_realized_drawdown_pct"]),
                    fmt(e["strategy_net_pct"]), fmt(e["hodl_mark_to_market_pct"]),
                ]
                lines.append("| " + " | ".join(fields) + " |")
    lines.extend(["", "## Sources et empreintes", ""])
    for section in result["assets"].values():
        lines.append(f"- {section['instrument']} {section['timeframe_min']}m : "
                     f"{section['bars']} bougies, {section['first_utc']} à {section['last_utc']}, "
                     f"couverture {section['coverage']:.1%}; API {section['api_extension']['status']}.")
        for src in section["sources"]:
            lines.append("- " + src["archive"] + "/" + src["entry"]
                         + " SHA256 archive " + src["archive_sha256"]
                         + " CSV " + src["csv_sha256"])
    lines.extend(["", "## Conclusion", "",
                  "**À creuser.** Ces résultats ne démontrent pas une rentabilité générale : "
                  "pas de carnet ni de simulation de file maker, données corrélées, "
                  "incertitude et frais importants. La comparaison des marqueurs reste exploratoire. "
                  "Le drawdown ne porte que sur les trades clôturés, pas les pertes latentes. "
                  "Aucune intégration sans ADR, accord Grok Bot et validation de Cyril.", ""])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Backtest spot Kraken OHLCVT (research only)")
    parser.add_argument("--archives", nargs="+", type=Path, required=True)
    parser.add_argument("--api-recent", action="store_true",
                        help="Append only gap-free, closed public Kraken candles")
    parser.add_argument("--output", type=Path, default=Path("research-output.json"))
    args = parser.parse_args()
    archives = []
    for item in args.archives:
        archives.extend(sorted(item.rglob("*.zip")) + sorted(item.rglob("*.csv"))
                        if item.is_dir() else [item])
    if not archives:
        parser.error("No Kraken archive files")
    result = {
        "status": "completed_on_supplied_archives",
        "parameters": {"outcome": "+1.5 ATR before -1 ATR in 48h",
                       "entry_maker_fee": MAKER, "exit_taker_fee": TAKER,
                       "exit_slippage": SLIP, "post_drop": -.02},
        "assets": {},
    }
    for asset in ASSETS:
        for minutes in (60, 240):
            quote, bars, coverage, provenance = gather(archives, asset, minutes)
            api = {"status": "not_requested"}
            if args.api_recent:
                bars, api = extend_api(bars, asset, quote, minutes)
            result["assets"][f"{asset}_{minutes}"] = {
                "instrument": f"{asset}/{quote}", "timeframe_min": minutes,
                "bars": len(bars), "coverage": round(coverage, 5),
                "first_utc": datetime.fromtimestamp(bars[0][0], timezone.utc).isoformat(),
                "last_utc": datetime.fromtimestamp(bars[-1][0], timezone.utc).isoformat(),
                "sources": provenance, "api_extension": api, "folds": run(bars, minutes),
            }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output.with_suffix(".md").write_text(render_markdown(result), encoding="utf-8")
    print("Completed:", args.output, args.output.with_suffix(".md"))


if __name__ == "__main__":
    main()
