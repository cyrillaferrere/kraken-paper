"""Regression v0.3.7 / moteur 0.2.0. Aucun acces reseau ou state/."""
import copy
import json
import os
import unittest
from unittest import mock

from tests.test_engine import run, FakeMarket, T0, H, decision


class EngineV02Tests(unittest.TestCase):
    def test_frozen_production_snapshot_replayed_without_mutation(self):
        """Copie isolee du portefeuille PAPER du 18/11, aucun ecrit sur state/."""
        fixture = os.path.join(os.path.dirname(__file__), "fixtures",
                               "portfolio_2026-11-18.json")
        with open(fixture, encoding="utf-8") as f:
            source = json.load(f)
        st = copy.deepcopy(source)
        old_orders = copy.deepcopy(st["open_orders"])
        old_positions = copy.deepcopy(st["positions"])
        old_trades = copy.deepcopy(st["closed_trades"])
        expected = {"O0017", "O0022", "O0024", "O0025", "O0026"}
        self.assertEqual({x["id"] for x in old_orders}, expected)
        run.run_cycle(st, [], FakeMarket(), st["last_cycle_ts"] + 60)
        self.assertEqual(st["engine_version"], run.ENGINE_VERSION)
        self.assertEqual(st["open_orders"], old_orders)
        self.assertEqual(st["positions"], old_positions)
        self.assertEqual(st["closed_trades"], old_trades)
        self.assertNotIn("engine_version", source)
        with open(fixture, encoding="utf-8") as f:
            self.assertEqual(json.load(f), source)

    def test_version_and_old_portfolio_remain_compatible(self):
        state = run.new_state(T0)
        state.pop("engine_version")
        order = {"id": "O0017", "pair": "XBTUSDC", "side": "buy",
                 "qty": .01, "price": 63000, "active_from": T0 + 300}
        state["open_orders"] = [order]
        original = copy.deepcopy(order)
        events, row, _ = run.run_cycle(state, [], FakeMarket(), T0 + 60)
        self.assertEqual(state["engine_version"], "0.2.0")
        self.assertEqual(state["open_orders"][0], original)
        self.assertEqual(row["engine_version"], "0.2.0")
        self.assertTrue(all(e["engine_version"] == "0.2.0" for e in events))

    def test_limit_requires_penetration_on_both_sides(self):
        st = run.new_state(T0 - 10)
        d = decision("b", {"type": "place_limit", "pair": "XBTUSDC",
                            "side": "buy", "qty": .01, "price": 65000})
        run.run_cycle(st, [d], FakeMarket(), T0 - 10)
        run.run_cycle(st, [d], FakeMarket(candles={"XBTUSDC": [
            (T0, 66000, 66500, 64980, 65500)]}), T0 + H + 60)
        self.assertFalse(st["closed_trades"])
        self.assertEqual(len(st["open_orders"]), 1)
        self.assertEqual(run.LIMIT_PENETRATION, .0005)

    def test_stop_17_november_example(self):
        px, slip = run.stop_execution(63700, 63700, 63700, 63298, .01, 0, 0)
        self.assertEqual(px, 63636)
        self.assertAlmostEqual(slip, .001)
        self.assertGreater(px, 63298)
        turbulent, rate = run.stop_execution(63700, 63700, 67000, 60000, .01, 1, 0)
        self.assertLess(turbulent, px)
        self.assertGreater(rate, slip)

    def test_rolling_fee_tiers_expire(self):
        st = run.new_state(T0)
        self.assertEqual(run.fee_rates(st, T0)[:2], (.004, .008))
        st["closed_trades"] = [{"qty": 1, "price": 3000, "ts": T0 - 60}]
        self.assertEqual(run.fee_rates(st, T0)[:2], (.003, .006))
        self.assertEqual(run.fee_rates(st, T0 + 31 * 86400)[:2], (.004, .008))

    def test_heartbeat_has_no_effect_even_with_empty_actions(self):
        st = run.new_state(T0)
        original = copy.deepcopy(st)
        hb = {"id": "2026-11-18-heartbeat", "type": "heartbeat",
              "timestamp": "2026-11-18T03:09:00+01:00", "actions": [],
              "note": "passage"}
        events, fills, errors = run.apply_decisions(st, [hb], FakeMarket(), T0)
        self.assertEqual((events, fills, errors), ([], [], []))
        self.assertEqual(st, original)

    def test_m5_executes_without_waiting_for_hour_close(self):
        st = run.new_state(T0 - 10)
        d = decision("entry", {"type": "place_limit", "pair": "XBTUSDC",
                               "side": "buy", "qty": .01, "price": 65000})
        run.run_cycle(st, [d], FakeMarket(), T0 - 10)
        five = [(T0, 66000, 66300, 64900, 65100, 100),
                (T0 + 300, 65100, 65300, 64900, 65000, 100)]
        m = FakeMarket(candles5={"XBTUSDC": five})
        run.run_cycle(st, [d], m, T0 + 650)
        self.assertEqual(len(st["closed_trades"]), 1)
        self.assertEqual(st["closed_trades"][0]["ts"], T0)
        self.assertEqual(st["closed_trades"][0]["time_source"], "m5")
        self.assertEqual(st["last_m5"]["XBTUSDC"], T0 + 300)

    def test_fee_tier_uses_global_m5_order_across_pairs(self):
        st = run.new_state(T0 - 10)
        for pair in ("AAAUSDC", "ZZZUSDC"):
            st["pairs"][pair] = {"base": pair[:3], "altname": pair,
                                  "pair_decimals": 2, "lot_decimals": 8,
                                  "ordermin": .0001, "costmin": .5}
            st["open_orders"].append({"id": "O" + pair[:3], "pair": pair,
                                      "side": "buy", "qty": 1., "price": 3000.,
                                      "active_from": T0, "parent": None})
        def bars(touch):
            return [(T0 + n * 300, 3050., 3070., 2980. if n == touch else 3020., 3050.)
                    for n in range(12)]
        m = FakeMarket(candles5={"ZZZUSDC": bars(0), "AAAUSDC": bars(1)})
        run.run_cycle(st, [], m, T0 + H + 10)
        self.assertEqual([t["pair"] for t in st["closed_trades"]],
                         ["ZZZUSDC", "AAAUSDC"])
        self.assertEqual([t["fee_rate"] for t in st["closed_trades"]], [.004, .003])

    def test_api_error_never_falls_back_or_advances_cursors(self):
        st = run.new_state(T0 - 10)
        st["pairs"]["XBTUSDC"] = {
            "base": "BTC", "altname": "XBTUSDC", "pair_decimals": 2,
            "lot_decimals": 8, "ordermin": .00005, "costmin": .5}
        st["open_orders"] = [{"id": "O0017", "pair": "XBTUSDC",
                              "side": "buy", "qty": .01, "price": 65000,
                              "active_from": T0}]
        st["last_candle"]["XBTUSDC"] = T0 - H
        original = (dict(st["last_candle"]), dict(st["last_m5"]))
        m = FakeMarket(candles={"XBTUSDC": [
            (T0, 66000, 66500, 64900, 65000)]}, fail5=True)
        with mock.patch.object(run, "RETENTION_5M", -1):
            ev, fills, errors = run.replay_candles(st, m, T0 + H + 60)
        self.assertEqual((st["last_candle"], st["last_m5"]), original)
        self.assertFalse(fills)
        self.assertFalse(any(e["type"] == "execution_fallback" for e in ev))
        self.assertTrue(any("reprise au prochain cycle" in e for e in errors))
        # Nouvel essai : le moteur retrouve les bougies et peut les traiter.
        bars = [(T0 + i * 300, 66000, 66200, 64900 if i == 0 else 65100, 66000)
                for i in range(12)]
        recovered = FakeMarket(candles5={"XBTUSDC": bars})
        _, fills, _ = run.replay_candles(st, recovered, T0 + H + 60)
        self.assertEqual(len(fills), 1)
        self.assertEqual(st["last_candle"]["XBTUSDC"], T0)

    def test_partially_processed_hour_never_replayed_in_hourly(self):
        st = run.new_state(T0 - 10)
        st["pairs"]["XBTUSDC"] = {
            "base": "BTC", "altname": "XBTUSDC", "pair_decimals": 2,
            "lot_decimals": 8, "ordermin": .00005, "costmin": .5}
        st["last_candle"]["XBTUSDC"] = T0 - H
        st["last_m5"]["XBTUSDC"] = T0 + 300
        m = FakeMarket(candles={"XBTUSDC": [
            (T0, 66000, 66500, 64900, 65000)]})
        with mock.patch.object(run, "RETENTION_5M", -1):
            events, fills, errors = run.replay_candles(st, m, T0 + H + 60)
        self.assertEqual(st["last_m5"]["XBTUSDC"], T0 + 300)
        self.assertEqual(st["last_candle"]["XBTUSDC"], T0 - H)
        self.assertFalse(fills)
        self.assertFalse(any(e["type"] == "execution_fallback" for e in events))
        self.assertTrue(any("repli 1h interdit" in e for e in errors))

    def test_missing_recent_m5_waits_and_preserves_cursor(self):
        st = run.new_state(T0 - 10)
        st["last_candle"]["XBTUSDC"] = T0 - H
        m = FakeMarket(candles={"XBTUSDC": [
            (T0, 66000, 66500, 64900, 65000)]})
        events, fills, errors = run.replay_candles(st, m, T0 + H + 60)
        self.assertEqual(st["last_candle"]["XBTUSDC"], T0 - H)
        self.assertFalse(fills)
        self.assertFalse(any(e["type"] == "execution_fallback" for e in events))
        self.assertTrue(any("attente sans repli" in e for e in errors))

    @mock.patch.object(run, "RETENTION_5M", -1)
    def test_fallback_is_explicitly_logged(self):
        st = run.new_state(T0 - 10)
        d = decision("b", {"type": "place_limit", "pair": "XBTUSDC",
                            "side": "buy", "qty": .01, "price": 65000})
        run.run_cycle(st, [d], FakeMarket(), T0 - 10)
        ev, _, _ = run.run_cycle(st, [d], FakeMarket(candles={
            "XBTUSDC": [(T0, 66000, 66500, 64900, 65000)]}), T0 + H + 60)
        self.assertTrue(any(x["type"] == "execution_fallback" and
                            x["source"] == "hour" for x in ev))


if __name__ == "__main__":
    unittest.main()
