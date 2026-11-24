#!/usr/bin/env python3
"""Kraken Paper - moteur de simulation (PAPER uniquement).

- N'utilise QUE l'API publique Kraken (https://api.kraken.com/0/public/...).
- Aucune cle, aucun endpoint prive, aucun ordre reel.
- Stdlib uniquement.

Usage : python engine/run.py
"""
import copy
import glob
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

try:
    from zoneinfo import ZoneInfo
    PARIS = ZoneInfo("Europe/Paris")
except Exception:  # pragma: no cover - tzdata absent
    PARIS = timezone.utc

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE_DIR = os.path.join(ROOT, "state")
DECISIONS_DIR = os.path.join(ROOT, "decisions")
PORTFOLIO = os.path.join(STATE_DIR, "portfolio.json")
JOURNAL = os.path.join(STATE_DIR, "journal.jsonl")
EQUITY = os.path.join(STATE_DIR, "equity.csv")
EQUITY_HEADER = "time,equity_usdc,cash_usdc,positions_usdc,btc_price,btc_hold_usdc,engine_version\n"

API = "https://api.kraken.com/0/public/"
QUOTE = "USDC"
BENCH = "XBTUSDC"
START_CAPITAL = 6606.42
ENGINE_VERSION = "0.2.2"
LIMIT_PENETRATION = 0.0005  # hypothese PAPER, pas une regle Kraken
FEE_TIERS = ((0,.004,.008),(2500,.003,.006),(10000,.0022,.0038),(25000,.002,.0035),
             (50000,.0015,.003),(100000,.0012,.0025),(250000,.001,.0022),
             (500000,.0008,.002),(1000000,.0006,.0018),(2500000,.0004,.0015),
             (5000000,.0002,.0012),(10000000,0,.001),(50000000,0,.0009),
             (100000000,0,.0008),(250000000,0,.0007),(400000000,0,.0006),
             (500000000,0,.0005))
MAKER = 0.0040   # Kraken Pro palier 1
TAKER = 0.0080
SLIP = 0.001     # 0,1 % de glissement (stops et ordres au marche)
HOUR = 3600
MIN5 = 300          # datation des fills : première bougie 5 min qui touche le niveau
RETENTION_5M = 60 * HOUR  # environ 720 bougies de 5 minutes
EPS = 1e-9


class APIError(Exception):
    """Erreur reseau ou API Kraken : on saute l'etape, on ne casse rien."""


class Rejected(Exception):
    """Action refusee (fonds insuffisants, paire inconnue, ...)."""


# --------------------------------------------------------------------------
# Utilitaires
# --------------------------------------------------------------------------
def iso(ts):
    return datetime.fromtimestamp(ts, PARIS).isoformat(timespec="seconds")


def floor_dec(x, d):
    q = 10 ** d
    return math.floor(x * q + 1e-7) / q


def money(x):
    return round(x, 6)


def fr(x, d=None):
    """Nombre au format francais : 65 000 ; 0,0072."""
    if d is None:
        d = 0 if abs(x) >= 1000 else (2 if abs(x) >= 1 else 6)
    s = f"{x:,.{d}f}".replace(",", " ").replace(".", ",")
    if "," in s:
        s = s.rstrip("0").rstrip(",")
    return s


def hour_floor(ts):
    return int(ts) // HOUR * HOUR


def hour_ceil(ts):
    return -(-int(ts) // HOUR) * HOUR


def next_5m(ts):
    return (int(ts) // MIN5 + 1) * MIN5


def next_hour(ts):
    """Début de la bougie 1 h strictement suivante (même si ts tombe pile sur une heure)."""
    return hour_floor(ts) + HOUR


# --------------------------------------------------------------------------
# Acces marche (API publique uniquement)
# --------------------------------------------------------------------------
class Market:
    def _get(self, method, **params):
        url = API + method + ("?" + urllib.parse.urlencode(params) if params else "")
        last = None
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "kraken-paper/1.0"})
                with urllib.request.urlopen(req, timeout=20) as r:
                    data = json.loads(r.read().decode("utf-8"))
                if data.get("error"):
                    raise APIError(f"{method}: {data['error']}")
                return data["result"]
            except APIError:
                raise
            except (urllib.error.URLError, OSError, ValueError, KeyError) as e:
                last = e
                time.sleep(2 * (attempt + 1))
        raise APIError(f"{method}: {last}")

    def asset_pairs(self):
        return self._get("AssetPairs", country_code="FR")

    def ohlc(self, pair, since, interval=60):
        res = self._get("OHLC", pair=pair, interval=int(interval), since=int(since))
        rows = next(v for k, v in res.items() if k != "last")
        return [tuple([int(c[0]), float(c[1]), float(c[2]), float(c[3]), float(c[4])] +
                      ([float(c[6])] if int(interval) == 5 and len(c) > 6 else [])) for c in rows]

    def ticker(self, pairs):
        res = self._get("Ticker", pair=",".join(pairs))
        return {k: float(v["c"][0]) for k, v in res.items()}


def pair_meta_from_assetpairs(ap, name):
    """Trouve une paire USDC, en ligne, disponible en France."""
    n = name.upper().replace("/", "").replace("-", "")
    if n.startswith("BTC"):
        n = "XBT" + n[3:]
    for key, v in ap.items():
        ws = (v.get("wsname") or "").replace("/", "").upper()
        ws = "XBT" + ws[3:] if ws.startswith("BTC") else ws
        if n in (key.upper(), v.get("altname", "").upper(), ws):
            if v.get("quote") != QUOTE and not v.get("altname", "").endswith(QUOTE):
                raise Rejected(f"{name} : seules les paires cotees en USDC sont autorisees")
            if v.get("status", "online") != "online":
                raise Rejected(f"{name} : paire pas en ligne ({v.get('status')})")
            base = (v.get("wsname") or v["altname"]).split("/")[0]
            return {
                "key": key,
                "altname": v["altname"],
                "wsname": v.get("wsname"),
                "base": "BTC" if base == "XBT" else base,
                "lot_decimals": int(v["lot_decimals"]),
                "pair_decimals": int(v["pair_decimals"]),
                "ordermin": float(v.get("ordermin") or 0),
                "costmin": float(v.get("costmin") or 0),
            }
    raise Rejected(f"{name} : paire inconnue ou non disponible en France (USDC uniquement)")


# --------------------------------------------------------------------------
# Etat
# --------------------------------------------------------------------------
def new_state(now):
    return {
        "version": 1,
        "engine_version": ENGINE_VERSION,
        "last_m5": {},
        "mode": "PAPER",
        "quote": QUOTE,
        "start_capital": START_CAPITAL,
        "start_time": iso(now),
        "start_ts": int(now),
        "cash": START_CAPITAL,
        "positions": {},
        "open_orders": [],
        "closed_trades": [],
        "processed_decisions": [],
        "last_decision": None,
        "pairs": {},
        "last_candle": {},
        "last_prices": {},
        "price_move_watch": {},
        "benchmark": {"pair": BENCH, "btc_qty": None, "start_price": None},
        "fees_total": 0.0,
        "realized_pnl": 0.0,
        "seq": {"order": 0, "trade": 0},
        "last_cycle": None,
        "last_cycle_ts": None,
        "last_cycle_errors": [],
        "fees": {"maker": MAKER, "taker": TAKER, "slippage": SLIP},
    }


def compartment_of(obj, default="medium"):
    """Retourne le compartiment d'un ordre, d'une action ou d'une position."""
    if not obj:
        return default
    c = obj.get("compartment")
    return c if c in ("medium", "short") else default


def ensure_by_compartment(pos):
    """Ajoute by_compartment si absent. Idempotent. Conserve l'agrégat."""
    if not pos or "qty" not in pos:
        return pos
    if "by_compartment" not in pos:
        pos["by_compartment"] = {
            "medium": {
                "qty": pos.get("qty", 0.0),
                "avg_cost": pos.get("avg_cost", 0.0),
                "fees_paid": pos.get("fees_paid", 0.0),
            }
        }
    return pos


