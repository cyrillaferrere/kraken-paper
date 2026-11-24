# ADR-44 — Niveaux explicites par crypto sur le graphique
Date : 24 novembre 2026. Statut : candidat préproduction.

## Décision
Conserver TradingView Lightweight Charts, le flux live, le curseur historique, les echelles existantes et le filtrage par paire. Enrichir les lignes par un langage couleur constant : cours blanc (bougies), PRU bleu, achats cyan, stop rouge, TP vert, conditionnel gris pointillé. Ajouter une légende HTML lisible indépendamment de la couleur, compacte sur mobile.

Un achat en attente n'active pas ses propres protections : seuls le survol ou le toucher du palier révèlent ses niveaux conditionnels. Une mise à jour différée de stop reste explicitement inactif jusqu'à activation. L'ensemble des TP restants utilise la numérotation historique tp_filled ; pas de recréation de données financières.

## Recette
Passer BTC/ETH/SOL, vérifier le changement d'echelle, le hover des chandelles pendant WebSocket, TF 1h initial, 320/390/768/1440 px, focus clavier et reduced-motion. Aucun changement moteur, état ou stratégie. Revue Grok Bot, CI et recette préprod avant fusion.
