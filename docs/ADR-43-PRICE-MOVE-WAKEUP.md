# ADR-43 — Réveil Grok Bot sur variation des cours
Date : 24 novembre 2026. Statut : candidat préproduction, pas de production.

## Objectif
Notifier Grok Bot après une variation significative d'un actif détenu ou ciblé par un achat en attente, sans créer de décision de trading automatique.

## Seuils
BTC/ETH : 5 % absolus ; autres actifs : 7 % absolus ; délai entre réveils : 6 h par paire. Les seuils sont paramétrables dans la fonction de calcul ; la référence est mémorisée dans le portefeuille, jamais dans un secret.

## Traitement
Après le snapshot, détecter les écarts avec la référence persistante et écrire les événements price_move au journal. Le webhook existant est appelé seulement après sauvegarde et push réussi, dans l'étape GitHub Actions déjà présente. Les payloads price_move contiennent type, crypto, pair, change_pct et price. Les alertes restent PAPER et n'engendrent aucun ordre.

Une décision Grok identifiée remet la référence à jour. Un heartbeat sans décision doit être traité comme une session si sa date est fournie à la fonction par une évolution complémentaire ; ne pas assimiler un simple rafraîchissement du navigateur à une session.

## Limites / recette
Les snapshots OHLC/ticker publics ne garantissent pas tous les mouvements intracycle. Aucune requête réelle de webhook dans les tests. La protection de l'état vivant est maintenue et les secrets restent uniquement dans GitHub Actions. Revue Grok Bot, CI et contrôle de persistance exigés avant toute intégration.
