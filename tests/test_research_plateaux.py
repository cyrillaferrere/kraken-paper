"""Offline tests for the isolated Kraken plateau research."""
import importlib.util
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "research_plateaux.py"
spec = importlib.util.spec_from_file_location("research_plateaux", SCRIPT)
study = importlib.util.module_from_spec(spec)
spec.loader.exec_module(study)


class StudyTests(unittest.TestCase):
    def test_parser_rejects_bad_candle(self):
        sample = study.read_candles(b"1700000000,10,12,9,11,30,2\n", "test")
        self.assertEqual(sample[1700000000][4], 11.0)
        with self.assertRaises(ValueError):
            study.read_candles(b"1700000000,10,8,9,11,30,2\n", "bad")

    def test_rebound_same_bar_is_failure(self):
        b = [(i * 14400, 100, 101, 99, 100, 1, 10) for i in range(20)]
        b[1] = (14400, 100, 103, 97, 100, 1, 10)
        self.assertEqual(study.outcome(b, {"i": 0, "atr": 2}, 240), "down")

    def test_missing_candle_rejected(self):
        b = [(i * 14400, 100, 100.5, 99.5, 100, 1, 1) for i in range(20)]
        b[2] = (3 * 14400, 100, 101, 99, 100, 1, 1)
        self.assertEqual(study.outcome(b, {"i": 0, "atr": 2}, 240), "missing")

    def test_trade_fee_and_fill(self):
        b = [(i * 14400, 100, 100, 100, 100, 1, 1) for i in range(20)]
        b[1] = (14400, 100, 101, 99.5, 100, 1, 1)
        b[2] = (28800, 100, 103, 100, 102, 1, 1)
        result = study.trade(b, {"i": 0, "atr": 2, "ts": 0}, 240)
        self.assertEqual(result["reason"], "target")
        self.assertAlmostEqual(result["net"], 102.5 * .999 * .992 / (99.5 * 1.004) - 1)

    def test_zip_usdc_selection_and_sha(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "Kraken_OHLCVT_Full.zip"
            start = 1700000000
            csv = "".join(f"{start + i * 14400},100,101,99,100,10,1\n" for i in range(1100 * 6 + 1))
            with zipfile.ZipFile(p, "w", compression=zipfile.ZIP_DEFLATED) as z:
                z.writestr("spot/XBTUSDC_240.csv", csv)
            quote, bars, coverage, provenance = study.gather([p], "BTC", 240)
            self.assertEqual((quote, len(bars), coverage), ("USDC", 6601, 1.0))
            self.assertEqual(len(provenance[0]["archive_sha256"]), 64)

    def test_features_do_not_see_future(self):
        b = [(1700000000 + i * 14400, 100 + .0005 * i, 101 + .0005 * i,
              99 + .0005 * i, 100 + .0005 * i, 10, 1) for i in range(1100)]
        a = study.build_features(b, 240)
        v = list(b)
        for i in range(1000, len(v)):
            t, o, hi, lo, c, vol, n = v[i]
            v[i] = (t, o * 2, hi * 2, lo * 2, c * 2, vol, n)
        others = study.build_features(v, 240)
        self.assertEqual([f for f in a if f["i"] < 999], [f for f in others if f["i"] < 999])


if __name__ == "__main__":
    unittest.main()
