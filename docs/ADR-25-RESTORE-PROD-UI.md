# ADR-25 — Reprendre le dashboard de production pour la préproduction

Date : 14 novembre 2026 · Statut : proposition à valider

## Contexte
Cyril abandonne les pistes Analog / Robotic et Graphite / Signal et demande de récupérer la production pour la redescendre en préproduction. `main` et `preprod` ont divergé : un merge aveugle risquerait de transférer les états de trading vivants ou de conserver l'interface expérimentale.

## Décision
- Créer une branche de restauration depuis `preprod`, et ne pas modifier directement `main` ou `preprod`.
- Restaurer exactement depuis `main` les fichiers d'interface `site/index.html`, `site/style.css`, `site/markets.js`, `site/navigation.js`, `site/chart-preferences.js`, `site/data-validators.js`.
- Retirer le module `site/workspace-tabs.js`, inexistant en production.
- Ne jamais toucher à `state/` ni `decisions/`. Ne pas modifier les règles d'exécution, le moteur ni la stratégie.
- Les fonctionnalités propres à l'interface préproduction sont abandonnées dans ce retour. Les tests associés doivent être revus, sans masquer les régressions.
- Faire une PR vers `preprod` avec recette et CI avant fusion ; `main` ne doit pas être modifiée.

## Risques
- Tests propres aux espaces de préproduction devenus incompatibles avec la version production.
- Le déploiement Netlify doit être contrôlé ; ne pas confondre retour au code production et retour à l'état vivant de trading.
