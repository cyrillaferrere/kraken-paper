"""Datation des exécutions à la première bougie 5 min qui touche le niveau."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "engine"))
import run  # noqa: E402
from tests.test_engine import FakeMarket, decision, T0, H  # noqa: E402

M5 = 300


def bars5(hour, touches):
    """12 bougies 5 min. touches: {offset_sec: ('low'|'high', price)} pour forcer un niveau."""
    out = []
    for i in range(12):
        t = hour + i * M5
        o = h = l = c = 65500.0
        ev = touches.get(i * M5)
        if ev:
            kind, px = ev
            if kind == "low":
                l = px
                h = max(o, px + 50)
            else:
                h = px
                l = min(o, px - 50)
        out.append((t, o, h, l, c))
    return out


class PreciseFillTests(unittest.TestCase):
    def setUp(self):
        self.s = run.new_state(T0 - 10)

    def place_and_replay(self, actions, candles, candles5=None, fail5=False, at=None):
        d = decision("d1", *actions)
        run.run_cycle(self.s, [d], FakeMarket(), T0 - 10)
        m = FakeMarket(candles=candles, candles5=candles5 or {}, fail5=fail5)
        return run.run_cycle(self.s, [d], m, at if at is not None else T0 + 2 * H + 60)

    def test_buy_limit_dated_at_first_5m_open(self):
        c1 = {"XBTUSDC": [(T0, 66000, 66500, 64900, 65500)]}
        c5 = {"XBTUSDC": bars5(T0, {3 * M5: ("low", 64900)})}  # touche à T0+15 min
        self.place_and_replay(
            [{"type": "place_limit", "pair": "BTC/USDC", "side": "buy", "qty": 0.01, "price": 65000}],
            c1, c5, at=T0 + H + 60,
        )
        tr = self.s["closed_trades"][0]
        self.assertEqual(tr["ts"], T0 + 15 * 60)
        self.assertEqual(tr["time_source"], "m5")
        self.assertEqual(tr["price"], 65000)
        self.assertEqual(tr["liquidity"], "maker")
        self.assertAlmostEqual(tr["fee"], 650 * 0.004)
        # sortie active seulement à l'heure suivante
        exits = self.s["open_orders"]
        self.assertEqual(exits, [])  # pas de SL/TP ici

    def test_prices_and_fees_unchanged_vs_fallback(self):
        actions = [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01, "price": 65000}]
        c1 = {"XBTUSDC": [(T0, 66000, 66500, 64900, 65500)]}
        c5 = {"XBTUSDC": bars5(T0, {0: ("low", 64900)})}

        def run_once(candles5):
            s = run.new_state(T0 - 10)
            d = decision("dx", *actions)
            run.run_cycle(s, [d], FakeMarket(), T0 - 10)
            run.run_cycle(s, [d], FakeMarket(candles=c1, candles5=candles5), T0 + H + 60)
            return s["closed_trades"][0]

        a, b = run_once(c5), run_once({})
        self.assertEqual(a["price"], b["price"])
        self.assertAlmostEqual(a["fee"], b["fee"])
        self.assertEqual(a["qty"], b["qty"])
        self.assertEqual(a["time_source"], "m5")
        self.assertEqual(b["time_source"], "hour_open")
        self.assertEqual(b["ts"], T0)
        self.assertEqual(a["ts"], T0)

    def test_fallback_api_error_dates_at_hour_open(self):
        c1 = {"XBTUSDC": [(T0, 66000, 66500, 64900, 65500)]}
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01, "price": 65000}],
            c1, fail5=True, at=T0 + H + 60,
        )
        tr = self.s["closed_trades"][0]
        self.assertEqual(tr["ts"], T0)
        self.assertEqual(tr["time_source"], "hour_open")
        self.assertEqual(tr["price"], 65000)

    def test_fallback_incomplete_5m_dates_at_hour_open(self):
        c1 = {"XBTUSDC": [(T0, 66000, 66500, 64900, 65500)]}
        incomplete = {"XBTUSDC": bars5(T0, {0: ("low", 64900)})[:6]}
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01, "price": 65000}],
            c1, incomplete, at=T0 + H + 60,
        )
        tr = self.s["closed_trades"][0]
        self.assertEqual((tr["ts"], tr["time_source"]), (T0, "hour_open"))

    def test_tp_before_stop_on_5m_takes_tp(self):
        c1 = {"XBTUSDC": [
            (T0, 65500, 65600, 64900, 65200),
            (T0 + H, 65200, 70000, 60000, 65000),
        ]}
        entry5 = bars5(T0, {0: ("low", 64900)})
        # TP à +10 min, stop à +25 min
        exit5 = bars5(T0 + H, {2 * M5: ("high", 70000), 5 * M5: ("low", 60000)})
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01,
              "price": 65000, "stop_loss": 62000, "take_profit": 69000}],
            c1, {"XBTUSDC": entry5 + exit5},
        )
        reasons = [t["reason"] for t in self.s["closed_trades"]]
        self.assertEqual(reasons, ["limit", "take_profit"])
        tp = self.s["closed_trades"][1]
        self.assertEqual(tp["ts"], T0 + H + 10 * 60)
        self.assertEqual(tp["price"], 69000)
        self.assertEqual(tp["liquidity"], "maker")
        self.assertEqual(tp["time_source"], "m5")
        self.assertNotIn("XBTUSDC", self.s["positions"])

    def test_stop_and_tp_same_5m_bar_takes_stop(self):
        c1 = {"XBTUSDC": [
            (T0, 65500, 65600, 64900, 65200),
            (T0 + H, 65200, 70000, 60000, 65000),
        ]}
        entry5 = bars5(T0, {0: ("low", 64900)})
        # même bougie 5 min : high 70 000 et low 60 000
        rows = bars5(T0 + H, {})
        t4 = T0 + H + 4 * M5
        rows[4] = (t4, 65200, 70000, 60000, 65000)
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01,
              "price": 65000, "stop_loss": 62000, "take_profit": 69000}],
            c1, {"XBTUSDC": entry5 + rows},
        )
        sl = self.s["closed_trades"][1]
        self.assertEqual(sl["reason"], "stop_loss")
        self.assertEqual(sl["ts"], t4)
        self.assertEqual(sl["price"], 61938.0)
        self.assertEqual(sl["liquidity"], "taker")

    def test_stop_before_tp_on_5m_takes_stop(self):
        c1 = {"XBTUSDC": [
            (T0, 65500, 65600, 64900, 65200),
            (T0 + H, 65200, 70000, 60000, 65000),
        ]}
        entry5 = bars5(T0, {0: ("low", 64900)})
        exit5 = bars5(T0 + H, {1 * M5: ("low", 60000), 8 * M5: ("high", 70000)})
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01,
              "price": 65000, "stop_loss": 62000, "take_profit": 69000}],
            c1, {"XBTUSDC": entry5 + exit5},
        )
        sl = self.s["closed_trades"][1]
        self.assertEqual(sl["reason"], "stop_loss")
        self.assertEqual(sl["ts"], T0 + H + 5 * 60)

    def test_fallback_same_1h_candle_still_prefers_stop(self):
        c1 = {"XBTUSDC": [
            (T0, 65500, 65600, 64900, 65200),
            (T0 + H, 65200, 70000, 60000, 65000),
        ]}
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01,
              "price": 65000, "stop_loss": 62000, "take_profit": 69000}],
            c1,  # pas de 5 min
        )
        sl = self.s["closed_trades"][1]
        self.assertEqual(sl["reason"], "stop_loss")
        self.assertEqual(sl["ts"], T0 + H)  # ouverture de la bougie 1 h, plus la fermeture
        self.assertEqual(sl["time_source"], "hour_open")
        self.assertEqual(sl["price"], 61938.0)

    def test_exit_active_from_is_next_hour(self):
        c1 = {"XBTUSDC": [(T0, 66000, 66500, 64900, 65500)]}
        c5 = {"XBTUSDC": bars5(T0, {20 * 60: ("low", 64900)})}
        self.place_and_replay(
            [{"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.01,
              "price": 65000, "stop_loss": 62000, "take_profit": 69000}],
            c1, c5, at=T0 + H + 60,
        )
        exo = self.s["open_orders"][0]
        self.assertEqual(exo["active_from"], T0 + H)
        self.assertEqual(exo["parent"], self.s["closed_trades"][0]["order_id"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
