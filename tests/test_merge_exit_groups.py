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

    def test_merge_emits_auditable_event(self):
        events, _, _ = self.buy_market("audit-merge", T0 + 60)
        audit = [e for e in events if e.get("type") == "exit_groups_merged"]
        self.assertEqual(len(audit), 1)
        self.assertEqual(audit[0]["order_id"], self.original["id"])
        self.assertAlmostEqual(audit[0]["previous_qty"], .02)
        self.assertAlmostEqual(audit[0]["new_qty"], .03)
        self.assertAlmostEqual(audit[0]["added_qty"], .01)
        self.assertEqual(audit[0]["stop_loss"], 62000)

    def test_multiple_groups_fallback_without_buy_stop(self):
        old = self.state["open_orders"][0]
        old["qty"] = .01
        old["take_profits"] = [{"price": 72000, "fraction": 1, "qty": .01}]
        run.attach_exit(self.state, PAIR, .01, 61000, None, T0, "historical")
        events, _, _ = run.run_cycle(self.state, [decision("fallback", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
        })], FakeMarket(last=65000), T0 + 60)
        self.assertEqual(len(self.state["open_orders"]), 3)
        self.assertEqual(self.state["open_orders"][-1]["stop_loss"], 61000)
        self.assertAlmostEqual(run.available_qty(self.state, PAIR), 0)
        self.assertTrue(any(e.get("type") == "exit_merge_skipped" and
                            e.get("reason") == "multiple_groups" for e in events))

    def test_unprotected_quantity_audit(self):
        self.state["open_orders"].clear()
        events, _, _ = run.run_cycle(self.state, [decision("bare", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
        })], FakeMarket(last=65000), T0 + 60)
        warnings = [e for e in events if e.get("type") == "unprotected_qty"]
        self.assertEqual(len(warnings), 1)
        self.assertAlmostEqual(warnings[0]["held"], .03)
        self.assertEqual(warnings[0]["covered"], 0)

    def test_merge_preserves_deferred_breakeven(self):
        self.state["open_orders"][0]["breakeven_deferred"] = {"since": T0, "pru": 65000, "order_ids": ["pending"]}
        self.buy_market("deferred", T0 + 60)
        self.assertIn("breakeven_deferred", self.state["open_orders"][0])
        self.assertEqual(self.state["open_orders"][0]["stop_loss"], 62000)

    def test_classification_survives_merge_and_partial_exit(self):
        self.state["open_orders"][0]["compartment"] = "medium"
        run.run_cycle(self.state, [decision("short-buy", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
            "compartment": "short", "stop_loss": 60000,
        })], FakeMarket(last=65000), T0 + 60)
        group = self.state["open_orders"][0]
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertAlmostEqual(group["compartments"]["medium"], .02)
        self.assertAlmostEqual(group["compartments"]["short"], .01)
        self.assertEqual(group["stop_loss"], 62000)
        self.assertAlmostEqual(self.state["positions"][PAIR]["compartments"]["short"], .01)
        run.process_candle(self.state, PAIR, (T0+300,65000,70000,64000,65000),
                           market=FakeMarket(fail5=True))
        pos = self.state["positions"][PAIR]
        self.assertAlmostEqual(pos["compartments"]["medium"], .01)
        self.assertAlmostEqual(pos["compartments"]["short"], .005)
        self.assertAlmostEqual(sum(pos["compartments"].values()), pos["qty"])

    def test_unknown_purchase_does_not_inherit_classification(self):
        self.state["open_orders"][0]["compartment"] = "medium"
        self.buy_market("unclassified", T0+60)
        pos = self.state["positions"][PAIR]
        self.assertAlmostEqual(pos["compartments"]["medium"], .02)
        self.assertEqual(pos["compartments"]["short"], 0)
        self.assertIsNone(pos["compartment"])

    def test_no_extra_exit_when_unprotected_buy(self):
        run.run_cycle(self.state, [decision("unprotected", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
        })], FakeMarket(last=65000), T0 + 60)
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertAlmostEqual(self.state["open_orders"][0]["qty"], .03)


if __name__ == "__main__":
    unittest.main()
