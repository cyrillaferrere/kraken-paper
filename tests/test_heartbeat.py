"""Heartbeats Grok: aucun ordre, refus ou effet sur l'etat PAPER."""
import copy
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "engine"))
import run  # noqa: E402


class HeartbeatTests(unittest.TestCase):
    def setUp(self):
        self.item = {
            "id": "heartbeat-20261118-030900",
            "type": "heartbeat",
            "timestamp": "2026-11-18T03:09:00+01:00",
            "note": "Session Grok : analyse effectuee, aucun changement.",
            "actions": [],
        }

    def test_heartbeat_accepted_by_loader(self):
        with tempfile.TemporaryDirectory() as directory:
            with open(os.path.join(directory, "2026-11-18-0309-heartbeat.json"), "w", encoding="utf-8") as f:
                json.dump(self.item, f)
            items, warnings = run.load_decisions(directory)
        self.assertEqual(warnings, [])
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["type"], "heartbeat")
        self.assertEqual(items[0]["_file"], "2026-11-18-0309-heartbeat.json")

    def test_heartbeat_is_entirely_ignored_by_engine(self):
        state = run.new_state(1_800_000_000)
        state["last_decision"] = {"id": "decision-before", "timestamp": "2026-11-17T22:09:00+01:00"}
        before = copy.deepcopy(state)
        events, fills, errors = run.apply_decisions(state, [self.item], object(), 1_800_000_500)
        self.assertEqual((events, fills, errors), ([], [], []))
        self.assertEqual(state, before)
        self.assertEqual(state["open_orders"], [])
        self.assertEqual(state["processed_decisions"], [])
        self.assertEqual(state["last_decision"], before["last_decision"])

    def test_malformed_heartbeat_warned_not_rejected_as_trade(self):
        invalid = dict(self.item, actions=[{"type": "market_buy"}])
        with tempfile.TemporaryDirectory() as directory:
            with open(os.path.join(directory, "bad-heartbeat.json"), "w", encoding="utf-8") as f:
                json.dump(invalid, f)
            items, warnings = run.load_decisions(directory)
        self.assertEqual(items, [])
        self.assertEqual(len(warnings), 1)
        self.assertIn("actions doit etre []", warnings[0])

    def test_no_timestamp_timezone_is_not_accepted(self):
        invalid = dict(self.item, timestamp="2026-11-18T03:09:00")
        with tempfile.TemporaryDirectory() as directory:
            with open(os.path.join(directory, "bad-heartbeat.json"), "w", encoding="utf-8") as f:
                json.dump(invalid, f)
            items, warnings = run.load_decisions(directory)
        self.assertEqual(items, [])
        self.assertIn("timestamp ISO 8601", warnings[0])


if __name__ == "__main__":
    unittest.main()
