#!/usr/bin/env python3
"""Envoie en un seul webhook les exécutions ajoutées au journal pendant un cycle."""

import json
import os
import sys
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
        })
    return cycle_time, trades


def send_cycle_webhook(journal_path, offset, url, key):
    """Envoie un POST groupé. Retourne False sans erreur si rien n'est à notifier."""
    cycle_time, trades = cycle_trades(journal_path, offset)
    if not trades or not url or not key:
        return False

    payload = json.dumps(
        {"cycle_time": cycle_time, "trades": trades},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10):
            pass
    except Exception:
        # Le webhook est externe au moteur : son indisponibilité ne doit pas bloquer le cycle.
        return False
    return True


def main():
    journal_path = os.path.join("state", "journal.jsonl")
    offset = os.environ.get("JOURNAL_OFFSET", "0")
    send_cycle_webhook(
        journal_path,
        offset,
        os.environ.get("GROKBOT_WEBHOOK_URL", ""),
        os.environ.get("GROKBOT_WEBHOOK_KEY", ""),
    )


if __name__ == "__main__":
    main()