def migrate_state(state):
    """Migration additive 0.2.2. Idempotente. Un moteur 0.2.1 ignore by_compartment.
    Si l'agrégat et by_compartment divergent, l'agrégat fait foi.
    Écart positif : ajouté en medium, PRU medium recalculé depuis l'agrégat.
    Écart négatif : retiré d'abord de medium, puis de short.
    Les warnings sont retournés pour être émis comme événements de cycle."""
    warnings = []
    for pair, pos in list(state.get("positions", {}).items()):
        if not isinstance(pos, dict):
            continue
        ensure_by_compartment(pos)
        bc = pos.get("by_compartment", {})
        total = sum(float(c.get("qty", 0)) for c in bc.values())
        agg = float(pos.get("qty", 0))
        if abs(total - agg) > EPS:
            delta = agg - total
            if delta > 0:
                medium = bc.setdefault("medium", {"qty": 0.0, "avg_cost": 0.0, "fees_paid": 0.0})
                old_qty = medium.get("qty", 0.0)
                medium["qty"] = round(old_qty + delta, 8)
                # Recalcule le PRU medium pour que le coût total reste cohérent avec l'agrégat
                if medium["qty"] > EPS:
                    remaining_cost = agg * pos.get("avg_cost", 0.0) - sum(
                        c.get("qty", 0) * c.get("avg_cost", 0)
                        for name, c in bc.items() if name != "medium" and c.get("qty", 0) > EPS)
                    medium["avg_cost"] = remaining_cost / medium["qty"] if medium["qty"] > EPS else 0.0
            else:
                # Écart négatif : retire d'abord de medium, puis de short
                to_remove = -delta
                for cname in ("medium", "short"):
                    if to_remove <= EPS:
                        break
                    c = bc.get(cname)
                    if not c or c.get("qty", 0) <= EPS:
                        continue
                    take = min(c["qty"], to_remove)
                    c["qty"] = round(c["qty"] - take, 8)
                    to_remove -= take
                    if c["qty"] <= EPS:
                        bc.pop(cname, None)
            warnings.append({"type": "compartment_resync", "pair": pair,
                             "aggregate": agg, "sum_compartments": total, "delta": delta})
        # Nettoie les compartiments vides
        for cname in list(bc.keys()):
            if bc[cname].get("qty", 0) <= EPS:
                bc.pop(cname, None)
    for o in state.get("open_orders", []):
        if "compartment" not in o:
            o["compartment"] = "medium"
    for tr in state.get("closed_trades", []):
        if "compartment" not in tr:
            tr["compartment"] = "medium"
    return warnings


def available_cash(state):
    reserved = sum(o["qty"] * o["price"] * (1 + MAKER)
                   for o in state["open_orders"] if o["side"] == "buy")
    return state["cash"] - reserved


def available_qty(state, pair, compartment=None):
    """Quantité libre. Sans compartment : total de la paire. Avec : du compartiment."""
    pos = state["positions"].get(pair, {})
    if compartment:
        ensure_by_compartment(pos)
        held = pos.get("by_compartment", {}).get(compartment, {}).get("qty", 0.0)
        reserved = sum(o["qty"] for o in state["open_orders"]
                       if o["side"] == "sell" and o["pair"] == pair
                       and compartment_of(o) == compartment)
        return held - reserved
    held = pos.get("qty", 0.0)
    reserved = sum(o["qty"] for o in state["open_orders"]
                   if o["side"] == "sell" and o["pair"] == pair)
    return held - reserved


def next_id(state, kind):
    state["seq"][kind] += 1
    return ("O" if kind == "order" else "T") + f"{state['seq'][kind]:04d}"


def fee_rates(state, ts):
    """Palier spot PAPER suivant le volume des fills des 30 jours precedents."""
    volume = sum(float(tr["qty"]) * float(tr["price"])
                 for tr in state.get("closed_trades", [])
                 if 0 <= ts - float(tr.get("ts", -1e20)) < 30 * 86400)
    tier = FEE_TIERS[0]
    for item in FEE_TIERS:
        if volume >= item[0]:
            tier = item
    return tier[1], tier[2], volume


def stop_execution(stop, opening, high, low, qty, volume, decimals):
    """Estimation PAPER : 0.10% min + volatilite + participation au volume 5min.
    Amplitude : 5% du range relatif au-dela de 1%.
    Impact volume : 0.10% * min(1, qty/(1% du volume 5min)).
    Le carnet d'ordres historique n'est pas connu; plafond 2%.
    """
    amplitude = max(0., high - low) / max(opening or stop, 1e-12)
    impact = .001 * min(1., qty / max(volume * .01, 1e-12)) if volume else 0.
    slip = min(.02, .001 + .05 * max(0., amplitude - .01) + impact)
    return round(min(stop, opening if opening is not None else stop) * (1 - slip),
                 decimals), slip


# --------------------------------------------------------------------------
# Execution
# --------------------------------------------------------------------------
def execute_fill(state, pair, side, qty, price, liquidity, reason, ts, order_id=None, compartment="medium"):
    meta = state["pairs"][pair]
    maker_rate, taker_rate, volume_30d = fee_rates(state, ts)
    rate = maker_rate if liquidity == "maker" else taker_rate
    gross = qty * price
    fee = money(gross * rate)
    is_new = pair not in state["positions"]
    if is_new and side == "sell":
        raise Rejected(f"aucune position {pair} à vendre")
    pos = state["positions"].setdefault(pair, {"base": meta["base"], "qty": 0.0,
                                                "avg_cost": 0.0, "fees_paid": 0.0})
    if is_new:
        pos["by_compartment"] = {}
    else:
        ensure_by_compartment(pos)
    bc = pos["by_compartment"]
    if side == "sell":
        existing = bc.get(compartment, {}).get("qty", 0.0)
        if qty > existing + EPS:
            raise Rejected(f"quantite insuffisante dans le compartiment {compartment} "
                           f"({existing} {meta['base']})")
        if qty > pos["qty"] + EPS:
            raise Rejected(f"quantite insuffisante ({pos['qty']} {meta['base']})")
    comp = bc.setdefault(compartment, {"qty": 0.0, "avg_cost": 0.0, "fees_paid": 0.0})
    pnl = None
    if side == "buy":
        cost = gross + fee
        if cost > state["cash"] + EPS:
            raise Rejected(f"cash insuffisant ({fr(state['cash'], 2)} USDC) pour {fr(cost, 2)} USDC")
        new_qty = pos["qty"] + qty
        pos["avg_cost"] = (pos["qty"] * pos["avg_cost"] + cost) / new_qty if new_qty > EPS else 0.0
        pos["qty"] = round(new_qty, meta["lot_decimals"])
        new_c = comp["qty"] + qty
        comp["avg_cost"] = (comp["qty"] * comp["avg_cost"] + cost) / new_c if new_c > EPS else 0.0
        comp["qty"] = round(new_c, meta["lot_decimals"])
        state["cash"] = money(state["cash"] - cost)
    else:
        proceeds = gross - fee
        pnl = money(proceeds - qty * comp["avg_cost"])
        pos["qty"] = round(pos["qty"] - qty, meta["lot_decimals"])
        comp["qty"] = round(comp["qty"] - qty, meta["lot_decimals"])
        state["cash"] = money(state["cash"] + proceeds)
        state["realized_pnl"] = money(state["realized_pnl"] + pnl)
        if pos["qty"] > EPS:
            remaining_cost = sum(c["qty"] * c["avg_cost"] for c in bc.values() if c["qty"] > EPS)
            pos["avg_cost"] = remaining_cost / pos["qty"]
    pos["fees_paid"] = money(pos["fees_paid"] + fee)
    comp["fees_paid"] = money(comp["fees_paid"] + fee)
    state["fees_total"] = money(state["fees_total"] + fee)
    if pos["qty"] <= EPS:
        del state["positions"][pair]
    elif comp["qty"] <= EPS:
        bc.pop(compartment, None)
    trade = {
        "id": next_id(state, "trade"), "order_id": order_id, "pair": pair,
        "base": meta["base"], "side": side, "qty": qty, "price": price,
        "fee": fee, "fee_rate": rate, "volume_30d_usd": round(volume_30d, 2),
        "engine_version": ENGINE_VERSION, "liquidity": liquidity, "reason": reason,
        "time": iso(ts), "ts": int(ts), "realized_pnl": pnl,
        "compartment": compartment,
    }
    state["closed_trades"].append(trade)
    mk, tk, _ = fee_rates(state, ts)
    state["fees"] = {"maker": mk, "taker": tk, "slippage": SLIP}
    return trade


