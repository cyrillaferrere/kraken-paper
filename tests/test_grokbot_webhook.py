"""Tests du webhook Grok Bot : groupement, absence de fill et panne réseau."""
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import notify_grokbot  # noqa: E402


class GrokBotWebhookTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.journal = os.path.join(self.tmp.name, "journal.jsonl")
        self.prefix = b'{"time":"2026-11-15T15:00:00+01:00","type":"start"}\n'
        with open(self.journal, "wb") as f:
            f.write(self.prefix)

    def tearDown(self):
        self.tmp.cleanup()

    def append(self, event):
        with open(self.journal, "ab") as f:
            f.write(json.dumps(event).encode("utf-8") + b"\n")

    def fill(self, trade_id, order_id, reason="limit"):
        self.append({
            "time": "2026-11-15T16:07:00+01:00",
            "type": "fill",
            "trade": {
                "id": trade_id, "order_id": order_id, "pair": "XBTUSDC",
                "side": "buy", "price": 65000.0, "reason": reason,
            },
        })

    def test_no_fill_means_no_request(self):
        self.append({"time": "2026-11-15T16:07:00+01:00", "type": "decision"})
        with patch.object(notify_grokbot.urllib.request, "urlopen") as post:
            sent = notify_grokbot.send_cycle_webhook(self.journal, len(self.prefix), "https://example.test/hook", "key")
        self.assertFalse(sent)
        post.assert_not_called()

    def test_multiple_fills_are_sent_in_one_json_post(self):
        self.fill("T0001", "O0001")
        self.fill("T0002", "O0002", "stop_loss")
        captured = {}

        class Response:
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False

        def fake_post(request, timeout):
            captured["request"] = request
            captured["timeout"] = timeout
            return Response()

        with patch.object(notify_grokbot.urllib.request, "urlopen", side_effect=fake_post) as post:
            sent = notify_grokbot.send_cycle_webhook(
                self.journal, len(self.prefix), "https://example.test/hook", "secret-key"
            )

        self.assertTrue(sent)
        post.assert_called_once()
        request = captured["request"]
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("Authorization"), "Bearer secret-key")
        self.assertEqual(request.get_header("Content-type"), "application/json")
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(payload["cycle_time"], "2026-11-15T16:07:00+01:00")
        self.assertEqual([t["id"] for t in payload["trades"]], ["T0001", "T0002"])
        self.assertEqual(payload["trades"][1]["order"], "O0002")
        self.assertEqual(payload["trades"][1]["reason"], "stop_loss")

    def test_network_error_is_swallowed(self):
        self.fill("T0001", "O0001")
        with patch.object(notify_grokbot.urllib.request, "urlopen", side_effect=OSError("offline")) as post:
            sent = notify_grokbot.send_cycle_webhook(
                self.journal, len(self.prefix), "https://example.test/hook", "secret-key"
            )
        self.assertFalse(sent)
        post.assert_called_once()

    def test_missing_credentials_means_no_request(self):
        self.fill("T0001", "O0001")
        with patch.object(notify_grokbot.urllib.request, "urlopen") as post:
            sent = notify_grokbot.send_cycle_webhook(self.journal, len(self.prefix), "", "secret-key")
        self.assertFalse(sent)
        post.assert_not_called()


if __name__ == "__main__":
    unittest.main()
