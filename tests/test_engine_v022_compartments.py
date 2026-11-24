"""Compartiments medium/short — moteur 0.2.2. Aucun accès réseau ni state/ vivant."""
import copy
import json
import os
import unittest

from tests.test_engine import run, FakeMarket, T0, H, decision


PAIR = "XBTUSDC"
TP = [{"price": 69000, "fraction": .5}, {"price": 72000, "fraction": .5}]


class CompartmentTests(unittest.TestCase):
    def setUp(self):
        self.state = run.new_state(T0 - 10)

    def test_migration_flat_position_becomes_medium_idempotent(self):
        st = {
            "positions": {PAIR: {"base": "BTC", "qty": 0.01, "avg_cost": 60000, "fees_paid": 2.4}},
            "open_orders": [{"id": "O0001", "pair": PAIR, "side": "buy", "qty": 0.005, "price": 58000}],
            "closed_trades": [{"id": "T0001", "pair": PAIR, "qty": 0.01, "price": 60000}],
        }
        run.migrate_state(st)
        self.assertIn("by_compartment", st["positions"][PAIR])
        self.assertAlmostEqual(st["positions"][PAIR]["by_compartment"]["medium"]["qty"], 0.01)
        self.assertAlmostEqual(st["positions"][PAIR]["by_compartment"]["medium"]["avg_cost"], 60000)
        self.assertEqual(st["open_orders"][0]["compartment"], "medium")
        self.assertEqual(st["closed_trades"][0]["compartment"], "medium")
        # Idempotent
        snap = copy.deepcopy(st)
        run.migrate_state(st)
        self.assertEqual(st, snap)

    def test_short_buy_does_not_merge_into_medium(self):
        run.run_cycle(self.state, [decision("med", {
            "type": "market_buy", "pair": PAIR, "qty": .02,
            "stop_loss": 62000, "take_profits": TP, "compartment": "medium",
        })], FakeMarket(last=65000), T0 - 10)
        self.assertEqual(len(self.state["open_orders"]), 1)
        self.assertEqual(run.compartment_of(self.state["open_orders"][0]), "medium")
        run.run_cycle(self.state, [decision("sh", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
            "stop_loss": 64000, "take_profit": 70000, "compartment": "short",
        })], FakeMarket(last=68000), T0)
        groups = [o for o in self.state["open_orders"] if o["side"] == "sell" and o.get("parent")]
        self.assertEqual(len(groups), 2)
        medium = next(o for o in groups if run.compartment_of(o) == "medium")
        short = next(o for o in groups if run.compartment_of(o) == "short")
        self.assertAlmostEqual(medium["qty"], .02)
        self.assertAlmostEqual(short["qty"], .01)
        self.assertEqual(medium["stop_loss"], 62000)
        self.assertEqual(short["stop_loss"], 64000)
        pos = self.state["positions"][PAIR]
        self.assertAlmostEqual(pos["qty"], .03)
        self.assertAlmostEqual(pos["by_compartment"]["medium"]["qty"], .02)
        self.assertAlmostEqual(pos["by_compartment"]["short"]["qty"], .01)
        # PRU indépendants (prix de marché différents)
        self.assertNotAlmostEqual(
            pos["by_compartment"]["medium"]["avg_cost"],
            pos["by_compartment"]["short"]["avg_cost"],
        )

    def test_medium_stop_does_not_touch_short_qty(self):
        run.run_cycle(self.state, [decision("med", {
            "type": "market_buy", "pair": PAIR, "qty": .02,
            "stop_loss": 62000, "take_profit": 70000, "compartment": "medium",
        })], FakeMarket(last=65000), T0 - 10)
        run.run_cycle(self.state, [decision("sh", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
            "stop_loss": 64000, "take_profit": 72000, "compartment": "short",
        })], FakeMarket(last=65000), T0)
        # Appelle uniquement le stop medium ; le short ne doit pas être touché
        medium = next(o for o in self.state["open_orders"] if run.compartment_of(o) == "medium")
        run._check_order(self.state, PAIR, medium, T0 + 300, 63500, 61500, [], None, 63000)
        pos = self.state["positions"].get(PAIR)
        self.assertIsNotNone(pos)
        self.assertAlmostEqual(pos["by_compartment"]["short"]["qty"], .01)
        self.assertNotIn("medium", pos.get("by_compartment", {}))
        self.assertAlmostEqual(pos["qty"], .01)

    def test_no_oversell_between_compartments(self):
        run.run_cycle(self.state, [decision("med", {
            "type": "market_buy", "pair": PAIR, "qty": .02,
            "compartment": "medium",
        })], FakeMarket(last=65000), T0 - 10)
        with self.assertRaises(run.Rejected):
            run.apply_action(self.state, {
                "type": "market_sell", "pair": PAIR, "qty": .03, "compartment": "medium",
            }, run.Ctx(FakeMarket()), T0, "sell-too-much")

    def test_tp_not_same_candle_as_buy(self):
        # Achat au marché à T0, fill dans la bougie 5 min qui commence à T0
        run.run_cycle(self.state, [decision("buy", {
            "type": "market_buy", "pair": PAIR, "qty": .01,
            "stop_loss": 60000, "take_profit": 66000,
        })], FakeMarket(last=65000), T0)
        # Même bougie 5 min (T0) : TP bloqué
        fills = run.process_candle(self.state, PAIR, (T0, 65000, 67000, 64000, 65500),
                                    market=FakeMarket(fail5=True))
        tp_fills = [f for f in fills if f.get("reason") == "take_profit"]
        self.assertEqual(tp_fills, [])
        # Bougie suivante : TP peut s'exécuter
        fills2 = run.process_candle(self.state, PAIR, (T0 + 300, 65500, 68000, 65000, 66500),
                                     market=FakeMarket(fail5=True))
        self.assertTrue(any(f.get("reason") == "take_profit" for f in fills2))

    def test_cross_compartment_warning(self):
        run.run_cycle(self.state, [decision("med", {
            "type": "place_limit", "pair": PAIR, "side": "buy", "qty": .01,
            "price": 60000, "compartment": "medium",
        })], FakeMarket(last=65000), T0 - 10)
        run.run_cycle(self.state, [decision("sh", {
            "type": "market_buy", "pair": PAIR, "qty": .005,
            "stop_loss": 62000, "take_profit": 70000, "compartment": "short",
        })], FakeMarket(last=65000), T0)
        events, _, _ = run.run_cycle(self.state, [], FakeMarket(), T0 + 60)
        warnings = [e for e in events if e.get("type") == "cross_compartment_conflict"]
        self.assertTrue(warnings)
        self.assertEqual(warnings[0]["pair"], PAIR)

    def test_old_engine_style_reads_aggregate(self):
        """Un moteur 0.2.1 ignore by_compartment et lit qty/avg_cost."""
        st = run.new_state(T0)
        st["positions"][PAIR] = {
            "base": "BTC", "qty": 0.03, "avg_cost": 61000, "fees_paid": 5,
            "by_compartment": {
                "medium": {"qty": 0.02, "avg_cost": 60000, "fees_paid": 3},
                "short": {"qty": 0.01, "avg_cost": 63000, "fees_paid": 2},
            },
        }
        # Lecture style 0.2.1
        self.assertAlmostEqual(st["positions"][PAIR]["qty"], 0.03)
        self.assertAlmostEqual(st["positions"][PAIR]["avg_cost"], 61000)
        # Migration ne casse pas
        run.migrate_state(st)
        self.assertAlmostEqual(st["positions"][PAIR]["qty"], 0.03)


if __name__ == "__main__":
    unittest.main()
