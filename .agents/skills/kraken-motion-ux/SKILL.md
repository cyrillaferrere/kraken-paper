---
name: kraken-motion-ux
description: Micro-interactions sobres, accessibles et fidèles aux données pour le dashboard statique Kraken Paper (PAPER).
---

# Kraken Motion UX — Kraken Paper

## Périmètre
Dépôt `cyrillaferrere/kraken-paper` ; `site/` en HTML, CSS et JavaScript natifs. `main` = production, `preprod` = intégration ; travailler sur `feature/*` ou `fix/*` puis PR vers `preprod`. Aucun déploiement de production sans accord explicite de Cyril. Ne jamais modifier `state/`, `decisions/` ni la logique du moteur dans un lot UX.

## Règles
1. Chaque animation doit expliquer une action, une navigation ou un état réel ; supprimer les effets décoratifs.
2. 120–160 ms pour hover, 120–180 ms pour pression, 180–240 ms pour menu, 160–220 ms pour panneau ; durées indicatives, jamais au détriment de la lecture.
3. Préférer CSS natif, `opacity` et `transform`. Ne pas ajouter de dépendance d'animation sans ADR et validation.
4. Respecter `prefers-reduced-motion: reduce` et la navigation clavier ; focus visible, pas de focus perdu lors de la fermeture du menu.
5. Ne jamais interpoler artificiellement un prix, un P&L, un ordre, un stop ou un signal. Afficher immédiatement les alertes et les données réellement reçues.
6. Ne pas rejouer les animations d'entrée à chaque polling ou changement de cours. Préserver la position du chandelier et son survol.
7. Préférer les primitives natives robustes et les fallbacks simples. Voir le skill `modern-web-guidance` adjacent.
8. Vérifier iPhone Safari (320, 375, 390, 430 px), Android, tablette (768 px), desktop, clavier, VoiceOver si possible, reduced motion, rafraîchissement en cours, absence de débordement horizontal.

## Tokens de référence
`--motion-fast: 140ms`, `--motion-normal: 200ms`, `--motion-panel: 240ms`, `--motion-stagger: 30ms`, `--ease-enter: cubic-bezier(.2,.8,.2,1)`, `--ease-standard: cubic-bezier(.4,0,.2,1)`. Réutiliser les tokens existants de `site/style.css`, sans les dupliquer.

## Critères de livraison
- Le dashboard reste pleinement utilisable sans animation.
- Le menu se ferme à Escape et au clic hors panneau, avec états ARIA synchronisés.
- Les changements de période et de crypto sont immédiatement compréhensibles.
- Les graphiques et KPI restent fidèles aux données réelles, même lors d'une erreur réseau.
- Tests automatisés + recette navigateur, CHANGELOG, RUNBOOK et HANDOFF mis à jour.
- Relecture Grok Bot avant fusion vers `preprod`.

Source initiale : skill Kraken Motion UX fourni par Cyril (Kraken Sim V3), adapté à l'architecture Kraken Paper le 14/11/2026.
