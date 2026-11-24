"""Alertes de variation : donnees purement fictives, aucun webhook reel."""
import unittest
from tests.test_engine import run, T0


PAIR = "XBTUSDC"


class PriceMoveWakeupTests(unittest.TestCase):
    def setUp(self):
        self.state = run.new_state(T0)
        self.state["positions"][PAIR] = {"base": "BTC", "qty": .01, "avg_cost": 65000}
        self.state["pairs"][PAIR] = {"base": "BTC", "altname": PAIR}
        self.state["last_prices"][PAIR] = 65000

    def test_threshold_and_upward_move(self):
        self.assertEqual(run.price_move_alerts(self.state, T0), [])
        self.state["last_prices"][PAIR] = 68100
        self.assertEqual(run.price_move_alerts(self.state, T0 + 300), [])
        self.state["last_prices"][PAIR] = 68250
        alerts = run.price_move_alerts(self.state, T0 + 600)
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["type"], "price_move")
        self.assertAlmostEqual(alerts[0]["change_pct"], 5)
        self.assertEqual(self.state["price_move_watch"][PAIR]["reference_price"], 68250)

    def test_downward_move_cooldown_and_reset(self):
        run.price_move_alerts(self.state, T0)
        self.state["last_prices"][PAIR] = 61750
        self.assertEqual(len(run.price_move_alerts(self.state, T0 + 300)), 1)
        self.state["last_prices"][PAIR] = 57000
        self.assertEqual(run.price_move_alerts(self.state, T0 + 600), [])
        self.assertEqual(len(run.price_move_alerts(self.state, T0 + 6 * 3600 + 301)), 1)

    def test_pending_order_watched_and_persisted(self):
        self.state["positions"].clear()
        self.state["open_orders"] = [{"pair": PAIR, "side": "buy", "qty": .01}]
        run.price_move_alerts(self.state, T0)
        self.assertIn(PAIR, self.state["price_move_watch"])
        copy = __import__("json").loads(__import__("json").dumps(self.state))
        self.assertEqual(copy["price_move_watch"][PAIR]["reference_price"], 65000)

    def test_session_resets_reference(self):
        run.price_move_alerts(self.state, T0)
        self.state["last_prices"][PAIR] = 68250
        self.state["last_decision"] = {"id": "grok-session"}
        self.assertEqual(run.price_move_alerts(self.state, T0 + 300), [])
        self.assertEqual(self.state["price_move_watch"][PAIR]["reference_price"], 68250)

    def test_other_coin_uses_seven_percent(self):
        pair = "SOLUSDC"
        self.state["positions"][pair] = {"base": "SOL", "qty": 1, "avg_cost": 100}
        self.state["pairs"][pair] = {"base": "SOL"}
        self.state["last_prices"][pair] = 100
        run.price_move_alerts(self.state, T0)
        self.state["last_prices"][pair] = 106
        self.assertEqual(run.price_move_alerts(self.state, T0 + 300), [])
        self.state["last_prices"][pair] = 107
        self.assertEqual([x["crypto"] for x in run.price_move_alerts(self.state, T0 + 600)], ["SOL"])


if __name__ == "__main__":
    unittest.main()
