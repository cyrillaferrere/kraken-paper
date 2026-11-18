# ADR-33 — Réunion des quatre espaces financiers dans le Terminal v0.3.6 (18 novembre 2026)

## Contexte
L'ADR-31 définissait initialement cinq vues. La validation visuelle a montré que cockpit, marché, portefeuille et performance doivent être lus conjointement ; les séparer obligeait à changer continuellement de vue. **Cette décision remplace la disposition cinq vues de l'ADR-31 sans changer de version**, avant intégration en préproduction.

## Décision
Deux vues seulement dans la même SPA statique :
1. `#/terminal` rassemble, dans cet ordre, cockpit compact, chandelier et contexte marché, positions, ordres ouverts, historique performance et calendrier ; scanner en fin de page.
2. `#/activite` regroupe décisions Grok, chronologie, trades, journal et leçons.

La barre de navigation **interne et adhésive** du Terminal ouvre Synthèse, Marché, Ordres, Performance (`#/terminal#cockpit`, `#/terminal#market-card`, `#/terminal#orders-panel`, `#/terminal#performance-panel`). En mobile, ces quatre accès et Activité forment la barre inférieure ; à gauche sur desktop, seulement Terminal / Activité.

Conserver les mêmes nœuds DOM, IDs, caches et flux Kraken. Reprendre les anciens liens `#/accueil`, `#/marches`, `#/portefeuille` et `#/performance` vers le bon emplacement du Terminal. Les sélections d'ordres et les graphiques continuent de fonctionner. Aucun moteur, state ou décision modifié.

## Conséquences
La page Terminal est plus longue mais orientée par priorités et ancres rapides, sans quatre écrans séparés ; la performance du navigateur et les raccourcis doivent être testés à 390/768/1440 px. Aucun passage en preprod/prod dans cette PR en brouillon. Version **0.3.6** inchangée.

## Complément UX — exploiter l'espace sous le chandelier (18 novembre 2026)
- Les indicateurs de marché auparavant répétés dans la colonne droite sont repositionnés sous le graphique, dans une bande compacte de six mesures calculées par le scanner existant.
- La réglette **Niveaux de prix PAPER** n'invente aucun support/résistance. Elle affiche seulement le cours connu, le prix de revient des positions et les limites/stops/TP présents dans `state` en lecture seule. Les distances sont calculées par `(niveau/cours - 1) × 100`, uniquement avec un cours valide. Les TP et stops d'achats en attente sont étiquetés « si achat exécuté ». La réglette et les puces existantes donnent deux lectures complémentaires, sans créer d'ordres.
- La rubrique **Activité récente de la paire** reprend les **quatre derniers événements explicitement associés à cette paire** dans le journal public, par référence de paire dans l'événement, son ordre ou son trade. Une décision sans paire renseignée n'est pas imputée par déduction. Chaque ligne conduit à Activité & Bot / journal.
- Mise en page CSS responsive et lecture seule, aucun réseau ni calcul PAPER supplémentaires ; tests Node couvrant les niveaux, distances, situations indisponibles et filtres du journal.