def normalize_take_profits(meta, action, entry_price, qty):
    """Valide les objectifs, alloue les lots et conserve la compatibilité take_profit."""
    if action.get("take_profits") is not None and action.get("take_profit") is not None:
        raise Rejected("take_profit et take_profits sont mutuellement exclusifs")
    raw = action.get("take_profits")
    if raw is None:
        raw = ([{"price": action["take_profit"], "fraction": 1.0}]
               if action.get("take_profit") is not None else [])
    if not isinstance(raw, list):
        raise Rejected("take_profits doit etre une liste")
    if not raw:
        return []
    try:
        fractions = [float(x["fraction"]) for x in raw]
        prices = [round(float(x["price"]), meta["pair_decimals"]) for x in raw]
    except (KeyError, ValueError, TypeError, OverflowError):
        raise Rejected("palier invalide : price et fraction requis")
    if (not all(math.isfinite(v) and v > 0 for v in fractions + prices)
            or abs(sum(fractions) - 1) > 1e-9):
        raise Rejected("fractions des paliers : valeurs positives, somme egale a 1")
    if any(prices[i] <= prices[i - 1] for i in range(1, len(prices))):
        raise Rejected("prix des paliers strictement croissants requis")
    if action.get("take_profits") is not None and any(p <= entry_price for p in prices):
        raise Rejected("chaque TP doit etre au-dessus du prix d'entree")
    remaining = qty
    result = []
    for i, (price, fraction) in enumerate(zip(prices, fractions)):
        part = remaining if i == len(prices) - 1 else floor_dec(qty * fraction, meta["lot_decimals"])
        if part <= 0 or part + EPS < meta["ordermin"] or part * price + EPS < meta["costmin"]:
            raise Rejected("palier sous le minimum Kraken")
        result.append({"price": price, "fraction": fraction, "qty": part})
        remaining = round(remaining - part, meta["lot_decimals"])
    return result


def attach_exit(state, pair, qty, stop_loss, take_profit, ts, parent,
                take_profits=None, breakeven_after_tp1=False, entry_price=None,
                compartment="medium", block_tp=True):
    if not stop_loss and not take_profit and not take_profits:
        return None
    meta = state["pairs"][pair]
    pos = state["positions"].get(pair, {})
    bc = pos.get("by_compartment", {}).get(compartment, {})
    entry = entry_price if entry_price is not None else (bc.get("avg_cost") or pos.get("avg_cost", 0))
    levels = (take_profits if take_profits is not None else
              normalize_take_profits(meta, {"take_profit": take_profit}, entry, qty))
    o = {"id": next_id(state, "order"), "pair": pair, "side": "sell", "qty": qty,
         "price": levels[0]["price"] if levels else None,
         "stop_loss": stop_loss, "take_profit": None,
         "created": iso(ts), "active_from": next_5m(ts), "parent": parent,
         "decision_id": None, "compartment": compartment}
    if levels:
        o["take_profits"] = levels
        o["entry_price"] = entry
        o["breakeven_after_tp1"] = bool(breakeven_after_tp1)
        o["tp_filled"] = 0
    if block_tp:
        o["tp_blocked_until"] = next_5m(ts)
    state["open_orders"].append(o)
    return o

def audit_buy_protection(state, pair, trade):
    comp = trade.get("compartment", "medium")
    pos = state["positions"].get(pair, {})
    held = pos.get("by_compartment", {}).get(comp, {}).get("qty", 0)
    covered = sum(o["qty"] for o in state["open_orders"]
                  if o["pair"] == pair and o["side"] == "sell" and o.get("stop_loss")
                  and compartment_of(o) == comp)
    if covered + EPS < held:
        trade["unprotected_qty"] = {"held": held, "covered": covered,
                                    "qty": held - covered, "compartment": comp}


def merge_purchase_exits(state, pair, qty, ts, parent, stop_loss=None,
                         take_profit=None, take_profits=None,
                         breakeven_after_tp1=False, trade=None, compartment="medium"):
    """Integre un achat dans le bracket du même compartiment uniquement.

    Un achat short ne fusionne jamais dans un groupe medium. Les niveaux
    existants du compartiment font autorité.
    """
    meta = state["pairs"][pair]
    exits = [o for o in state["open_orders"]
             if o["pair"] == pair and o["side"] == "sell" and o.get("parent")
             and compartment_of(o) == compartment]
    if not exits:
        pos = state["positions"].get(pair, {})
        bc = pos.get("by_compartment", {}).get(compartment, {})
        entry = bc.get("avg_cost") or pos.get("avg_cost")
        return attach_exit(state, pair, qty, stop_loss, take_profit, ts, parent,
                           take_profits=take_profits,
                           breakeven_after_tp1=breakeven_after_tp1,
                           entry_price=entry, compartment=compartment)
    def fallback(reason):
        if trade is not None:
            trade["exit_merge_skipped"] = {"reason": reason, "qty": qty, "compartment": compartment}
        free = max(0.0, available_qty(state, pair, compartment))
        safe_qty = floor_dec(min(qty, free), meta["lot_decimals"])
        stops = [o["stop_loss"] for o in exits if o.get("stop_loss")]
        stop = stop_loss or (min(stops) if stops else None)
        if safe_qty <= EPS or safe_qty + EPS < meta["ordermin"] or not stop:
            return None
        return attach_exit(state, pair, safe_qty, stop, None, ts, parent,
                           compartment=compartment)

    if len(exits) != 1:
        return fallback("multiple_groups")
    old = exits[0]
    free = max(0.0, available_qty(state, pair, compartment))
    if free + EPS < qty:
        return fallback("reservation_conflict")
    addition = round(qty, meta["lot_decimals"])
    total = round(old["qty"] + addition, meta["lot_decimals"])
    if "take_profits" in old:
        remaining = old["take_profits"]
        target = round(total, meta["lot_decimals"])
        if remaining:
            previous = sum(tier["qty"] for tier in remaining)
            if previous <= EPS:
                return fallback("tier_below_min")
            revised = [dict(tier) for tier in remaining]
            for tier in revised[:-1]:
                tier["qty"] = floor_dec(target * tier["qty"] / previous, meta["lot_decimals"])
            revised[-1]["qty"] = round(target - sum(t["qty"] for t in revised[:-1]),
                                        meta["lot_decimals"])
            for tier in revised:
                if (tier["qty"] + EPS < meta["ordermin"]
                        or tier["qty"] * tier["price"] + EPS < meta["costmin"]):
                    return fallback("tier_below_min")
            old["take_profits"] = revised
        # PRU du compartiment pour le point mort
        pos = state["positions"].get(pair, {})
        bc = pos.get("by_compartment", {}).get(compartment, {})
        old["entry_price"] = bc.get("avg_cost") or pos.get("avg_cost")
    if old.get("pending_exits"):
        pos = state["positions"].get(pair, {})
        bc = pos.get("by_compartment", {}).get(compartment, {})
        old["pending_exits"]["entry_price"] = bc.get("avg_cost") or pos.get("avg_cost")
    old["qty"] = total
    old["tp_blocked_until"] = next_5m(ts)
    return old


def _m5_bars(market, pair, hour_start):
    """Bougies 5 min de l'heure [hour_start, hour_start+HOUR), ou None si indisponibles / incomplètes.

    Kraken ne conserve qu'environ 720 bougies 5 min (~60 h) : au-delà, on se rabat sur la bougie 1 h.
    """
    if market is None:
        return None
    try:
        rows = market.ohlc(pair, hour_start - 1, interval=5)
    except APIError:
        return None
    bars = [c for c in rows if hour_start <= c[0] < hour_start + HOUR]
    expected = {hour_start + i * MIN5 for i in range(12)}
    if {c[0] for c in bars} < expected:
        return None
    return sorted(bars, key=lambda c: c[0])


def first_touch_ts(bars5, level, which):
    """Ouverture de la première bougie 5 min qui touche le niveau ('below' : low <=, 'above' : high >=)."""
    if level is None or not bars5:
        return None
    for bar in bars5:
        t, _o, high, low, _c = bar[:5]
        if which == "below" and low <= level + EPS:
            return t
        if which == "above" and high >= level - EPS:
            return t
    return None


