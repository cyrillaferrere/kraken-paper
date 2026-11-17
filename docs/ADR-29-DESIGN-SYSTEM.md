## ADR-29 : Design System de précision pour Kraken Paper v0.3.4 (17/11/2026)
- **Contexte** : rendre le dashboard aussi réactif et cohérent qu'une bonne application native, tout en conservant sa densité financière et ses conventions de terminal de trading.
- **Décision** : une couche CSS additive `site/design-system.css`, chargée après `site/style.css`, harmonise le focus clavier, la réponse tactile, les métriques tabulaires et les espacements mobiles. Pas de nouvelle dépendance, d'animation à ressort sur les prix ou de refonte du DOM.
- **Animation** : 140–160 ms pour les interactions simples ; aucune interpolation de données, de chandeliers, de P&L ou d'alertes ; les animations non essentielles disparaissent avec `prefers-reduced-motion`.
- **Conséquences** : l'effet est limité au front-end ; validation visuelle bureau/mobile et tests automatisés nécessaires avant fusion dans `preprod`. Aucun effet sur le moteur, `state/`, `decisions/` ou `main`.
