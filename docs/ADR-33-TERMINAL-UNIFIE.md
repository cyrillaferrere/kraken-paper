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

## Optimisation du bloc d'analyse de marché (18/11/2026)
- Les six indicateurs existants restent visibles mais leur grille et ses espacements sont condensés, sans réduction excessive de leur lisibilité.
- La réglette visuelle conserve chaque niveau PAPER connu. La présentation détaillée devient un **tableau compact** à quatre colonnes : type de niveau, prix USDC, distance au cours et identifiant d'ordre cliquable. Les ordres distincts qui partagent un niveau de prix restent **distincts**, les protections d'un achat en attente restent conditionnelles.
- Suppression de la seconde liste de boutons « Niveaux sur le graphique », redondante avec le tableau. Les lignes et marqueurs déjà présents dans le chandelier ne sont pas retirés.
- La zone Activité récente présente trois événements explicitement associés à la paire ; l'historique complet reste accessible dans Activité & Bot. Les hauteurs de lignes et la zone de tableau sont stabilisées pour éviter les sauts durant les actualisations.
- Aucun impact moteur, calcul PAPER, état, stratégie ou API ; tests Node renforcés sur les identifiants d'ordre et niveaux partageant un prix.

## Raffinement de la barre Marchés v0.3.6 (18/11/2026)
- La zone haute du marché est structurée en cinq lignes fonctionnelles : (1) cours live de la paire + onglets temporels + boutons Ordres/Focus, (2) paires suivies à défilement horizontal, (3) fenêtre des bougies et informations de lecture, (4) OHLC de la bougie survolée, (5) MA20/MA50/RSI.
- Le bandeau de prix existant est **déplacé dans l'en-tête**, jamais cloné : identifiants DOM et flux websocket inchangés. Le titre de section reste accessible aux lecteurs d'écran mais ne redouble plus visuellement le prix. Le statut de fraîcheur conserve son nœud DOM (notamment pour les traitements de données), avec informations temporelles visibles dans la barre des bougies.
- La légende OHLC est rendue en deux lignes logiques et garde sa stabilité sur le survol; les boutons et sélections conservent leurs handlers. Mise en page adaptative à 1260/760 px, paires sur une ligne scrollable et effets de mouvement réduits.
- Aucune modification de simulation, stratégie, ordre, `state/`, `decisions/` ou version ; l'objectif est de réduire la hauteur d'en-tête sans dissimuler les informations de marché importantes.

## Correctif sélecteur d'intervalle (18/11/2026)
- L'ancien curseur `.seg-thumb` partageait la largeur du conteneur en six colonnes identiques. Le compactage a rendu les boutons intrinsèquement différents en largeur et déplacé visuellement le fond actif.
- Suppression du curseur HTML et de la position `--idx` ; le bouton de timeframe actif possède directement son fond, sa bordure et `aria-selected=true`. Les six intervalles, les contrôles clavier et la logique de récupération des bougies sont conservés.
- Le sélecteur s'adapte en affichage mobile via défilement horizontal, sans recouvrir les autres commandes. Un test d'intégration vérifie l'unicité de la sélection et l'absence du curseur flottant.