def process_candle(state, pair, candle, rejects=None, market=None, m5_override=None):
    """Rejoue une bougie 5 min ou le repli 1 h cloture."""
    t, o_, high, low, close = candle[:5]
    fills = []
    m5 = m5_override if m5_override is not None else _m5_bars(market, pair, t)
    # Conserver les anciennes sorties jusqu'au créneau d'activation.
    for old in list(state["open_orders"]):
        pending = old.get("pending_exits")
        if not pending or old["pair"] != pair or t < pending["active_from"]:
            continue
        comp = pending.get("compartment") or compartment_of(old)
        pos = state["positions"].get(pair, {})
        bc = pos.get("by_compartment", {}).get(comp, {})
        remaining = min(old["qty"], bc.get("qty", 0))
        if remaining <= EPS:
            state["open_orders"].remove(old)
            continue
        try:
            levels = normalize_take_profits(state["pairs"][pair], pending["action"],
                                             pending["entry_price"], remaining)
        except Rejected as exc:
            old.pop("pending_exits", None)
            if rejects is not None:
                rejects.append({"type": "note", "pair": pair, "order_id": old["id"],
                                "text": f"update_exits non active : {exc} ; anciennes sorties conservees"})
            continue
        state["open_orders"].remove(old)
        new = attach_exit(state, pair, remaining, pending["stop_loss"], None,
                          pending["active_from"], pending["parent"],
                          take_profits=levels,
                          breakeven_after_tp1=pending["breakeven_after_tp1"],
                          entry_price=pending["entry_price"], compartment=comp,
                          block_tp=False)
        if new:
            new["active_from"] = pending["active_from"]
            new["tp_filled"] = old.get("tp_filled", 0)
    # Achats d'abord, pour que le blocage TP de la même bougie soit pris en compte
    buys = [o for o in state["open_orders"] if o["pair"] == pair and o["side"] == "buy"
            and o["active_from"] <= t]
    sells = [o for o in state["open_orders"] if o["pair"] == pair and o["side"] == "sell"
             and o["active_from"] <= t]
    for order in buys + sells:
        if order not in state["open_orders"]:
            continue
        try:
            _check_order(state, pair, order, t, high, low, fills, m5, o_)
        except Rejected as e:
            state["open_orders"].remove(order)
            if rejects is not None:
                rejects.append({"type": "cancel", "order_id": order["id"], "pair": pair,
                                "reason": f"annule par le moteur : {e}"})
    rearmed = rearm_deferred_breakeven(state, pair, close)
    if rejects is not None:
        rejects.extend(rearmed)
    state["last_prices"][pair] = close
    if m5_override is not None:
        state.setdefault("last_m5", {})[pair] = t
    else:
        state["last_candle"][pair] = t
    return fills


def _date_fill(m5, level, which, hour_start):
    """Horodatage du fill : ouverture de la 1re bougie 5 min qui touche, sinon ouverture de l'heure."""
    if m5:
        ts = first_touch_ts(m5, level, which)
        if ts is not None:
            return ts, "m5"
    return hour_start, "hour_open"


def _check_order(state, pair, order, t, high, low, fills, m5=None, hour_open=None):
    comp = compartment_of(order)
    if order["side"] == "buy":
        if low < order["price"] * (1 - LIMIT_PENETRATION):
            ts, source = _date_fill(m5, order["price"] * (1 - LIMIT_PENETRATION), "below", t)
            tr = execute_fill(state, pair, "buy", order["qty"], order["price"],
                              "maker", "limit", ts, order["id"], compartment=comp)
            tr["time_source"] = source
            state["open_orders"].remove(order)
            fills.append(tr)
            previous = [o for o in state["open_orders"] if o["pair"] == pair
                        and o["side"] == "sell" and o.get("parent")
                        and compartment_of(o) == comp]
            old_id = previous[0]["id"] if len(previous) == 1 else None
            previous_qty = previous[0]["qty"] if old_id else None
            merged = merge_purchase_exits(state, pair, order["qty"], ts, order["id"],
                                          stop_loss=order.get("stop_loss"),
                                          take_profit=order.get("take_profit"),
                                          take_profits=order.get("take_profits"),
                                          breakeven_after_tp1=order.get("breakeven_after_tp1", False),
                                          trade=tr, compartment=comp)
            if merged and merged["id"] == old_id and merged["qty"] > previous_qty + EPS:
                tr["exit_merge"] = {"order_id": old_id, "previous_qty": previous_qty,
                                    "new_qty": merged["qty"], "added_qty": order["qty"],
                                    "stop_loss": merged.get("stop_loss"),
                                    "ignored_stop_loss": order.get("stop_loss"),
                                    "ignored_take_profits": order.get("take_profits") or order.get("take_profit"),
                                    "new_entry_price": state["positions"].get(pair, {}).get("by_compartment", {}).get(comp, {}).get("avg_cost"),
                                    "compartment": comp}
            audit_buy_protection(state, pair, tr)
        return

    if "take_profits" in order:
        _check_tiered_exit(state, pair, order, t, high, low, fills, m5, hour_open)
        return

    stop = order.get("stop_loss")
    limit = order.get("price")
    stop_1h = bool(stop and low <= stop)
    limit_1h = bool(limit and high > limit * (1 + LIMIT_PENETRATION))
    if not stop_1h and not limit_1h:
        return

    # Avec des bougies 5 min complètes : le premier niveau touché gagne ;
    # stop et objectif dans la même bougie 5 min → le stop gagne (cas prudent).
    # Sans données 5 min : on garde la règle 1 h (stop prioritaire) mais on date à l'ouverture.
    reason, level, which, px, liq = None, None, None, None, None
    if m5 is not None:
        stop_ts = first_touch_ts(m5, stop, "below") if stop_1h else None
        limit_ts = first_touch_ts(m5, limit * (1 + LIMIT_PENETRATION), "above") if limit_1h else None
        if stop_ts is not None and (limit_ts is None or stop_ts <= limit_ts):
            reason, level, which, liq = "stop_loss", stop, "below", "taker"
            opening = next((bar[1] for bar in m5 if bar[0] == stop_ts), hour_open)
            bar = next((bar for bar in m5 if bar[0] == stop_ts), None)
            px, slip = stop_execution(stop, opening, bar[2] if bar else high,
                                      bar[3] if bar else low, order["qty"],
                                      bar[5] if bar and len(bar) > 5 else 0,
                                      state["pairs"][pair]["pair_decimals"])
        elif limit_ts is not None:
            reason = "take_profit" if order.get("parent") or stop else "limit"
            level, which, px, liq = limit, "above", limit, "maker"
    if reason is None:
        if stop_1h:
            reason, level, which, liq = "stop_loss", stop, "below", "taker"
            px, slip = stop_execution(stop, hour_open, high, low, order["qty"], 0,
                                      state["pairs"][pair]["pair_decimals"])
        else:
            reason = "take_profit" if order.get("parent") or stop else "limit"
            level, which, px, liq = limit, "above", limit, "maker"

    ts, source = _date_fill(m5, level * (1 + LIMIT_PENETRATION) if which == "above" else level,
                            which, t)
    # TP bloqué dans la même bougie 5 min que l'achat
    if reason in ("take_profit", "limit") and order.get("tp_blocked_until") and ts < order["tp_blocked_until"]:
        return
    tr = execute_fill(state, pair, "sell", order["qty"], px, liq, reason, ts, order["id"],
                      compartment=compartment_of(order))
    if reason == "stop_loss":
        tr["slippage_rate"] = slip
    tr["time_source"] = source
    state["open_orders"].remove(order)
    fills.append(tr)


def breakeven_net(state, pair, pru):
    return round(pru * (1 + state["fees"]["taker"] + 0.002),
                 state["pairs"][pair]["pair_decimals"])


def rearm_deferred_breakeven(state, pair, close):
    events = []
    for order in state["open_orders"]:
        if (order["pair"] != pair or not order.get("breakeven_deferred")
                or order.get("tp_filled", 0) < 1 or order.get("stop_loss") is None):
            continue
        comp = compartment_of(order)
        pos = state["positions"].get(pair, {})
        pru = (pos.get("by_compartment", {}).get(comp, {}).get("avg_cost")
               or order.get("entry_price") or pos.get("avg_cost"))
        if not pru:
            continue
        # Achats en attente du même compartiment seulement
        if any(o["pair"] == pair and o["side"] == "buy" and compartment_of(o) == comp
               and o["price"] < pru for o in state["open_orders"]):
            continue
        net = breakeven_net(state, pair, pru)
        if close < net * 1.005:
            continue
        order["stop_loss"] = max(order["stop_loss"], net)
        order.pop("breakeven_deferred")
        events.append({"type": "breakeven_rearmed", "pair": pair, "compartment": comp,
                       "order_id": order["id"], "stop": order["stop_loss"], "pru": pru})
    return events


