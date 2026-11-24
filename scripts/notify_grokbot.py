#!/usr/bin/env python3
"""Envoie en un seul webhook les exécutions ajoutées au journal pendant un cycle."""

import json
import os
import time
import urllib.request


def cycle_trades(journal_path, offset):
    """Retourne l'heure du cycle et les trades ajoutés après l'offset."""
    try:
        with open(journal_path, "rb") as journal:
            journal.seek(max(0, int(offset)))
            chunk = journal.read()
    except OSError:
        return None, []

    cycle_time = None
    trades = []
    for raw in chunk.splitlines():
        try:
            event = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
        if event.get("type") != "fill" or not isinstance(event.get("trade"), dict):
            continue
        trade = event["trade"]
        if cycle_time is None:
            cycle_time = event.get("time")
        trades.append({
            "id": trade.get("id"),
            "order": trade.get("order_id"),
            "pair": trade.get("pair"),
            "side": trade.get("side"),
            "price": trade.get("price"),
            "reason": trade.get("reason"),
            "compartment": trade.get("compartment", "medium"),
            **{k: trade[k] for k in ("exit_merge", "breakeven_skipped") if k in trade},
        })
    return cycle_time, trades


def notify_cycle(journal_path, offset, url, key):
    """Retourne un statut explicite, sans jamais exposer l'URL ni la clé."""
    cycle_time, trades = cycle_trades(journal_path, offset)
    alerts = []
    warnings = []
    cycle_time = None
    seen_conflicts = set()
    try:
        with open(journal_path, "rb") as journal:
            journal.seek(max(0, int(offset)))
            for line in journal:
                try:
                    item = json.loads(line)
                except (ValueError, UnicodeDecodeError):
                    continue
                if cycle_time is None:
                    cycle_time = item.get("time")
                if item.get("type") in ("exit_merge_skipped", "unprotected_qty", "breakeven_rearmed"):
                    warnings.append(item)
                if item.get("type") == "cross_compartment_conflict":
                    key = (item.get("pair"), item.get("stop_order"), item.get("buy_order"))
                    if key not in seen_conflicts:
                        seen_conflicts.add(key)
                        warnings.append(item)
                if item.get("type") == "price_move":
                    alerts.append({k: item[k] for k in
                                   ("type", "crypto", "pair", "change_pct", "price")
                                   if k in item})
    except OSError:
        pass
    if not trades and not alerts and not warnings:
        return "aucune exécution"
    if not url or not key:
        return "échec d'envoi"

    payload_body = {"version": 1, "cycle_time": cycle_time, "trades": trades,
                    "price_moves": alerts, "warnings": warnings}
    payload = json.dumps(
        payload_body,
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    for attempt in range(2):
        try:
            request = urllib.request.Request(
                url, data=payload,
                headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
                method="POST")
            with urllib.request.urlopen(request, timeout=10):
                pass
            return "webhook envoyé"
        except Exception:
            if attempt == 0:
                time.sleep(5)
    return "échec d'envoi"


def main():
    journal_path = os.path.join("state", "journal.jsonl")
    status = notify_cycle(
        journal_path,
        os.environ.get("JOURNAL_OFFSET", "0"),
        os.environ.get("GROKBOT_WEBHOOK_URL", ""),
        os.environ.get("GROKBOT_WEBHOOK_KEY", ""),
    )
    # Statut volontairement limité à trois libellés, sans données sensibles.
    print(status)


if __name__ == "__main__":
    main()
