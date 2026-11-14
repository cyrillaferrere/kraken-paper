"""Tests rapides du moteur, sans aucun appel reseau."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "engine"))
import run  # noqa: E402

H = 3600
T0 = 1_800_000_000 // H * H   # un debut d'heure


class FakeMarket:
    """Marche factice : AssetPairs, bougies et ticker fournis par le test."""

    def __init__(self, candles=None, last=65500.0, fail=False, candles5=None, fail5=False):
        self.candles = candles or {}
        self.candles5 = candles5 or {}
        self.last = last
        self.fail = fail
        self.fail5 = fail5

    def asset_pairs(self):
        if self.fail:
            raise run.APIError("panne simulee")
        return {
            "XBTUSDC": {"altname": "XBTUSDC", "wsname": "XBT/USDC", "quote": "USDC",
                        "status": "online", "lot_decimals": 8, "pair_decimals": 2,
                        "ordermin": "0.00005", "costmin": "0.5"},
            "XBTUSDT": {"altname": "XBTUSDT", "wsname": "XBT/USDT", "quote": "USDT",
                        "status": "online", "lot_decimals": 8, "pair_decimals": 1,
                        "ordermin": "0.00005", "costmin": "0.5"},
        }

    def ohlc(self, pair, since, interval=60):
        if self.fail or (interval == 5 and self.fail5):
            raise run.APIError("panne simulee")
        src = self.candles5 if interval == 5 else self.candles
        return [c for c in src.get(pair, []) if c[0] >= since]

    def ticker(self, pairs):
        if self.fail:
            raise run.APIError("panne simulee")
        return {p: self.last for p in pairs}


def decision(did, *actions):
    return {"id": did, "timestamp": "2027-01-15T08:00:00+01:00", "rationale": "test",
            "actions": list(actions)}


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.state = run.new_state(T0 - 10)

    def place_then_replay(self, d, candles, at):
        """Decision posee juste avant la bougie T0, puis cycle a l'instant `at`."""
        run.run_cycle(self.state, [d], FakeMarket(), T0 - 10)
        return run.run_cycle(self.state, [d], FakeMarket(candles=candles), at)

    def test_buy_limit_fill_and_maker_fee(self):
        m = FakeMarket(candles={"XBTUSDC": [(T0, 66000, 66500, 64900, 65500)]})
        d = decision("d1", {"type": "place_limit", "pair": "BTC/USDC", "side": "buy",
                            "qty": 0.01, "price": 65000})
        self.place_then_replay(d, m.candles, T0 + H + 60)
        self.assertEqual(len(self.state["closed_trades"]), 1)
        tr = self.state["closed_trades"][0]
        self.assertEqual(tr["price"], 65000)
        self.assertEqual(tr["liquidity"], "maker")
        self.assertAlmostEqual(tr["fee"], 650 * 0.004)
        self.assertAlmostEqual(self.state["cash"], 6606.42 - 650 - 2.6, places=6)
        self.assertAlmostEqual(self.state["positions"]["XBTUSDC"]["qty"], 0.01)

    def test_no_fill_when_price_not_reached(self):
        m = FakeMarket(candles={"XBTUSDC": [(T0, 66000, 66500, 65100, 65500)]})
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 65000})
        self.place_then_replay(d, m.candles, T0 + H + 60)
        self.assertEqual(self.state["closed_trades"], [])
        self.assertEqual(len(self.state["open_orders"]), 1)

    def test_unclosed_candle_ignored(self):
        m = FakeMarket(candles={"XBTUSDC": [(T0, 66000, 66500, 60000, 65500)]})
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 65000})
        self.place_then_replay(d, m.candles, T0 + 600)   # bougie encore ouverte
        self.assertEqual(self.state["closed_trades"], [])

    def test_insufficient_cash_rejected(self):
        m = FakeMarket()
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 1, "price": 65000})
        events, _, _ = run.run_cycle(self.state, [d], m, T0 + 60)
        self.assertEqual(self.state["open_orders"], [])
        self.assertTrue(any(e["type"] == "rejected" for e in events))
        self.assertEqual(self.state["cash"], 6606.42)

    def test_reserved_cash_counts(self):
        m = FakeMarket()
        a = {"type": "place_limit", "pair": "XBTUSDC", "side": "buy", "qty": 0.06, "price": 65000}
        run.run_cycle(self.state, [decision("d1", a, a)], m, T0 + 60)
        self.assertEqual(len(self.state["open_orders"]), 1)   # le 2e depasse le cash dispo

    def test_sell_more_than_held_rejected_and_usdt_refused(self):
        m = FakeMarket()
        d = decision("d1",
                     {"type": "market_sell", "pair": "XBTUSDC", "qty": 0.01},
                     {"type": "market_buy", "pair": "XBTUSDT", "quote_amount": 100})
        events, _, _ = run.run_cycle(self.state, [d], m, T0 + 60)
        self.assertEqual(sum(e["type"] == "rejected" for e in events), 2)
        self.assertEqual(self.state["closed_trades"], [])

    def test_market_buy_taker_and_lot_rounding(self):
        m = FakeMarket(last=65000.0)
        d = decision("d1", {"type": "market_buy", "pair": "XBTUSDC", "quote_amount": 1000})
        run.run_cycle(self.state, [d], m, T0 + 60)
        tr = self.state["closed_trades"][0]
        self.assertEqual(tr["price"], 65065.0)   # +0,1 %
        self.assertEqual(tr["liquidity"], "taker")
        self.assertEqual(tr["qty"], run.floor_dec(1000 / (65065 * 1.008), 8))
        self.assertAlmostEqual(tr["fee"], round(tr["qty"] * 65065 * 0.008, 6))
        self.assertLessEqual(tr["qty"] * 65065 + tr["fee"], 1000 + 1e-6)

    def test_idempotence(self):
        m = FakeMarket()
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 60000})
        run.run_cycle(self.state, [d], m, T0 + 60)
        run.run_cycle(self.state, [d], m, T0 + 120)
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertEqual(self.state["processed_decisions"], ["d1"])

    def test_stop_and_tp_same_candle_takes_stop(self):
        m = FakeMarket(candles={"XBTUSDC": [
            (T0, 65500, 65600, 64900, 65200),          # achat a 65 000
            (T0 + H, 65200, 70000, 60000, 65000),      # touche TP et stop
        ]})
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 65000, "stop_loss": 62000,
                            "take_profit": 69000})
        self.place_then_replay(d, m.candles, T0 + 2 * H + 60)
        trades = self.state["closed_trades"]
        self.assertEqual([t["reason"] for t in trades], ["limit", "stop_loss"])
        self.assertEqual(trades[1]["price"], 61938.0)   # stop - 0,1 %
        self.assertEqual(trades[1]["liquidity"], "taker")
        self.assertNotIn("XBTUSDC", self.state["positions"])
        self.assertEqual(self.state["open_orders"], [])
        self.assertLess(trades[1]["realized_pnl"], 0)

    def test_take_profit(self):
        m = FakeMarket(candles={"XBTUSDC": [
            (T0, 65500, 65600, 64900, 65200),
            (T0 + H, 65200, 69500, 64000, 69000),
        ]})
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 65000, "stop_loss": 62000,
                            "take_profit": 69000})
        self.place_then_replay(d, m.candles, T0 + 2 * H + 60)
        tr = self.state["closed_trades"][1]
        self.assertEqual((tr["reason"], tr["price"], tr["liquidity"]), ("take_profit", 69000, "maker"))
        self.assertAlmostEqual(tr["realized_pnl"], 690 * 0.996 - 650 * 1.004, places=4)

    def test_marketable_limit_rejected(self):
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 70000})
        events, _, _ = run.run_cycle(self.state, [d], FakeMarket(last=65500.0), T0 + 60)
        self.assertEqual(self.state["open_orders"], [])
        self.assertTrue(any(e["type"] == "rejected" for e in events))

    def test_cancel(self):
        m = FakeMarket()
        run.run_cycle(self.state, [decision("d1", {"type": "place_limit", "pair": "XBTUSDC",
                                                   "side": "buy", "qty": 0.01, "price": 60000})], m, T0 + 60)
        oid = self.state["open_orders"][0]["id"]
        run.run_cycle(self.state, [decision("d2", {"type": "cancel", "order_id": oid})], m, T0 + 120)
        self.assertEqual(self.state["open_orders"], [])

    def test_api_error_keeps_state_and_retries_decision(self):
        m = FakeMarket(fail=True)
        d = decision("d1", {"type": "market_buy", "pair": "XBTUSDC", "quote_amount": 100})
        _, row, errors = run.run_cycle(self.state, [d], m, T0 + 60)
        self.assertEqual(self.state["processed_decisions"], [])
        self.assertEqual(self.state["cash"], 6606.42)
        self.assertTrue(errors)
        run.run_cycle(self.state, [d], FakeMarket(), T0 + 120)
        self.assertEqual(self.state["processed_decisions"], ["d1"])

    def test_benchmark_and_message(self):
        m = FakeMarket(last=65000.0)
        _, row, _ = run.run_cycle(self.state, [], m, T0 + 60)
        self.assertAlmostEqual(row["btc_hold"], round(6606.42 * 0.996, 2))
        self.assertEqual(row["equity"], 6606.42)
        msg = run.fill_message({"side": "buy", "base": "BTC", "qty": 0.0072, "price": 65000,
                                "reason": "limit", "realized_pnl": None})
        self.assertEqual(msg, "Kraken Paper : achat BTC 0,0072 à 65 000 USDC exécuté (limite)")


if __name__ == "__main__":
    unittest.main()


class LateOrderTests(unittest.TestCase):
    def test_order_ignores_candle_started_before_it(self):
        st = run.new_state(T0 - 10)
        d = decision("d1", {"type": "place_limit", "pair": "XBTUSDC", "side": "buy",
                            "qty": 0.01, "price": 65000})
        # Ordre pose a T0+30 min : la bougie T0 (deja entamee) ne compte pas.
        run.run_cycle(st, [d], FakeMarket(), T0 + 1800)
        run.run_cycle(st, [d], FakeMarket(candles={"XBTUSDC": [(T0, 66000, 66500, 64000, 65500)]}),
                      T0 + H + 60)
        self.assertEqual(st["closed_trades"], [])