def _check_tiered_exit(state, pair, order, hour_start, high, low, fills, m5, hour_open=None):
    """Exécute les niveaux dans l'ordre des 5 min ; stop prioritaire à égalité.
    TP bloqués dans la même bougie 5 min que l'achat d'origine."""
    meta = state["pairs"][pair]
    comp = compartment_of(order)
    bars = m5 if m5 is not None else [(hour_start, hour_open, high, low, None)]
    for bar in bars:
        ts, _opening, bar_high, bar_low, _closing = bar[:5]
        stop = order.get("stop_loss")
        if stop is not None and bar_low <= stop + EPS:
            px, slip = stop_execution(stop, _opening, bar_high, bar_low, order["qty"],
                                       bar[5] if len(bar) > 5 else 0, meta["pair_decimals"])
            tr = execute_fill(state, pair, "sell", order["qty"], px, "taker",
                              "stop_loss", ts, order["id"], compartment=comp)
            tr["time_source"] = "m5" if m5 is not None else "hour_open"
            tr["slippage_rate"] = slip
            fills.append(tr)
            state["open_orders"].remove(order)
            return
        # TP bloqués jusqu'à la bougie suivante après un achat
        if order.get("tp_blocked_until") and ts < order["tp_blocked_until"]:
            continue
        # Dans une meme bougie, plusieurs TP peuvent etre touches.
        while order["take_profits"] and bar_high > order["take_profits"][0]["price"] * (1 + LIMIT_PENETRATION):
            tier = order["take_profits"].pop(0)
            qty = min(tier["qty"], order["qty"])
            tr = execute_fill(state, pair, "sell", qty, tier["price"], "maker",
                              "take_profit", ts, order["id"], compartment=comp)
            tr["time_source"] = "m5" if m5 is not None else "hour_open"
            tr["tp_index"] = order.get("tp_filled", 0) + 1
            fills.append(tr)
            order["qty"] = round(order["qty"] - qty, meta["lot_decimals"])
            order["tp_filled"] = tr["tp_index"]
            if tr["tp_index"] == 1 and order.get("breakeven_after_tp1") and stop is not None:
                pos = state["positions"].get(pair, {})
                pru = (pos.get("by_compartment", {}).get(comp, {}).get("avg_cost")
                       or order.get("entry_price") or pos.get("avg_cost"))
                pending_buys = [o["id"] for o in state["open_orders"]
                                if o["pair"] == pair and o["side"] == "buy"
                                and compartment_of(o) == comp and o["price"] < pru]
                if pending_buys:
                    order["breakeven_deferred"] = {"since": ts, "pru": pru, "order_ids": pending_buys}
                    tr["breakeven_skipped"] = {"reason": "pending_buy_below_pru",
                                               "order_ids": pending_buys,
                                               "pru": pru, "stop_loss": stop, "compartment": comp}
                else:
                    order["stop_loss"] = max(stop, breakeven_net(state, pair, pru))
                    order.pop("breakeven_deferred", None)
            if order["qty"] <= EPS:
                state["open_orders"].remove(order)
                return
            order["price"] = (order["take_profits"][0]["price"]
                              if order["take_profits"] else None)


