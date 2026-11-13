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
EQUITY_HEADER = "time,equity_usdc,cash_usdc,positions_usdc,btc_price,btc_hold_usdc\n"

API = "https://api.kraken.com/0/public/"
QUOTE = "USDC"
BENCH = "XBTUSDC"
START_CAPITAL = 6606.42
MAKER = 0.0040   # Kraken Pro palier 1
TAKER = 0.0080
SLIP = 0.001     # 0,1 % de glissement (stops et ordres au marche)
HOUR = 3600
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

    def ohlc(self, pair, since):
        res = self._get("OHLC", pair=pair, interval=60, since=int(since))
        rows = next(v for k, v in res.items() if k != "last")
        return [(int(c[0]), float(c[1]), float(c[2]), float(c[3]), float(c[4])) for c in rows]

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
        "benchmark": {"pair": BENCH, "btc_qty": None, "start_price": None},
        "fees_total": 0.0,
        "realized_pnl": 0.0,
        "seq": {"order": 0, "trade": 0},
        "last_cycle": None,
        "last_cycle_ts": None,
        "last_cycle_errors": [],
        "fees": {"maker": MAKER, "taker": TAKER, "slippage": SLIP},
    }


def available_cash(state):
    reserved = sum(o["qty"] * o["price"] * (1 + MAKER)
                   for o in state["open_orders"] if o["side"] == "buy")
    return state["cash"] - reserved


def available_qty(state, pair):
    held = state["positions"].get(pair, {}).get("qty", 0.0)
    reserved = sum(o["qty"] for o in state["open_orders"]
                   if o["side"] == "sell" and o["pair"] == pair)
    return held - reserved


def next_id(state, kind):
    state["seq"][kind] += 1
    return ("O" if kind == "order" else "T") + f"{state['seq'][kind]:04d}"


# --------------------------------------------------------------------------
# Execution
# --------------------------------------------------------------------------
def execute_fill(state, pair, side, qty, price, liquidity, reason, ts, order_id=None):
    meta = state["pairs"][pair]
    rate = MAKER if liquidity == "maker" else TAKER
    gross = qty * price
    fee = money(gross * rate)
    pos = state["positions"].setdefault(pair, {"base": meta["base"], "qty": 0.0,
                                                "avg_cost": 0.0, "fees_paid": 0.0})
    pnl = None
    if side == "buy":
        cost = gross + fee
        if cost > state["cash"] + EPS:
            raise Rejected(f"cash insuffisant ({fr(state['cash'], 2)} USDC) pour {fr(cost, 2)} USDC")
        new_qty = pos["qty"] + qty
        pos["avg_cost"] = (pos["qty"] * pos["avg_cost"] + cost) / new_qty
        pos["qty"] = round(new_qty, meta["lot_decimals"])
        state["cash"] = money(state["cash"] - cost)
    else:
        if qty > pos["qty"] + EPS:
            raise Rejected(f"quantite insuffisante ({pos['qty']} {meta['base']})")
        proceeds = gross - fee
        pnl = money(proceeds - qty * pos["avg_cost"])
        pos["qty"] = round(pos["qty"] - qty, meta["lot_decimals"])
        state["cash"] = money(state["cash"] + proceeds)
        state["realized_pnl"] = money(state["realized_pnl"] + pnl)
    pos["fees_paid"] = money(pos["fees_paid"] + fee)
    state["fees_total"] = money(state["fees_total"] + fee)
    if pos["qty"] <= EPS:
        del state["positions"][pair]
    trade = {
        "id": next_id(state, "trade"), "order_id": order_id, "pair": pair,
        "base": meta["base"], "side": side, "qty": qty, "price": price,
        "fee": fee, "liquidity": liquidity, "reason": reason,
        "time": iso(ts), "ts": int(ts), "realized_pnl": pnl,
    }
    state["closed_trades"].append(trade)
    return trade


def attach_exit(state, pair, qty, stop_loss, take_profit, ts, parent):
    if not stop_loss and not take_profit:
        return None
    o = {"id": next_id(state, "order"), "pair": pair, "side": "sell", "qty": qty,
         "price": take_profit, "stop_loss": stop_loss, "take_profit": None,
         "created": iso(ts), "active_from": hour_ceil(ts), "parent": parent,
         "decision_id": None}
    state["open_orders"].append(o)
    return o


def process_candle(state, pair, candle, rejects=None):
    """Rejoue une bougie 1 h CLOTUREE. Retourne la liste des trades."""
    t, o_, high, low, close = candle
    fills = []
    for order in list(state["open_orders"]):
        if order["pair"] != pair or order["active_from"] > t or order not in state["open_orders"]:
            continue
        try:
            _check_order(state, pair, order, t, high, low, fills)
        except Rejected as e:   # ne devrait pas arriver (fonds reserves), on annule proprement
            state["open_orders"].remove(order)
            if rejects is not None:
                rejects.append({"type": "cancel", "order_id": order["id"], "pair": pair,
                                "reason": f"annule par le moteur : {e}"})
    state["last_prices"][pair] = close
    state["last_candle"][pair] = t
    return fills


