# ADR-24 — Trading Workspace × Minimal Precision

Date : 14 novembre 2026 · Statut : prototype PR #41, non validé pour intégration

## Contexte
Le retour utilisateur rejette les liserés verts sur les blocs sélectionnés, l'incohérence entre navigation et contenu et une hiérarchie insuffisante. Une simple variation de couleurs ne répond pas au besoin.

## Décisions
- Conserver la PR #41 sur `feature/analog-robotic-concept`. Ne toucher ni à `preprod` ni à `main`.
- Ajouter `site/workspace-premium.css` comme couche réversible après `analog.css`.
- Utiliser le graphite et des surfaces continues, sans liseré gauche de sélection. Le turquoise est discret et réservé à l'information positive ou à des accents fonctionnels, le corail aux pertes.
- Sur desktop, un seul système de navigation latérale ; masquer les onglets horizontaux redondants. Sur mobile/tablette, les onglets restent accessibles.
- La vue générale privilégie : titre de page, KPI en bandeau sans quatre tuiles, chandelier grand format, puis exposition et passages moteur.
- Conserver les espaces existants (vue générale, marchés, positions/ordres, historique) et les huit ancres du menu, sans perdre les tableaux, les décisions et les journaux.
- Synchroniser le titre contextuel et l'état actif du menu avec le hash ; ne pas modifier les données, ordres, frais, signaux, prix, moteur ni les sources.
- Préserver le fonctionnement en lecture seule, la navigation clavier, le focus visible et reduced-motion.

## Conséquences et contrôles
- Les feuilles antérieures restent présentes pour comparaison et retour arrière. La nouvelle feuille domine la cascade CSS sans supprimer les fonctions.
- Recette des 8 liens de navigation et 4 espaces sur desktop/mobile, tests de régression, CI, contrôle de la lisibilité et du chandelier.
- Revue visuelle Cyril puis Grok Bot avant toute fusion ; aucune publication production sans accord explicite.