# --------------------------------------------------------------------------
# Decisions
# --------------------------------------------------------------------------
def load_decisions(directory=DECISIONS_DIR):
    out, warnings = [], []
    for path in sorted(glob.glob(os.path.join(directory, "*.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                d = json.load(f)
            items = d if isinstance(d, list) else [d]
            for it in items:
                if not isinstance(it, dict) or not it.get("id") or not isinstance(it.get("actions"), list):
                    raise ValueError("il faut un objet avec 'id' et 'actions' (liste)")
                # Heartbeat de presence : aucune instruction de trading.
                if it.get("type") == "heartbeat":
                    if it["actions"] or not isinstance(it.get("note"), str) or not it["note"].strip():
                        raise ValueError("heartbeat : actions doit etre [] et note non vide")
                    try:
                        parsed = datetime.fromisoformat(it["timestamp"])
                        if parsed.tzinfo is None or parsed.utcoffset() is None:
                            raise ValueError("fuseau manquant")
                    except (KeyError, TypeError, ValueError) as exc:
                        raise ValueError("heartbeat : timestamp ISO 8601 avec fuseau requis") from exc
                it["_file"] = os.path.basename(path)
                out.append(it)
        except (ValueError, OSError) as e:
            warnings.append(f"decision illisible {os.path.basename(path)} : {e}")
    return out, warnings


def _qty_for(meta, a, price, side, rate):
    if a.get("qty") is not None:
        qty = float(a["qty"])
    elif a.get("quote_amount") is not None:
        q = float(a["quote_amount"])
        qty = q / (price * (1 + rate)) if side == "buy" else q / price
    else:
        raise Rejected("il faut 'qty' ou 'quote_amount'")
    qty = floor_dec(qty, meta["lot_decimals"])
    if qty <= 0 or qty < meta["ordermin"]:
        raise Rejected(f"quantite {qty} sous le minimum {meta['ordermin']} {meta['base']}")
    if qty * price < meta["costmin"]:
        raise Rejected(f"montant sous le minimum {meta['costmin']} USDC")
    return qty


class Ctx:
    """Caches paresseux des appels marche pendant l'application des decisions."""

    def __init__(self, market):
        self.market = market
        self._ap = None

    def meta(self, state, name):
        n = name.upper().replace("/", "")
        for k, m in state["pairs"].items():
            if n in (k, m["altname"], (m.get("wsname") or "").replace("/", ""),
                     m["base"] + QUOTE):
                return m
        if self._ap is None:
            self._ap = self.market.asset_pairs()
        m = pair_meta_from_assetpairs(self._ap, name)
        state["pairs"][m["altname"]] = m
        return m

    def last_price(self, meta):
        res = self.market.ticker([meta["altname"]])
        for k, v in res.items():
            if k in (meta["key"], meta["altname"]) or len(res) == 1:
                return v
        raise APIError("ticker: paire absente")


def apply_action(state, a, ctx, now, decision_id):
    typ = a.get("type")
    if typ == "note":
        return {"type": "note", "text": a.get("text", "")}, []
    if typ == "cancel":
        oid = a.get("order_id") or a.get("id")
        for o in state["open_orders"]:
            if o["id"] == oid:
                state["open_orders"].remove(o)
                return {"type": "cancel", "order_id": oid, "pair": o["pair"]}, []
        raise Rejected(f"ordre {oid} introuvable ou deja execute")
    if typ == "update_exits":
        if not a.get("pair"):
            raise Rejected("il faut 'pair'")
        meta = ctx.meta(state, a["pair"])
        pair = meta["altname"]
        comp = compartment_of(a)
        pos = state["positions"].get(pair)
        if not pos or pos["qty"] <= EPS:
            raise Rejected("aucune position ouverte sur cette paire")
        ensure_by_compartment(pos)
        comp_pos = pos.get("by_compartment", {}).get(comp)
        if not comp_pos or comp_pos.get("qty", 0) <= EPS:
            raise Rejected(f"aucune position {comp} ouverte sur cette paire")
        existing = [o for o in state["open_orders"]
                    if o["pair"] == pair and o["side"] == "sell" and compartment_of(o) == comp]
        if any(not o.get("parent") for o in existing):
            raise Rejected("annuler d'abord les ventes independantes sur cette paire et ce compartiment")
        entry = comp_pos.get("avg_cost") or pos["avg_cost"]
        live = ctx.last_price(meta)
        state["last_prices"][pair] = live
        be = a.get("breakeven_after_tp1", False)
        if not isinstance(be, bool):
            raise Rejected("breakeven_after_tp1 doit etre booleen")
        levels = normalize_take_profits(meta, a, entry, comp_pos["qty"])
        stop = round(float(a["stop_loss"]), meta["pair_decimals"]) if a.get("stop_loss") is not None else None
        if stop is not None and (not math.isfinite(stop) or stop <= 0 or stop >= live):
            raise Rejected("stop_loss doit etre positif et sous le cours actuel")
        if be and stop is None:
            raise Rejected("breakeven_after_tp1 requiert stop_loss")
        if any(tier["price"] <= live for tier in levels):
            raise Rejected("take_profits doit etre au-dessus du cours actuel")
        if not stop and not levels:
            raise Rejected("au moins un stop ou un TP requis")
        previous_filled = max((o.get("tp_filled", 0) for o in existing), default=0)
        if existing:
            if len(existing) != 1:
                raise Rejected("update_exits requiert un seul groupe de sorties pour ce compartiment")
            old = existing[0]
            if old.get("pending_exits"):
                raise Rejected("une mise a jour des sorties est deja en attente")
            old["pending_exits"] = {
                "active_from": next_5m(now),
                "action": {"take_profits": [
                    {"price": level["price"], "fraction": level["fraction"]}
                    for level in levels]},
                "stop_loss": stop, "breakeven_after_tp1": be,
                "entry_price": entry, "parent": decision_id,
                "compartment": comp}
            return {"type": "exits_update_scheduled", "pair": pair, "compartment": comp,
                    "active_from": old["pending_exits"]["active_from"],
                    "order_id": old["id"]}, []
        order = attach_exit(state, pair, comp_pos["qty"], stop, None, now,
                            decision_id, take_profits=levels,
                            breakeven_after_tp1=be, entry_price=entry, compartment=comp)
        if order is not None:
            order["tp_filled"] = previous_filled
        return {"type": "exits_updated", "pair": pair, "compartment": comp, "order": dict(order)}, []
    if typ not in ("place_limit", "market_buy", "market_sell"):
        raise Rejected(f"type d'action inconnu : {typ}")
    if not a.get("pair"):
        raise Rejected("il faut 'pair'")
    meta = ctx.meta(state, a["pair"])
    pair = meta["altname"]
    pd = meta["pair_decimals"]
    sl = round(float(a["stop_loss"]), pd) if a.get("stop_loss") else None
    tp = round(float(a["take_profit"]), pd) if a.get("take_profit") else None
    if a.get("take_profits") is not None and typ == "place_limit" and a.get("side") != "buy":
        raise Rejected("take_profits reserve aux achats")
    if a.get("take_profits") is not None and typ == "market_sell":
        raise Rejected("take_profits reserve aux achats")
    if a.get("breakeven_after_tp1") is not None and not isinstance(a["breakeven_after_tp1"], bool):
        raise Rejected("breakeven_after_tp1 doit etre booleen")
    if a.get("breakeven_after_tp1") is True and sl is None and (typ == "market_buy" or (typ == "place_limit" and a.get("side") == "buy")):
        raise Rejected("breakeven_after_tp1 exige stop_loss")

    if typ == "place_limit":
        side = a.get("side")
        if side not in ("buy", "sell"):
            raise Rejected("side doit valoir 'buy' ou 'sell'")
        price = round(float(a["price"]), pd)
        if price <= 0:
            raise Rejected("prix invalide")
        qty = _qty_for(meta, a, price, side, MAKER)
        last = ctx.last_price(meta)
        state["last_prices"][pair] = last
        if (side == "buy" and price >= last) or (side == "sell" and price <= last):
            raise Rejected(f"ordre limite {fr(price)} deja executable au cours actuel ({fr(last)}) : "
                           f"utiliser market_{side} (les limites sont traitees comme maker)")
        if side == "buy":
            if sl and sl >= price:
                raise Rejected("stop_loss doit etre sous le prix d'achat")
            if tp and tp <= price:
                raise Rejected("take_profit doit etre au-dessus du prix d'achat")
            need = qty * price * (1 + MAKER)
            if need > available_cash(state) + EPS:
                raise Rejected(f"cash disponible insuffisant ({fr(available_cash(state), 2)} USDC) pour {fr(need, 2)} USDC")
        else:
            if tp:
                raise Rejected("pour une vente, le prix limite fait office de take profit")
            if sl and sl >= price:
                raise Rejected("stop_loss doit etre sous le prix de vente")
            if qty > available_qty(state, pair, compartment_of(a)) + EPS:
                raise Rejected(f"quantite disponible insuffisante dans le compartiment {compartment_of(a)} "
                               f"({fr(max(available_qty(state, pair, compartment_of(a)), 0), 8)} {meta['base']})")
        levels = normalize_take_profits(meta, a, price, qty) if side == "buy" else []
        o = {"id": next_id(state, "order"), "pair": pair, "side": side, "qty": qty,
             "price": price, "stop_loss": sl, "take_profit": tp if side == "buy" else None,
             "created": iso(now), "active_from": next_5m(now), "parent": None,
             "decision_id": decision_id, "compartment": compartment_of(a)}
        if levels:
            o["take_profits"] = levels
            o["breakeven_after_tp1"] = a.get("breakeven_after_tp1", False)
        state["open_orders"].append(o)
        return {"type": "order_placed", "order": dict(o)}, []

    # Ordres au marche : dernier prix +/- 0,1 %, taker
    side = "buy" if typ == "market_buy" else "sell"
    comp = compartment_of(a)
    last = ctx.last_price(meta)
    state["last_prices"][pair] = last
    price = round(last * (1 + SLIP) if side == "buy" else last * (1 - SLIP), pd)
    qty = _qty_for(meta, a, price, side, TAKER)
    if side == "buy":
        need = qty * price * (1 + TAKER)
        if need > available_cash(state) + EPS:
            raise Rejected(f"cash disponible insuffisant ({fr(available_cash(state), 2)} USDC) pour {fr(need, 2)} USDC")
    elif qty > available_qty(state, pair, comp) + EPS:
        raise Rejected(f"quantite disponible insuffisante dans le compartiment {comp} "
                       f"({fr(max(available_qty(state, pair, comp), 0), 8)} {meta['base']})")
    levels = normalize_take_profits(meta, a, price, qty) if side == "buy" else []
    tr = execute_fill(state, pair, side, qty, price, "taker", "market", now, compartment=comp)
    if side == "buy":
        previous = [o for o in state["open_orders"] if o["pair"] == pair
                    and o["side"] == "sell" and o.get("parent")
                    and compartment_of(o) == comp]
        old_id = previous[0]["id"] if len(previous) == 1 else None
        previous_qty = previous[0]["qty"] if old_id else None
        merged = merge_purchase_exits(state, pair, qty, now, tr["id"],
                                      stop_loss=sl, take_profit=tp,
                                      take_profits=levels if levels else None,
                                      breakeven_after_tp1=a.get("breakeven_after_tp1", False),
                                      trade=tr, compartment=comp)
        if merged and merged["id"] == old_id and merged["qty"] > previous_qty + EPS:
            tr["exit_merge"] = {"order_id": old_id, "previous_qty": previous_qty,
                                "new_qty": merged["qty"], "added_qty": qty,
                                "stop_loss": merged.get("stop_loss"),
                                "ignored_stop_loss": sl, "ignored_take_profits": a.get("take_profits") or tp,
                                "new_entry_price": state["positions"].get(pair, {}).get("by_compartment", {}).get(comp, {}).get("avg_cost"),
                                "compartment": comp}
        audit_buy_protection(state, pair, tr)
    return {"type": "market", "trade_id": tr["id"], "compartment": comp}, [tr]


def apply_decisions(state, decisions, market, now):
    """Applique chaque decision une seule fois (idempotence par id)."""
    events, fills, errors = [], [], []
    ctx = Ctx(market)
    for d in sorted(decisions, key=lambda x: (str(x.get("timestamp", "")), str(x["id"]))):
        # Un heartbeat n'est jamais traite comme une decision. Ne modifie ni
        # orders, ni processed_decisions, ni last_decision, ni le journal.
        if d.get("type") == "heartbeat":
            continue
        if d["id"] in state["processed_decisions"]:
            continue
        work = copy.deepcopy(state)
        evs, fl = [], []
        try:
            for i, a in enumerate(d["actions"]):
                try:
                    ev, f = apply_action(work, a, ctx, now, d["id"])
                    ev.update({"decision_id": d["id"], "action_index": i})
                    evs.append(ev)
                    fl += f
                except Rejected as e:
                    evs.append({"type": "rejected", "decision_id": d["id"], "action_index": i,
                                "action": a, "reason": str(e)})
                except (TypeError, ValueError) as e:
                    evs.append({"type": "rejected", "decision_id": d["id"], "action_index": i,
                                "action": a, "reason": f"action mal formee : {e}"})
        except APIError as e:
            # On ne marque pas la decision : elle sera reessayee au prochain cycle.
            errors.append(f"decision {d['id']} reportee : {e}")
            break
        work["processed_decisions"].append(d["id"])
        work["last_decision"] = {"id": d["id"], "timestamp": d.get("timestamp"),
                                 "rationale": d.get("rationale", ""), "applied": iso(now)}
        state.clear()
        state.update(work)
        events.append({"type": "decision", "decision_id": d["id"],
                       "timestamp": d.get("timestamp"), "rationale": d.get("rationale", ""),
                       "file": d.get("_file")})
        events += evs
        for tr in fl:
            events.append({"type": "fill", "trade": tr})
        fills += fl
    return events, fills, errors


# --------------------------------------------------------------------------
# Cycle
# --------------------------------------------------------------------------
def replay_candles(state, market, now):
    """Rejeu des bougies cloturees : ordre chronologique GLOBAL (toutes paires).

    5 min si toutes les barres attendues sont disponibles; repli 1 h
    signale explicitement si l'heure est cloturee et les 5 min manquent.
    """
    events, fills, errors = [], [], []
    pairs = {o["pair"] for o in state["open_orders"]} | set(state["positions"]) | {BENCH}
    m5_cursors = state.setdefault("last_m5", {})
    timeline = []
    end = (int(now) // MIN5) * MIN5
    for pair in sorted(pairs):
        starts = [hour_floor(o["active_from"]) - HOUR for o in state["open_orders"]
                  if o["pair"] == pair]
        default_last = (min(starts) if starts else
                        hour_floor(state.get("last_cycle_ts") or now) - HOUR)
        last_hour = state["last_candle"].get(pair, default_last)
        try:
            hourly = {c[0]: c for c in market.ohlc(pair, last_hour, interval=60)}
        except APIError as exc:
            errors.append(f"OHLC 1h {pair} : {exc}")
            hourly = {}
        try:
            fives = {c[0]: c for c in market.ohlc(pair, last_hour + HOUR - MIN5, interval=5)
                     if c[0] + MIN5 <= now}
        except APIError as exc:
            # Indisponibilite API != donnees effacees : ne rien traiter,
            # ne pas avancer last_m5 ou last_candle pour cette paire.
            errors.append(f"OHLC 5m {pair} : {exc} ; reprise au prochain cycle")
            continue
        for hour in range(last_hour + HOUR, end, HOUR):
            closed = hour + HOUR <= now
            count = 12 if closed else max(0, min(12, (end - hour) // MIN5))
            expected = [hour + i * MIN5 for i in range(count)]
            if not expected:
                continue
            if closed and not all(t in fives for t in expected):
                # Un manque recent peut etre temporaire : attendre. Kraken garde
                # environ 720 bougies 5m = 60h. Le fallback ne concerne que
                # les heures STRICTEMENT plus anciennes que cette retention.
                # Une heure deja partiellement traitee en 5m n'est jamais
                # rejouee avec une bougie 1h agregée.
                partially_processed = hour <= m5_cursors.get(pair, -1) < hour + HOUR
                expired = hour + HOUR < now - RETENTION_5M
                if not expired or partially_processed:
                    errors.append(f"OHLC 5m incomplet {pair} {iso(hour)} ; "
                                  "attente sans repli" if not partially_processed else
                                  f"OHLC 5m partiellement traite {pair} {iso(hour)} ; "
                                  "repli 1h interdit")
                    break
                candle = hourly.get(hour)
                if candle is None or candle[0] + HOUR > now:
                    errors.append(f"repli 1h impossible {pair} {iso(hour)} : donnees manquantes")
                    break
                timeline.append((hour, pair, candle, "hour", hour))
                continue
            if not all(t in fives for t in expected):
                errors.append(f"m5 incomplet {pair} {iso(hour)} ; attente ou repli apres cloture")
                break
            for t in expected:
                if t <= m5_cursors.get(pair, last_hour + HOUR - MIN5):
                    continue
                completed_hour = hour if closed and t == expected[-1] else None
                timeline.append((t, pair, fives[t], "m5", completed_hour))
        # Un cycle ne doit jamais aller rechercher un segment deja confirme.
    for t, pair, candle, source, completed_hour in sorted(timeline, key=lambda x: (x[0], x[1])):
        if source == "m5" and t <= m5_cursors.get(pair, -1):
            continue
        if source == "hour":
            events.append({"type": "execution_fallback", "pair": pair,
                           "source": "hour", "reason": "m5_missing",
                           "candle_ts": t})
        if pair == BENCH and pair not in state["pairs"]:
            state["last_prices"][pair] = candle[4]
            if source == "m5":
                m5_cursors[pair] = t
            else:
                state["last_candle"][pair] = t
        else:
            rej = []
            fl = process_candle(state, pair, candle, rej,
                                market=None, m5_override=[candle] if source == "m5" else None)
            events.extend(rej)
            for tr in fl:
                events.append({"type": "fill", "trade": tr})
            fills.extend(fl)
        if completed_hour is not None:
            state["last_candle"][pair] = completed_hour
    return events, fills, errors


def latest_grok_session_id(decisions, state, now):
    """Derniere session valide, y compris heartbeat, sans changer apply_decisions."""
    selected = None
    for item in decisions:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        if item.get("type") == "heartbeat":
            if item.get("actions") != [] or not str(item.get("note", "")).strip():
                continue
        elif item["id"] not in state.get("processed_decisions", []):
            continue
        stamp = item.get("timestamp")
        try:
            dt = datetime.fromisoformat(stamp)
            if dt.tzinfo is None or dt.utcoffset() is None:
                continue
            ts = dt.timestamp()
        except (TypeError, ValueError):
            continue
        if ts > now:
            continue
        if selected is None or ts > selected[0]:
            selected = (ts, item["id"])
    if selected:
        return selected[1]
    return (state.get("last_decision") or {}).get("id")


PRICE_MOVE_THRESHOLDS = {"BTC": 0.05, "ETH": 0.05, "other": 0.07}


def price_move_alerts(state, now, thresholds=None, cooldown=6 * HOUR,
                      session_id=None):
    """Prepare des reveils a partir des derniers cours connus, sans reseau.

    L'etat est sauvegarde avant l'envoi du webhook par le workflow. Un
    heartbeat de Grok ou une decision constitue une nouvelle session.
    """
    thresholds = thresholds or PRICE_MOVE_THRESHOLDS
    watch = state.setdefault("price_move_watch", {})
    followed = set(state["positions"]) | {o["pair"] for o in state["open_orders"]
                                          if o.get("side") == "buy"}
    for pair in set(watch) - followed:
        del watch[pair]
    if session_id is None:
        session_id = (state.get("last_decision") or {}).get("id")
    notifications = []
    for pair in sorted(followed):
        price = state.get("last_prices", {}).get(pair)
        if not isinstance(price, (int, float)) or not math.isfinite(price) or price <= 0:
            continue
        meta = state.get("pairs", {}).get(pair, {})
        base = meta.get("base", pair.removesuffix("USDC"))
        threshold = thresholds.get(base, thresholds["other"])
        if not isinstance(threshold, (int, float)) or not 0 < threshold < 1:
            continue
        entry = watch.setdefault(pair, {"reference_price": price, "reference_ts": int(now),
                                         "last_session_id": session_id})
        # Nouvelle session Grok : rebaser la reference, meme en l'absence de
        # trade. Un heartbeat sera aussi traite par le workflow.
        if session_id and entry.get("last_session_id") != session_id:
            entry.pop("last_wakeup_ts", None)
            entry.update(reference_price=price, reference_ts=int(now),
                         last_session_id=session_id)
            continue
        ref = entry.get("reference_price")
        if not isinstance(ref, (int, float)) or not math.isfinite(ref) or ref <= 0:
            entry.update(reference_price=price, reference_ts=int(now))
            continue
        change = (price / ref - 1)
        if abs(change) + EPS < threshold:
            continue
        if abs(change) + EPS < 2 * threshold and int(now) - int(entry.get("last_wakeup_ts", -10**12)) < cooldown:
            continue
        entry.update(reference_price=price, reference_ts=int(now),
                     last_wakeup_ts=int(now))
        notifications.append({"type": "price_move", "crypto": base, "pair": pair,
                              "change_pct": round(change * 100, 4), "price": price})
    return notifications


def snapshot(state, market, now):
    errors = []
    pairs = sorted(set(state["positions"]) | {BENCH} | {o["pair"] for o in state["open_orders"]})
    try:
        tick = market.ticker(pairs)
        for p in pairs:
            meta = state["pairs"].get(p, {"key": p, "altname": p})
            for k in (meta.get("key"), meta.get("altname"), p):
                if k in tick:
                    state["last_prices"][p] = tick[k]
                    break
    except APIError as e:
        errors.append(f"Ticker : {e} (derniers prix connus utilises)")
    btc = state["last_prices"].get(BENCH)
    bench = state["benchmark"]
    if btc and not bench.get("btc_qty"):
        bench["start_price"] = btc
        bench["btc_qty"] = state["start_capital"] * (1 - MAKER) / btc
        bench["start_time"] = iso(now)
    pos_value = 0.0
    for p, pos in state["positions"].items():
        px = state["last_prices"].get(p)
        if px is None:
            errors.append(f"pas de prix pour {p}, snapshot ignore")
            return None, errors
        pos_value += pos["qty"] * px
    equity = state["cash"] + pos_value
    hold = bench["btc_qty"] * btc if btc and bench.get("btc_qty") else None
    row = {"time": iso(now), "engine_version": ENGINE_VERSION,
           "equity": round(equity, 2), "cash": round(state["cash"], 2),
           "positions": round(pos_value, 2), "btc_price": btc,
           "btc_hold": round(hold, 2) if hold else None}
    return row, errors


class Notifier:
    def __init__(self, topic):
        self.topic = topic

    def send(self, text):
        if not self.topic:
            return
        try:
            req = urllib.request.Request(
                "https://ntfy.sh/" + urllib.parse.quote(self.topic), data=text.encode("utf-8"),
                headers={"Title": "Kraken Paper", "Tags": "octopus"}, method="POST")
            urllib.request.urlopen(req, timeout=10).read()
        except Exception as e:  # une notif ratee ne casse pas le cycle
            print(f"ntfy : echec ({e})", file=sys.stderr)


def fill_message(tr):
    verb = {"buy": "achat", "sell": "vente"}[tr["side"]]
    label = {"stop_loss": "stop loss", "take_profit": "take profit", "market": "au marché",
             "limit": "limite"}.get(tr["reason"], tr["reason"])
    msg = f"Kraken Paper : {verb} {tr['base']} {fr(tr['qty'], 8)} à {fr(tr['price'])} USDC exécuté ({label})"
    if tr.get("realized_pnl") is not None:
        sign = "+" if tr["realized_pnl"] >= 0 else ""
        msg += f", P&L {sign}{fr(tr['realized_pnl'], 2)} USDC"
    return msg


def cross_compartment_warnings(state):
    """Un stop short au-dessus d'un achat medium en attente sur la même paire.
    Non bloquant. Produit un warning cross_compartment_conflict."""
    warnings = []
    for pair in set(o["pair"] for o in state.get("open_orders", [])):
        short_stops = [o for o in state["open_orders"]
                       if o["pair"] == pair and o["side"] == "sell"
                       and compartment_of(o) == "short" and o.get("stop_loss")]
        medium_buys = [o for o in state["open_orders"]
                       if o["pair"] == pair and o["side"] == "buy"
                       and compartment_of(o) == "medium"]
        for stop_o in short_stops:
            for buy_o in medium_buys:
                if stop_o["stop_loss"] > buy_o["price"]:
                    warnings.append({
                        "type": "cross_compartment_conflict",
                        "pair": pair,
                        "stop_order": stop_o["id"],
                        "stop_price": stop_o["stop_loss"],
                        "buy_order": buy_o["id"],
                        "buy_price": buy_o["price"],
                    })
    return warnings


def run_cycle(state, decisions, market, now, notifier=None):
    migration_warnings = migrate_state(state)
    events, fills, errors = [], [], []
    for w in migration_warnings:
        events.append(w)
    e, f, err = apply_decisions(state, decisions, market, now)
    events += e; fills += f; errors += err
    e, f, err = replay_candles(state, market, now)
    events += e; fills += f; errors += err
    row, err = snapshot(state, market, now)
    errors += err
    state["engine_version"] = ENGINE_VERSION
    state["last_cycle"] = iso(now)
    state["last_cycle_ts"] = int(now)
    state["last_cycle_errors"] = errors
    session = latest_grok_session_id(decisions, state, now)
    for alert in price_move_alerts(state, now, session_id=session):
        events.append(alert)
    # Dédoublonnage des conflits entre cycles
    previous = set(tuple(x) for x in state.get("signaled_conflicts", []))
    current = []
    current_keys = set()
    for w in cross_compartment_warnings(state):
        key = (w["pair"], w["stop_order"], w["buy_order"])
        current.append(key)
        current_keys.add(key)
        if key not in previous:
            events.append(w)
    # Conflits disparus
    for key in previous - current_keys:
        events.append({"type": "cross_compartment_conflict_resolved",
                       "pair": key[0], "stop_order": key[1], "buy_order": key[2]})
    state["signaled_conflicts"] = current
    if notifier:
        for tr in fills:
            notifier.send(fill_message(tr))
    # Audit explicite des fusions réussies. Ne journaliser aucun groupe
    # supposé fusionné si un ancien état incohérent a bloqué la fusion.
    merged_events = []
    for ev in events:
        trade = ev.get("trade") if ev.get("type") == "fill" else None
        if trade and trade.get("unprotected_qty"):
            merged_events.append({"type": "unprotected_qty", "pair": trade["pair"],
                                  "trade_id": trade["id"], **trade["unprotected_qty"]})
        if trade and trade.get("exit_merge_skipped"):
            merged_events.append({"type": "exit_merge_skipped", "pair": trade["pair"],
                                  "trade_id": trade["id"], **trade["exit_merge_skipped"]})
        if trade and trade.get("exit_merge"):
            merged_events.append({"type": "exit_groups_merged",
                                  "pair": trade["pair"], "trade_id": trade["id"],
                                  **trade["exit_merge"]})
    events.extend(merged_events)
    for ev in events:
        ev["engine_version"] = ENGINE_VERSION
    return events, row, errors


def save_json_atomic(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, path)


def main():
    now = time.time()
    os.makedirs(STATE_DIR, exist_ok=True)
    if os.path.exists(PORTFOLIO):
        with open(PORTFOLIO, encoding="utf-8") as f:
            state = json.load(f)
        first = False
    else:
        state = new_state(now)
        first = True
    decisions, warnings = load_decisions()
    events, row, errors = run_cycle(state, decisions, Market(), now,
                                    Notifier(os.environ.get("NTFY_TOPIC", "").strip()))
    errors = warnings + errors
    state["last_cycle_errors"] = errors
    save_json_atomic(PORTFOLIO, state)
    with open(JOURNAL, "a", encoding="utf-8") as f:
        if first:
            f.write(json.dumps({"time": state["start_time"], "type": "start",
                                 "engine_version": ENGINE_VERSION,
                                "capital": state["start_capital"], "quote": QUOTE},
                               ensure_ascii=False) + "\n")
        for ev in events:
            ev = {"time": iso(now), "engine_version": ENGINE_VERSION, **ev}
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
        for err in errors:
            f.write(json.dumps({"time": iso(now), "engine_version": ENGINE_VERSION,
                                "type": "warning", "text": err},
                               ensure_ascii=False) + "\n")
    if row:
        # Migration du seul en-tete par le moteur. Les anciennes lignes restent
        # identiques et leur version manquante signifie 0.1.0.
        if os.path.exists(EQUITY):
            with open(EQUITY, "r", encoding="utf-8") as f:
                header = f.readline()
                historic = f.read() if "engine_version" not in header else None
            if historic is not None:
                tmp = EQUITY + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    f.write(EQUITY_HEADER)
                    f.write(historic)
                os.replace(tmp, EQUITY)
        new_file = not os.path.exists(EQUITY)
        with open(EQUITY, "a", encoding="utf-8") as f:
            if new_file:
                f.write(EQUITY_HEADER)
            f.write(",".join("" if row[k] is None else str(row[k]) for k in
                             ("time", "equity", "cash", "positions", "btc_price", "btc_hold",
                              "engine_version")) + "\n")
    print(f"cycle {iso(now)} : {len(events)} evenements, equity={row and row['equity']}, "
          f"erreurs={errors}")


if __name__ == "__main__":
    main()
