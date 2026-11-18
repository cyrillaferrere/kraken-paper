# ADR-31 — Navigation SPA légère en cinq vues (17 novembre 2026)

**Disposition à cinq vues remplacée par ADR-33 le 18/11/2026, avant la préproduction.** La décision de conserver une SPA sans rechargement reste applicable.

## Contexte
Le dashboard v0.3.5 fonctionne comme une seule longue page avec des ancres. Les sections marché, portefeuille, performance et décisions sont nombreuses, ce qui impose une navigation verticale excessive, particulièrement sur mobile. L'objectif est de séparer les espaces **sans casser le flux Kraken ni le moteur PAPER**.

## Décision
- Créer `feature/v0.3.6` sur la base de `feature/v0.3.5` ; branche de travail distincte, la `preprod` v0.3.4 reste intacte. Une PR empilée sera ouverte vers `feature/v0.3.5`.
- Conserver **un seul document HTML, les mêmes nœuds DOM et toutes les sources de données**, avec un routeur statique `site/spa-router.js` qui déplace (ne clone pas) les sections existantes vers cinq conteneurs `app-view`.
- Vues : `#/accueil` (cockpit/risque), `#/marches` (chandelier, carnet et scanner), `#/portefeuille` (positions et ordres), `#/performance` (graphe, calendrier), `#/activite` (décisions, exécutions, journal et leçons).
- Préserver l'accès aux identifiants/ancres historiques : `#market-card`, `#orders-panel`, `#dec-h` etc. Les liens directs inter-vues sont traduits en chemins hash `#/vue#cible`, sans serveur de routage ni rechargement.
- Navigation desktop latérale, rétractable via la préférence existante ; navigation mobile à 4 raccourcis plus un menu « Plus » vers Activité. La vue active a `aria-current="page"`. La touche Échap ferme les menus ; focus sur le titre de vue à la navigation.
- Redimensionner le graphique chandelier lorsque Marchés redevient visible ; redessiner uniquement le SVG de performance lorsque la vue devient visible. Aucun WebSocket ou fetch additionnel n'est lancé par la navigation. Les données/états graphiques et filtres restent en mémoire entre les vues.
- Les liens depuis ordres, positions, ruban de prix et timeline ouvrent automatiquement les vues correspondantes avant le défilement vers la cible.
- CSS additive `site/spa-v036.css` pour contenu, affichage exclusif des vues, respect des préférences de réduction du mouvement et lisibilité tactile.

## Conséquences et vérifications
- Aucun changement de stratégie, moteur, `state/`, `decisions/`, frais ou calcul PAPER.
- Navigation sans rechargement mais toujours avec URLs partageables et touches retour/avant du navigateur.
- Les nœuds DOM restent uniques pour ne pas perdre les observateurs, listeners et caches des graphiques.
- Tests du routeur et de rétrocompatibilité des ancres, puis tests Node/Python et inspection manuelle des vues, scroll, écrans 390/768/1440 px, clavier et reprise après changement de paire.
- Ne pas fusionner la PR dans la branche parente ni dans `preprod` sans GO explicite ; `main`/production intouchables.
