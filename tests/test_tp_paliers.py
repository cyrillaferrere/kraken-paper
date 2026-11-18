"""Sorties fractionnées : tests PAPER isolés, sans réseau ni état vivant."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "engine"))
import run
from tests.test_engine import FakeMarket, T0, H, decision


def bars5(hour, highs, lows):
    return [(hour + i * 300, 65000, highs[i], lows[i], 65000) for i in range(12)]


class TieredExitTests(unittest.TestCase):
    def setUp(self):
        self.state = run.new_state(T0 - 10)
        self.buy = {"type": "market_buy", "pair": "XBTUSDC", "qty": 0.02,
                    "stop_loss": 62000, "take_profits": [
                        {"price": 69000, "fraction": 0.5},
                        {"price": 72000, "fraction": 0.5}]}
        run.run_cycle(self.state, [decision("buy", self.buy)], FakeMarket(last=65000), T0 - 10)
        self.pair = "XBTUSDC"
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.order = self.state["open_orders"][0]

    def candle(self, hour, high, low, m5=None):
        market = FakeMarket(candles5={self.pair: m5} if m5 else {}, fail5=not bool(m5))
        return run.process_candle(self.state, self.pair, (hour, 65000, high, low, 65000), market=market)

    def test_tp1_then_tp2(self):
        fills = self.candle(T0, 70000, 64000)
        self.assertEqual(len(fills), 1)
        self.assertEqual((fills[0]["tp_index"], fills[0]["qty"]), (1, 0.01))
        self.assertEqual(self.order["qty"], 0.01)
        self.assertAlmostEqual(self.state["positions"][self.pair]["qty"], 0.01)
        self.assertEqual(self.order["stop_loss"], 62000)
        fills = self.candle(T0 + H, 73000, 64000)
        self.assertEqual(fills[0]["tp_index"], 2)
        self.assertEqual(self.state["open_orders"], [])
        self.assertNotIn(self.pair, self.state["positions"])
        self.assertAlmostEqual(self.state["realized_pnl"],
                               sum(x["realized_pnl"] for x in self.state["closed_trades"] if x["side"] == "sell"))

    def test_tp1_then_breakeven_stop(self):
        self.order["breakeven_after_tp1"] = True
        self.candle(T0, 70000, 64000)
        self.assertAlmostEqual(self.order["stop_loss"], self.order["entry_price"])
        fills = self.candle(T0 + H, 67000, 64000)
        self.assertEqual(fills[0]["reason"], "stop_loss")
        self.assertEqual(fills[0]["qty"], 0.01)
        self.assertEqual(self.state["open_orders"], [])
        self.assertLess(fills[0]["realized_pnl"], 0)

    def test_stop_before_tp1(self):
        fills = self.candle(T0, 70000, 61000)
        self.assertEqual(len(fills), 1)
        self.assertEqual((fills[0]["reason"], fills[0]["qty"]), ("stop_loss", 0.02))

    def test_stop_and_tp_in_same_five_minutes(self):
        highs = [68000] * 12
        lows = [64000] * 12
        highs[4], lows[4] = 70000, 61000
        fills = self.candle(T0, 70000, 61000, bars5(T0, highs, lows))
        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0]["reason"], "stop_loss")
        self.assertEqual(fills[0]["ts"], T0 + 4 * 300)

    def test_tp1_then_stop_later_same_hour(self):
        highs = [68000] * 12
        lows = [64000] * 12
        highs[2] = 70000
        lows[7] = 61000
        fills = self.candle(T0, 70000, 61000, bars5(T0, highs, lows))
        self.assertEqual([f["reason"] for f in fills], ["take_profit", "stop_loss"])
        self.assertEqual([f["ts"] for f in fills], [T0 + 600, T0 + 2100])

    def test_update_exits(self):
        action = {"type": "update_exits", "pair": self.pair, "stop_loss": 61000,
                  "take_profits": [{"price": 70000, "fraction": 0.25},
                                   {"price": 74000, "fraction": 0.75}]}
        events, _, _ = run.run_cycle(self.state, [decision("update", action)], FakeMarket(), T0 + 60)
        self.assertFalse(any(e["type"] == "rejected" for e in events))
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 62000)
        self.assertIn("pending_exits", self.state["open_orders"][0])
        self.candle(T0 + H, 68000, 64000)
        self.assertEqual([x["qty"] for x in self.state["open_orders"][0]["take_profits"]], [0.005, 0.015])
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 61000)

    def test_invalid_fractions_rejected(self):
        with self.assertRaises(run.Rejected):
            run.normalize_take_profits(self.state["pairs"][self.pair],
                {"take_profits": [{"price": 69000, "fraction": 0.4},
                                  {"price": 72000, "fraction": 0.4}]}, 65000, 0.02)

    def test_gap_under_stop_uses_open(self):
        fills = self.candle(T0, 64000, 60000,
                            [(T0 + i * 300, 60000, 64000, 59000, 60000) for i in range(12)])
        self.assertLess(fills[0]["price"], round(60000 * 0.999, 2))  # gap et amplitude
        self.assertEqual(fills[0]["reason"], "stop_loss")

    def test_update_exits_stop_above_live_rejected(self):
        a = {"type": "update_exits", "pair": self.pair, "stop_loss": 64500,
             "take_profits": [{"price": 70000, "fraction": 1.0}]}
        events, _, _ = run.run_cycle(self.state, [decision("unsafe", a)],
                                      FakeMarket(last=60000), T0 + 60)
        self.assertTrue(any(e["type"] == "rejected" for e in events))
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 62000)

    def test_update_exits_nonboolean_breakeven_rejected(self):
        a = {"type": "update_exits", "pair": self.pair, "stop_loss": 61000,
             "breakeven_after_tp1": "false"}
        events, _, _ = run.run_cycle(self.state, [decision("bad-be", a)],
                                      FakeMarket(last=65000), T0 + 60)
        self.assertTrue(any(e["type"] == "rejected" for e in events))

    def test_update_exits_after_tp1_preserves_numbering(self):
        self.candle(T0, 70000, 64000)
        a = {"type": "update_exits", "pair": self.pair, "stop_loss": 63000,
             "take_profits": [{"price": 74000, "fraction": 1.0}]}
        run.run_cycle(self.state, [decision("rework", a)], FakeMarket(last=68000), T0 + H + 60)
        self.assertEqual(self.state["open_orders"][0]["tp_filled"], 1)
        self.candle(T0 + 2 * H, 69000, 65000)
        self.assertEqual(self.state["open_orders"][0]["tp_filled"], 1)
        self.assertEqual(self.state["open_orders"][0]["take_profits"][0]["price"], 74000)

    def test_pending_update_keeps_old_stop(self):
        action = {"type": "update_exits", "pair": self.pair, "stop_loss": 60000,
                  "take_profits": [{"price": 75000, "fraction": 1.0}]}
        run.run_cycle(self.state, [decision("pending", action)], FakeMarket(last=65000), T0 + 60)
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 62000)
        fills = self.candle(T0, 65000, 61000)
        self.assertEqual(fills[0]["reason"], "stop_loss")
        self.assertEqual(self.state["open_orders"], [])

    def test_three_tiers_fraction_rounding(self):
        meta = self.state["pairs"][self.pair]
        tiers = run.normalize_take_profits(meta, {"take_profits": [
            {"price": 69000, "fraction": 0.3333},
            {"price": 72000, "fraction": 0.3333},
            {"price": 75000, "fraction": 0.3334}]}, 65000, 0.02)
        self.assertAlmostEqual(sum(x["qty"] for x in tiers), 0.02)

    def test_two_tiers_in_same_five_minute(self):
        bars = [(T0 + i * 300, 65000, 74000, 64000, 73000) for i in range(12)]
        fills = self.candle(T0, 74000, 64000, bars)
        self.assertEqual([x["tp_index"] for x in fills], [1, 2])
        self.assertEqual([x["ts"] for x in fills], [T0, T0])

    def test_breakeven_requires_stop_on_update(self):
        a = {"type": "update_exits", "pair": self.pair,
             "take_profits": [{"price": 74000, "fraction": 1.0}],
             "breakeven_after_tp1": True}
        events, _, _ = run.run_cycle(self.state, [decision("no-stop", a)],
                                      FakeMarket(last=65000), T0 + 60)
        self.assertTrue(any(e["type"] == "rejected" for e in events))

    def test_sell_limit_breakeven_without_stop_is_legacy_noop(self):
        """Une vente indépendante n'attache pas de sorties : option ignorée historiquement."""
        state = run.new_state(T0 - 10)
        run.run_cycle(state, [decision("entry", {"type": "market_buy", "pair": self.pair, "qty": 0.02})],
                      FakeMarket(last=65000), T0 - 10)
        a = {"type": "place_limit", "side": "sell", "pair": self.pair,
             "price": 70000, "qty": 0.01, "breakeven_after_tp1": True}
        events, _, errors = run.apply_decisions(state, [decision("sell-legacy-be", a)],
                                                FakeMarket(last=65000), T0)
        self.assertFalse(errors)
        self.assertTrue(any(e["type"] == "order_placed" for e in events))
        sell = [o for o in state["open_orders"] if o["side"] == "sell"]
        self.assertEqual(len(sell), 1)
        self.assertNotIn("breakeven_after_tp1", sell[0])
        self.assertIsNone(sell[0]["stop_loss"])

    def test_market_buy_breakeven_requires_stop(self):
        state = run.new_state(T0 - 10)
        a = {"type": "market_buy", "pair": self.pair, "qty": 0.02,
             "take_profits": [{"price": 69000, "fraction": 1.0}],
             "breakeven_after_tp1": True}
        events, _, errors = run.apply_decisions(state, [decision("no-stop-market", a)],
                                           FakeMarket(last=65000), T0)
        self.assertFalse(errors)
        self.assertEqual(state["positions"], {})
        self.assertFalse(state["open_orders"])
        self.assertTrue(any(e["type"] == "rejected" and "exige stop_loss" in e["reason"] for e in events))

    def test_limit_buy_breakeven_requires_stop(self):
        state = run.new_state(T0 - 10)
        a = {"type": "place_limit", "side": "buy", "pair": self.pair,
             "price": 64000, "qty": 0.02,
             "take_profits": [{"price": 69000, "fraction": 1.0}],
             "breakeven_after_tp1": True}
        events, _, errors = run.apply_decisions(state, [decision("no-stop-limit", a)],
                                                FakeMarket(last=65000), T0)
        self.assertFalse(errors)
        self.assertFalse(state["open_orders"])
        self.assertTrue(any(e["type"] == "rejected" and "exige stop_loss" in e["reason"] for e in events))

    def test_update_at_exact_hour_is_not_retroactive(self):
        action = {"type": "update_exits", "pair": self.pair, "stop_loss": 61000,
                  "take_profits": [{"price": 75000, "fraction": 1.0}]}
        run.run_cycle(self.state, [decision("boundary", action)],
                      FakeMarket(last=65000), T0 + H)
        pending = self.state["open_orders"][0]["pending_exits"]
        self.assertEqual(pending["active_from"], T0 + H + 300)
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 62000)

    def test_pending_update_does_not_reserve_later_purchase(self):
        action = {"type": "update_exits", "pair": self.pair, "stop_loss": 61000,
                  "take_profits": [{"price": 75000, "fraction": 1.0}]}
        run.run_cycle(self.state, [decision("new-exits", action)],
                      FakeMarket(last=65000), T0 + 60)
        # Un achat supplementaire est execute pendant l'attente.
        run.execute_fill(self.state, self.pair, "buy", 0.01, 65000,
                         "maker", "limit", T0 + 120, "extra-buy")
        self.candle(T0 + H, 68000, 64000)
        orders = self.state["open_orders"]
        self.assertEqual(len(orders), 1)
        self.assertAlmostEqual(orders[0]["qty"], 0.02)
        self.assertAlmostEqual(self.state["positions"][self.pair]["qty"], 0.03)
        self.assertGreaterEqual(run.available_qty(self.state, self.pair), -run.EPS)

    def test_pending_invalid_small_tier_keeps_old_stop(self):
        action = {"type": "update_exits", "pair": self.pair, "stop_loss": 61000,
                  "take_profits": [{"price": 70000, "fraction": 0.997},
                                   {"price": 75000, "fraction": 0.003}]}
        # Installer un changement dont les niveaux deviennent non negociables
        # apres une vente partielle, sans bloquer le cycle.
        self.candle(T0, 70000, 64000)  # TP1 reduit le groupe a 0,01 BTC
        old = self.state["open_orders"][0]
        old["pending_exits"] = {
            "active_from": T0 + H, "action": {"take_profits": action["take_profits"]},
            "stop_loss": 61000, "breakeven_after_tp1": False,
            "entry_price": 65000, "parent": "invalid-after-fill"}
        rejects = []
        fills = run.process_candle(
            self.state, self.pair, (T0 + H, 65000, 68000, 64000, 65000),
            rejects=rejects, market=FakeMarket(fail5=True))
        self.assertEqual(fills, [])
        self.assertIs(self.state["open_orders"][0], old)
        self.assertEqual(old["stop_loss"], 62000)
        self.assertNotIn("pending_exits", old)
        self.assertTrue(any("anciennes sorties conservees" in e.get("text", "")
                            for e in rejects))

    def test_legacy_single_tp(self):
        st = run.new_state(T0 - 10)
        action = {"type": "market_buy", "pair": self.pair, "qty": 0.01,
                  "stop_loss": 62000, "take_profit": 69000}
        run.run_cycle(st, [decision("legacy", action)], FakeMarket(last=65000), T0 - 10)
        self.assertEqual(len(st["open_orders"]), 1)
        self.assertEqual(st["open_orders"][0]["take_profits"][0]["fraction"], 1.0)


if __name__ == "__main__":
    unittest.main()
