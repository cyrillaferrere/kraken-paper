"""Tests de réservation du cash et des quantités, style tests/test_engine.py."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "engine"))
import run  # noqa: E402
from tests.test_engine import FakeMarket, decision, T0  # noqa: E402


def buy(price, quote, **kw):
    return dict({"type": "place_limit", "pair": "BTC/USDC", "side": "buy", "quote_amount": quote, "price": price}, **kw)


class ReservationTests(unittest.TestCase):
    def setUp(self):
        self.s = run.new_state(T0 - 10)
        self.cash = self.s["cash"]

    def events(self, *actions, did="r1", last=65500.0):
        ev = run.run_cycle(self.s, [decision(did, *actions)], FakeMarket(last=last), T0 - 10)
        return ev

    def journal(self):
        return self.s.get("_journal", [])

    def rejected(self):
        return [l for l in self.journal() if l.get("type") == "rejected"]

    def test_second_buy_limit_rejected_when_cash_reserved(self):
        big = round(self.cash * 0.7, 2)
        self.events(buy(64000, big), buy(63000, big))
        self.assertEqual(len([o for o in self.s["open_orders"] if o["side"] == "buy"]), 1)
        self.assertEqual(self.s["cash"], self.cash)  # rien n'est débité tant que rien n'est exécuté
        self.assertLess(run.available_cash(self.s), self.cash * 0.31)

    def test_market_buy_rejected_on_reserved_cash(self):
        self.events(
            buy(64000, round(self.cash * 0.9, 2)),
            {"type": "market_buy", "pair": "BTC/USDC", "quote_amount": round(self.cash * 0.2, 2)},
        )
        self.assertEqual(self.s["closed_trades"], [])

    def test_cancel_releases_reservation(self):
        self.events(buy(64000, round(self.cash * 0.9, 2)))
        oid = self.s["open_orders"][0]["id"]
        run.run_cycle(
            self.s,
            [decision("r2", {"type": "cancel", "order_id": oid}, buy(63000, round(self.cash * 0.9, 2)))],
            FakeMarket(),
            T0 - 5,
        )
        self.assertEqual([o["price"] for o in self.s["open_orders"]], [63000])

    def test_sell_limit_reserves_qty(self):
        self.events({"type": "market_buy", "pair": "BTC/USDC", "quote_amount": 1000})
        q = self.s["positions"]["XBTUSDC"]["qty"]
        self.events(
            {"type": "place_limit", "pair": "BTC/USDC", "side": "sell", "qty": q, "price": 70000},
            {"type": "market_sell", "pair": "BTC/USDC", "qty": q / 2},
            did="r3",
        )
        self.assertEqual(len([o for o in self.s["open_orders"] if o["side"] == "sell"]), 1)
        self.assertEqual(self.s["positions"]["XBTUSDC"]["qty"], q)  # la vente au marché a été refusée
        self.assertAlmostEqual(run.available_qty(self.s, "XBTUSDC"), 0, places=12)

    def test_reserved_matches_fill_cost_to_the_cent(self):
        self.events(buy(64000, 1000))
        o = self.s["open_orders"][0]
        gross = o["qty"] * o["price"]
        self.assertAlmostEqual(self.cash - run.available_cash(self.s), gross + run.money(gross * run.MAKER), places=6)


if __name__ == "__main__":
    unittest.main(verbosity=2)
