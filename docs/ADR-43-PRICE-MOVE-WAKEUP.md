# ADR-43 — Réveil Grok Bot sur variation des cours
Date : 24 novembre 2026. Statut : candidat préproduction, pas de production.

## Objectif
Notifier Grok Bot après une variation significative d'un actif détenu ou ciblé par un achat en attente, sans créer de décision de trading automatique.

## Seuils
BTC/ETH : 5 % absolus ; autres actifs : 7 % absolus ; délai entre réveils : 6 h par paire. Les seuils sont paramétrables dans la fonction de calcul ; la référence est mémorisée dans le portefeuille, jamais dans un secret.

## Traitement
Après le snapshot, détecter les écarts avec la référence persistante et écrire les événements price_move au journal. Le webhook existant est appelé seulement après sauvegarde et push réussi, dans l'étape GitHub Actions déjà présente. Les payloads price_move contiennent type, crypto, pair, change_pct et price. Les alertes restent PAPER et n'engendrent aucun ordre.

Une décision traitée ou un heartbeat valide lu via `decisions/` identifie une nouvelle session. Le moteur rebase le cours de référence et efface `last_wakeup_ts` : le délai est remis à zéro. Pendant les six heures, une variation absolue au moins égale à deux fois le seuil contourne le délai ; en dessous de ce double seuil, aucun réveil pendant le délai. Le navigateur ne constitue pas une session.

## Limites / recette
Les snapshots OHLC/ticker publics ne garantissent pas tous les mouvements intracycle. Aucune requête réelle de webhook dans les tests. La protection de l'état vivant est maintenue et les secrets restent uniquement dans GitHub Actions. Revue Grok Bot, CI et contrôle de persistance exigés avant toute intégration.
