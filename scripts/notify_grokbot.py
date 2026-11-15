#!/usr/bin/env python3
"""Envoie en un seul webhook les exécutions ajoutées au journal pendant un cycle."""

import json
import os
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


def notify_cycle(journal_path, offset, url, key):
    """Retourne un statut explicite, sans jamais exposer l'URL ni la clé."""
    cycle_time, trades = cycle_trades(journal_path, offset)
    if not trades:
        return "aucune exécution"
    if not url or not key:
        return "échec d'envoi"

    payload = json.dumps(
        {"cycle_time": cycle_time, "trades": trades},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    try:
        request = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=10):
            pass
    except Exception:
        # Le webhook est externe au moteur : son indisponibilité ne bloque pas le cycle.
        return "échec d'envoi"
    return "webhook envoyé"


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