def _check_order(state, pair, order, t, high, low, fills):
    if order["side"] == "buy":
        if low <= order["price"]:
            tr = execute_fill(state, pair, "buy", order["qty"], order["price"],
                              "maker", "limit", t + HOUR, order["id"])
            state["open_orders"].remove(order)
            fills.append(tr)
            attach_exit(state, pair, order["qty"], order.get("stop_loss"),
                        order.get("take_profit"), t + HOUR, order["id"])
    else:
        stop = order.get("stop_loss")
        limit = order.get("price")
        if stop and low <= stop:   # stop prioritaire (cas conservateur)
            px = round(stop * (1 - SLIP), state["pairs"][pair]["pair_decimals"])
            tr = execute_fill(state, pair, "sell", order["qty"], px, "taker",
                              "stop_loss", t + HOUR, order["id"])
        elif limit and high >= limit:
            tr = execute_fill(state, pair, "sell", order["qty"], limit, "maker",
                              "take_profit" if order.get("parent") or stop else "limit",
                              t + HOUR, order["id"])
        else:
            return
        state["open_orders"].remove(order)
        fills.append(tr)


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
    if typ not in ("place_limit", "market_buy", "market_sell"):
        raise Rejected(f"type d'action inconnu : {typ}")
    if not a.get("pair"):
        raise Rejected("il faut 'pair'")
    meta = ctx.meta(state, a["pair"])
    pair = meta["altname"]
    pd = meta["pair_decimals"]
    sl = round(float(a["stop_loss"]), pd) if a.get("stop_loss") else None
    tp = round(float(a["take_profit"]), pd) if a.get("take_profit") else None

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
            if qty > available_qty(state, pair) + EPS:
                raise Rejected(f"quantite disponible insuffisante ({fr(max(available_qty(state, pair), 0), 8)} {meta['base']})")
        o = {"id": next_id(state, "order"), "pair": pair, "side": side, "qty": qty,
             "price": price, "stop_loss": sl, "take_profit": tp if side == "buy" else None,
             "created": iso(now), "active_from": hour_ceil(now), "parent": None,
             "decision_id": decision_id}
        state["open_orders"].append(o)
        return {"type": "order_placed", "order": dict(o)}, []

    # Ordres au marche : dernier prix +/- 0,1 %, taker
    side = "buy" if typ == "market_buy" else "sell"
    last = ctx.last_price(meta)
    state["last_prices"][pair] = last
    price = round(last * (1 + SLIP) if side == "buy" else last * (1 - SLIP), pd)
    qty = _qty_for(meta, a, price, side, TAKER)
    if side == "buy":
        need = qty * price * (1 + TAKER)
        if need > available_cash(state) + EPS:
            raise Rejected(f"cash disponible insuffisant ({fr(available_cash(state), 2)} USDC) pour {fr(need, 2)} USDC")
    elif qty > available_qty(state, pair) + EPS:
        raise Rejected(f"quantite disponible insuffisante ({fr(max(available_qty(state, pair), 0), 8)} {meta['base']})")
    tr = execute_fill(state, pair, side, qty, price, "taker", "market", now)
    if side == "buy":
        attach_exit(state, pair, qty, sl, tp, now, tr["id"])
    return {"type": "market", "trade_id": tr["id"]}, [tr]


def apply_decisions(state, decisions, market, now):
    """Applique chaque decision une seule fois (idempotence par id)."""
    events, fills, errors = [], [], []
    ctx = Ctx(market)
    for d in sorted(decisions, key=lambda x: (str(x.get("timestamp", "")), str(x["id"]))):
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
    events, fills, errors = [], [], []
    pairs = {o["pair"] for o in state["open_orders"]} | set(state["positions"]) | {BENCH}
    for pair in sorted(pairs):
        starts = [o["active_from"] - HOUR for o in state["open_orders"] if o["pair"] == pair]
        default_last = min([hour_floor(now) - 2 * HOUR] + starts)
        last = state["last_candle"].get(pair, default_last)
        try:
            candles = market.ohlc(pair, last)
        except APIError as e:
            errors.append(f"OHLC {pair} : {e}")
            continue
        for c in sorted(candles):
            if c[0] <= last or c[0] + HOUR > now:
                continue   # deja traitee ou pas encore cloturee
            if pair not in state["pairs"] and pair != BENCH:
                continue
            if pair == BENCH and pair not in state["pairs"]:
                state["last_prices"][pair] = c[4]
                state["last_candle"][pair] = c[0]
                continue
            rej = []
            fl = process_candle(state, pair, c, rej)
            events += rej
            for tr in fl:
                events.append({"type": "fill", "trade": tr})
            fills += fl
    return events, fills, errors


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
    row = {"time": iso(now), "equity": round(equity, 2), "cash": round(state["cash"], 2),
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


def run_cycle(state, decisions, market, now, notifier=None):
    events, fills, errors = [], [], []
    e, f, err = apply_decisions(state, decisions, market, now)
    events += e; fills += f; errors += err
    e, f, err = replay_candles(state, market, now)
    events += e; fills += f; errors += err
    row, err = snapshot(state, market, now)
    errors += err
    state["last_cycle"] = iso(now)
    state["last_cycle_ts"] = int(now)
    state["last_cycle_errors"] = errors
    if notifier:
        for tr in fills:
            notifier.send(fill_message(tr))
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
                                "capital": state["start_capital"], "quote": QUOTE},
                               ensure_ascii=False) + "\n")
        for ev in events:
            ev = {"time": iso(now), **ev}
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
        for err in errors:
            f.write(json.dumps({"time": iso(now), "type": "warning", "text": err},
                               ensure_ascii=False) + "\n")
    if row:
        new_file = not os.path.exists(EQUITY)
        with open(EQUITY, "a", encoding="utf-8") as f:
            if new_file:
                f.write(EQUITY_HEADER)
            f.write(",".join("" if row[k] is None else str(row[k]) for k in
                             ("time", "equity", "cash", "positions", "btc_price", "btc_hold")) + "\n")
    print(f"cycle {iso(now)} : {len(events)} evenements, equity={row and row['equity']}, "
          f"erreurs={errors}")


if __name__ == "__main__":
    main()
