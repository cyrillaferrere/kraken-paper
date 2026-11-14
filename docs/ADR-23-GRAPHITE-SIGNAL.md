# ADR-23 — Direction Graphite / Signal pour le prototype Analog / Robotic

Date : 14 novembre 2026 · Statut : expérimentation sur PR #41, validation visuelle en attente

## Contexte
Le prototype Analog / Robotic est jugé trop terne, monochrome et industriel ; les caractères monospace généralisés et les panneaux similaires nuisent à la lisibilité. Cyril retient la direction B, Graphite / Signal.

## Décision
- Conserver la branche `feature/analog-robotic-concept` et la surcouche réversible `site/analog.css`, sans modifier `main` ni `preprod`.
- Palette : graphite `#101317`, panneau `#1b2228`, vert signal `#b6ff52`, corail `#ff7769`, turquoise `#7dd8d4`, ambre `#ffc475`. Les couleurs positives/négatives restent sémantiques ; les avertissements ne sont pas verts.
- Hiérarchie : KPI principal mis en avant, navigation lisible, panneaux moins répétitifs, chandelier visuellement prioritaire.
- Typographie : sans-serif système pour les libellés, montants et contrôles ; monospace réservé aux informations techniques et légendes du graphique.
- `site/markets.js` : modification exclusive des constantes de couleur des séries. Pas de modification de la logique OHLC, des prix, du risque ou des ordres.
- Aucune police externe, dépendance, animation de gain ni valeur fictive ajoutée. Respect du focus clavier et du mouvement réduit.
- `VERSION` demeure `0.3.1` tant que la direction n'est pas validée.

## Validation
- Tests Node/Python, quality-gates et guard-state sur la PR.
- Recette desktop/mobile sur la Deploy Preview Netlify, contraste, focus, bargraphe d'exposition et interactions du chandelier.
- Aucune fusion ni publication production avant validation explicite de Cyril. La revue Grok Bot est attendue avant intégration.
