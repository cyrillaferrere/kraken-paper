"""Fusion de sorties PAPER lors d'achats successifs, sans etat vivant."""
import unittest
from tests.test_engine import run, FakeMarket, T0, H, decision


PAIR = "XBTUSDC"
TP = [{"price": 69000, "fraction": .5}, {"price": 72000, "fraction": .5}]


class MergeExitGroupsTests(unittest.TestCase):
    def setUp(self):
        self.state = run.new_state(T0 - 10)
        run.run_cycle(self.state, [decision("first", {
            "type": "market_buy", "pair": PAIR, "qty": .02,
            "stop_loss": 62000, "take_profits": TP,
        })], FakeMarket(last=65000), T0 - 10)
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.original = self.state["open_orders"][0]

    def buy_market(self, did, now, qty=.01):
        return run.run_cycle(self.state, [decision(did, {
            "type": "market_buy", "pair": PAIR, "qty": qty,
            "stop_loss": 60000, "take_profit": 76000,
        })], FakeMarket(last=65000), now)

    def test_two_market_buys_one_group(self):
        self.buy_market("second", T0 + 60)
        orders = self.state["open_orders"]
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["id"], self.original["id"])
        self.assertAlmostEqual(orders[0]["qty"], .03)
        self.assertEqual(orders[0]["stop_loss"], 62000)
        self.assertEqual([x["price"] for x in orders[0]["take_profits"]], [69000, 72000])
        self.assertAlmostEqual(sum(x["qty"] for x in orders[0]["take_profits"]), .03)
        self.assertAlmostEqual(run.available_qty(self.state, PAIR), 0)

    def test_buy_after_tp1_preserves_counter_and_stop(self):
        run.process_candle(self.state, PAIR, (T0, 65000, 70000, 64000, 65000),
                           market=FakeMarket(fail5=True))
        self.assertEqual(self.state["open_orders"][0]["tp_filled"], 1)
        self.buy_market("after-tp1", T0 + 60)
        self.assertEqual(len(self.state["open_orders"]), 1)
        order = self.state["open_orders"][0]
        self.assertEqual(order["tp_filled"], 1)
        self.assertEqual(len(order["take_profits"]), 1)
        self.assertAlmostEqual(order["qty"], .02)
        self.assertAlmostEqual(order["take_profits"][0]["qty"], .02)

    def test_pending_update_remains_and_reserves_new_purchase(self):
        run.run_cycle(self.state, [decision("update", {
            "type": "update_exits", "pair": PAIR, "stop_loss": 61000,
            "take_profits": [{"price": 75000, "fraction": 1.0}],
        })], FakeMarket(last=65000), T0 + 60)
        self.assertIn("pending_exits", self.state["open_orders"][0])
        self.buy_market("during-pending", T0 + 120)
        self.assertAlmostEqual(self.state["open_orders"][0]["qty"], .03)
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 62000)
        run.process_candle(self.state, PAIR,
                           (T0 + 300, 65000, 68000, 64000, 65000),
                           market=FakeMarket(fail5=True))
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertAlmostEqual(self.state["open_orders"][0]["qty"], .03)
        self.assertAlmostEqual(run.available_qty(self.state, PAIR), 0)

    def test_limit_purchase_merges_when_filled(self):
        d = decision("limit", {"type": "place_limit", "pair": PAIR,
                               "side": "buy", "qty": .01, "price": 64000,
                               "stop_loss": 60000, "take_profit": 76000})
        run.apply_decisions(self.state, [d], FakeMarket(last=65000), T0 - 10)
        buy = next(o for o in self.state["open_orders"] if o["side"] == "buy")
        run._check_order(self.state, PAIR, buy, T0, 66000, 63000, [], None, 65000)
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertAlmostEqual(self.state["open_orders"][0]["qty"], .03)

    def test_no_extra_exit_when_unprotected_buy(self):
        run.run_cycle(self.state, [decision("unprotected", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
        })], FakeMarket(last=65000), T0 + 60)
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertAlmostEqual(self.original["qty"], .03)


if __name__ == "__main__":
    unittest.main()
