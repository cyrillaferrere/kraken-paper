## [0.3.3] — préproduction uniquement
- Vue générale : cockpit financier haute densité, P&L réalisé/latent, performances 24 h/7 j, drawdown, frais relatifs, allocation en USDC et %, risques actifs/conditionnels en USDC et % ; aucun changement des règles PAPER.
- Flux Kraken WebSocket v2 : ticker de la paire sélectionnée et bougie OHLC en formation, mises à jour sans réinitialiser le graphique ; repli REST conservé. Moteur PAPER inchangé.
- Marchés : le cours de la paire sélectionnée est actualisé lors de chaque mise à jour d'état/prix.
- Marchés : les TP et stops d'un achat limite non exécuté sont masqués par défaut ; aperçu gris conditionnel au survol/toucher de la ligne d'achat.
- Les sorties actives des positions et des ordres de vente restent inchangées ; tests fonctionnels dédiés.
- Aucun changement de moteur, de stratégie ou de données PAPER.

## [0.3.2] — candidat de publication (non publié en production)
- ADR-28 : circuit de publication à GO unique, sans deuxième approbation GitHub ; contrôle de branche et SHA à vérifier avant activation.
- `VERSION` passe à `0.3.2` ; le build Netlify est désormais déclenché aussi lors d'un changement de version.
- Revue Grok Bot favorable à la préproduction pour PR #54 ; recette préprod validée par Cyril le 15/11/2026.
- Préparation v0.3.2 (préproduction uniquement)
- Synchronisation sélective des procédures et fichiers de publication de `main` vers `preprod`, sans `state/` ni `decisions/`.
- Chandelier : le stop réellement remonté au niveau d'entrée après TP1 est explicitement libellé ; aucune anticipation ni changement du niveau exécuté.
- Bandeau de sorties différées : conservation du nouveau stop, des objectifs TP et du stop historique actif, avec tests de non-régression.
- RUNBOOK : procédure de publication humaine et résolution du verrou Netlify « Auto Publishing Locked » ; HANDOFF et ADR réconciliés.
- Aucun changement moteur, stratégie, frais ou décision PAPER. PR vers `preprod`, revue Grok Bot avant fusion ; aucun déploiement production autorisé.

## [0.3.1] - 2026-11-14 (publié en production)
- Publication groupée des fonctionnalités développées en v0.3.0 et des finitions v0.3.1.
- Moteur PAPER : objectifs de vente fractionnés TP1/TP2, stop sur le reliquat, break-even après TP1, action `update_exits` et validation des stops obligatoires.
- Interface : cours live de la paire sélectionnée, visibilité des sorties différées, nouveau stop, fractions des TP et journal des ordres enrichi.
- Tests de compatibilité des ordres historiques, du stop et des TP ; 51 tests Python, 84 tests site et 6 tests functions sur le candidat isolé.
- ADR-26 et ADR-27 ; recette utilisateur de préproduction validée. **Publié après validation de Cyril.** Publication contrôlée par GitHub (ADR-27).

## [Unreleased] — Retour au dashboard de production en préproduction
- Restaurer `site/index.html`, `site/style.css`, `site/markets.js`, `site/navigation.js`, `site/chart-preferences.js` et `site/data-validators.js` depuis `main` ; retirer `site/workspace-tabs.js` absent de la production.
- Préparation sur `fix/restore-prod-ui-preprod` uniquement ; pas de modification de `state/`, `decisions/`, du moteur ou de `main`.
- Validation des tests et recette visuelle requises avant fusion dans `preprod` ; ADR-25.

## [Unreleased] — v0.3.1 Nocturne Signal (préproduction)
- Identité graphique graphite et jade, monogramme K/, surfaces plates, graphiques harmonisés, navigation desktop sans doublon.
- Version de préproduction `VERSION=0.3.1`, source du bandeau de build Netlify (`version.json`). Voir ADR-21.
- Aucun changement de calcul, d'ordres, de stratégie ou de données PAPER.

## [Unreleased] — v0.3.0 UX (proposition)
- Navigation du dashboard en quatre rubriques, synthèse mobile plus compacte et conservation des données en direct. Voir ADR-20 et PR #37.

## v0.2.2 — lot d'intégration UX (PR #28–#35)
- Référentiels modern-web-guidance et kraken-motion-ux, checklist UX.
- Navigation mobile : fermeture et restitution du focus, tests unitaires.
- Chandelier : aide textuelle, préférences normalisées, tests de régression et commandes plus lisibles.
- Ordres et scanner : meilleure hiérarchie des états visuels ; cibles tactiles et focus renforcés.
- Les changements concernent uniquement la présentation du dashboard ; aucun moteur, état ou décision modifié.
- Validation : `node --test tests/site/*.test.js`, `python -m unittest -v`, contrôle CI et recette sur Safari iPhone / desktop, sans mouvement imposé.
- Intégration de remplacement des PR #28–#35 : ne pas les fusionner à nouveau. Aucun déploiement de production autorisé.

# Changelog

- Correction complémentaire mobile : neutralisation des anciennes largeurs minimales tablette (620 px Positions, 760 px Marqueurs) sous 680 px, avec sélecteurs plus spécifiques.

- Correctif UX mobile : les fiches des tableaux sont contraintes à la largeur du panneau, évitant le débordement constaté sur iPhone dans Positions.

## UX mobile — refonte groupée v0.2.1 (préproduction)
- Les quatre tableaux denses (ordres, positions, trades et marqueurs) deviennent des fiches compactes sous 680 px, sans dégrader les tableaux desktop.
- Les ordres affichent en priorité crypto, sens, montant et distance ; prix, stop, objectif et risque restent accessibles par « Détails ».
- Filtres, indicateurs, graphiques, journal et espaces tactiles adaptés aux petits écrans. Aucune modification du moteur PAPER.

## Intégration dashboard v0.2.1 — cohérence de sélection
- Correction du chandelier lorsque la paire sélectionnée disparaît après une actualisation du portefeuille : retour au BTC et chargement effectif de ses bougies.
- Tests d'intégration des dépendances JS, de la publication atomique des données, des contrôles du graphique et du scanner.

## Scanner — suivi des données et récupération automatique (préproduction v0.2.1)
- Progression fondée sur les cryptos réellement analysées, plutôt que le nombre de lignes déjà affichées.
- Message distinct pour les cryptos dont les données sont indisponibles ; fin de l'indicateur de chargement à la fin de la vague.
- Nouvelle position ou nouvel ordre sur une paire non suivie : mise à jour immédiate du scanner, sans attendre trois minutes.

## Préproduction v0.2.1 — scanner de marchés optimisé
- Suppression des rafales de lectures concurrentes lors des actualisations : un seul scanner actif, une demande de reprise regroupée.
- BTC calculé en premier, puis au plus deux actifs simultanément ; rendu des marqueurs groupé par quatre résultats pour limiter les reflows.
- Tests de non-régression du scanner ; aucun changement de stratégie ou de moteur.

## Préproduction v0.2.1 — session de graphique et rafraîchissement explicite
- Mémorisation dans l'onglet des choix de crypto, timeframe et 60/120/240 bougies, avec valeurs validées et repli si la paire n'est plus disponible.
- Bouton Actualiser pour relire les chandeliers Kraken et heure de dernière lecture réussie.
- Tests des préférences, des échecs de stockage et de la barre d'outils ; ADR-20.

## Préproduction v0.2.1 — fiabilité du chandelier
- Les réponses OHLC tardives ne peuvent plus écraser la paire ou l'unité de temps actuellement sélectionnée.
- Validation stricte des bougies Kraken avant leur mise en cache : horodatage, prix, volumes et chronologie.
- Conservation du dernier graphique valide en cas d'erreur réseau ou de données.
- Tests de non-régression et ADR-19.

## Préproduction v0.2.1 — garde-fous des données publiques
- Validation stricte des historiques equity.csv et journal.jsonl : pas de suppression silencieuse d'événements corrompus.
- Prix Kraken non positifs ou non numériques rejetés, statut partiel explicite et repli sur les prix du cycle moteur.
- Tests exécutables et ADR-18.

## Stabilisation des historiques longs (préproduction, v0.2.1)
- Rendu SVG plafonné selon la largeur, extrema et données manquantes préservés ; aucun cycle modifié.
- Tests de charge sur 100 000 points et ADR-17.


> Stabilisation du rafraîchissement UX v0.2.1 : une seule lecture d'état à la fois, validation et publication groupée portefeuille/equity/journal, nouvelle tentative après snapshot invalide, réponses de prix hors ordre ignorées, journal/trades/courbe reconstruits uniquement lors d'un nouveau snapshot (pas toutes les 15 s). Aucun changement du moteur PAPER.

> Explorateur d'historique UX v0.2.1 : courbe 24 h, 7 j, 30 j, 90 j, 6 mois (180 j), 1 an (365 j), tout; journal 40/100/250/tous les événements disponibles, avec indication explicite de la profondeur chargée et des filtres sur les entrées visibles. Aucun événement ni point de courbe inventé, lecture seule.

> Itération de stabilisation UX v0.2.1 : déconnexion temporaire et reconnexion garantie du MutationObserver pendant le tri DOM (sans masquer les nouvelles données), étiquette du chandelier fondée sur le nombre réel de bougies chargées, tests de non-régression et maintien de la navigation/du survol. Aucun changement de simulation.

> Durcissement UX v0.2.1 : correction du tri P&L négatif (signe moins typographique), protection contre la rétroaction MutationObserver lors des tris, accès direct Performance/Historique depuis la navigation, nom accessible du graphique portefeuille, tests d'intégration HTML/navigation/labels/scripts et non-régression du tri.

> Lot UX v0.2.1 performance et journal : périodes de courbe 24 h / 7 j / 30 j / tout (cycles réels uniquement), compteur de cycles, journal filtrable par texte et type d'événement, remise à zéro, tests Node et ergonomie mobile. Aucune modification moteur, stratégie ou données PAPER.

> Lot UX portefeuille v0.2.1 : tri des positions (valeur, P&L signé, nom), recherche crypto, recherche et filtre achat/vente dans l'historique des trades, compteurs et réinitialisation, affichage mobile. Opérations uniquement visuelles, aucun changement moteur, stratégie, état ou décisions.

> Lot graphique UX v0.2.1 : choix de fenêtre 60/120/240 bougies, recentrage manuel, lecture mobile améliorée, conservation du survol et de la vue pendant les rafraîchissements. Aucun changement de données, moteur ou stratégie.

> Correctif UX 0.2.1 : remise à zéro des filtres en un clic, message explicite sans résultat, tests Node automatisés sur les filtres d'ordres et de marché. Aucun changement moteur.

> Complément en validation : filtres de recherche et de tendance sur les marqueurs, filtres d'ordres par sens et crypto, améliorations mobiles du graphique et des tableaux. Filtres uniquement visuels, sans modification des données.
>
> Compléments UX 0.2.1 : navigation latérale rétractable publiée en préproduction (`0e744d8`) ; refonte de lisibilité des tableaux Positions et Ordres en préparation sur branche `feature/v0.2.1-readable-orders`. Aucun changement moteur ni de données.

Toutes les évolutions notables de Kraken Paper sont notées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions : [SemVer](https://semver.org/lang/fr/).
La version courante est dans le fichier `VERSION` ; chaque version publiée en prod a un tag git `vX.Y.Z`.

## [Unreleased]

### Correctifs prévus pour v0.2.2
- Rejeter dans le dashboard les cycles equity.csv à valeur négative ou vide (espaces seuls), ainsi que les benchmarks BTC négatifs ; conserver le dernier snapshot valide en cas d'erreur. Tests de non-régression ajoutés. Aucune modification du moteur ou des données PAPER.


### UX/UI — v0.2.1 (en préparation)
- Navigation compacte par ancres vers les zones du dashboard, accessible au clavier et sur mobile.
- Positions et ordres ouverts remontés immédiatement après le graphique principal.
- Graphique en bougies sur 1 h par défaut, largeur étendue sur grand écran et défilement réduit.
- Survol de bougie conservé lors des rafraîchissements de cours ; remis à zéro lors d'un changement de marché ou de période.
- Aucun changement de moteur, de stratégie, d'ordres ou de données PAPER.


### Déploiement (en préparation)
- Workflow GitHub Actions automatique après push/fusion sur `preprod` uniquement, réservé à l'alias Netlify `preprod`, avec secret GitHub d'environnement, vérification du commit publié et documentation ADR-16. Aucun déploiement de production. Le déclencheur manuel initial a été remplacé car GitHub exige sa présence sur la branche par défaut.


### Qualité (en préparation)
- Ajout du workflow `quality-gates` : tests Python et Node, vérification de syntaxe, garde-fous de livraison et exigence de mise à jour du CHANGELOG et du HANDOFF pour chaque PR.
- Procédure de reprise et d'activation des contrôles obligatoires documentée (ADR-15) : checks requis uniquement sur `preprod` ; `main` reste accessible aux écritures autorisées du moteur et de Grok Bot, sans PR ni checks obligatoires. Aucun changement du moteur ou des données de simulation.

## [0.2.0] - 2026-11-14

### Ajouté
- Fil « Décisions de Grok Bot » : une carte dépliable par décision (date de Paris, id, justification, actions résumées en français avec leur résultat : ordre créé ou refus et sa raison, notes), la plus récente en haut. Source : `decisions/` sur `main` via l'API GitHub (liste avec ETag, fichiers lus une seule fois par sha et gardés en cache local) ; repli sur le journal si l'API est limitée.
- Carte « Exposition » : part investie aux prix en direct, cash réservé par les achats en attente, cash libre, perte totale si tous les stops sont touchés (positions et achats en attente, frais compris, même calcul que le tableau des ordres), alerte si une position ou un achat n'a pas de stop.
- Carte « Prochains passages » : prochain cycle du moteur à la minute 9 (fonction Netlify, uniquement en production ; le cron GitHub à la minute 7 prend le relais si besoin), retard signalé si le dernier cycle a plus de 75 min, et prochaine session de gestion estimée (dernière décision + 5 h).
- « Performance par jour » : variation du portefeuille et de BTC conservé par jour de Paris (base : dernier cycle de la veille), avec texte et flèches en plus de la couleur ; fonctionne avec un seul jour de données.
- Alerte de proximité dans les ordres ouverts : badge « à 0,6 % du déclenchement (achat limite / stop / objectif) » sous 1 %, surlignage bref unique quand un ordre entre dans la zone, jamais de clignotement.
- Section « Leçons » : rendu de `docs/LESSONS.md` (markdown minimal, HTML échappé, liens http(s) seulement) ; première leçon sur le repli de 2-3 % en marché survendu.
- Cash comme sur Kraken : « cash total », « réservé dans les ordres » (achats en attente, frais maker compris) et « cash disponible » = total − réservé, dans l'en-tête des positions et la carte Exposition. La valeur totale du portefeuille ne change pas (le cash réservé y compte toujours). Le moteur réserve déjà ce cash à la pose d'un ordre (`available_cash`) : affichage seulement, moteur inchangé.
- `site/lib.js` (fonctions pures) et ses tests `tests/site/lib.test.js` ; `site/extras.js` pour les nouvelles sections.
- Fonction planifiée Netlify `engine-trigger` (minute 9 UTC) qui lance le workflow `engine.yml` sur `main` via `workflow_dispatch`. Le cron GitHub (minute 7 UTC) reste en secours. La fonction ne tourne que sur le déploiement de production publié ; le jeton `GITHUB_DISPATCH_TOKEN` (GitHub fine-grained, dépôt `kraken-paper` seulement, permission Actions lecture/écriture) est une variable d'environnement du site, scopes `builds` / `functions` / `runtime`, contextes production, branch-deploy, deploy-preview et dev, marquée secret, jamais dans le dépôt (le plan Netlify actuel refuse un scope limité à `functions` seulement). Si un cycle est déjà `in_progress` ou `queued`, elle ne relance pas. Le moteur est idempotent et le workflow a déjà un groupe de concurrence (`kraken-paper-engine`, `cancel-in-progress: false`).
- Tests de réservation du cash et des quantités (`tests/test_reservations.py`).

### Modifié
- Graphique : les textes des niveaux (« O0001 achat limite », « stop prévu », « objectif », « PRU ») sont posés sur la ligne pointillée à gauche du graphique ; l'échelle de droite ne garde que de petites étiquettes de prix. Marge à droite plus grande (12 bougies) : la dernière bougie ne touche plus l'échelle.
- Graphique : unités de temps 5 min, 15 min et 30 min en plus de 1 h, 4 h et 1 j (onglets défilants sur mobile). Cache court (1 min en 5 min, 2 min en 15 min, 3 min en 30 min) et rafraîchissement adapté à l'unité (au plus une requête toutes les 30 s pour le graphique ouvert). Le tableau des marqueurs garde ses unités (4 h et 1 j).
- Bouton « Ordres » sur le graphique pour masquer ou afficher toutes les lignes d'ordres, stops et objectifs (choix gardé dans le navigateur).
- La carte « Dernière décision » est remplacée par le fil des décisions.
- `scripts/deploy.sh` envoie aussi `netlify/functions/` quand le dossier est présent. `netlify.toml` déclare le répertoire des fonctions et le cron de `engine-trigger`.
- Datation des exécutions : quand une bougie 1 h déclenche un ordre, le moteur lit les bougies 5 min de cette heure et date le fill à l'ouverture de la première qui touche le niveau. Prix et frais inchangés. Si stop et objectif tombent dans la même heure, le premier touché en 5 min gagne ; le stop l'emporte seulement s'ils sont dans la même bougie 5 min. Repli (données 5 min absentes ou incomplètes, Kraken n'en garde que ~60 h) : même décision qu'avant sur la bougie 1 h, mais datée à l'ouverture et non plus à la fermeture. L'état déjà enregistré (T0001, T0002) n'est pas réécrit : le dash recolle le marqueur sur la première bougie affichée qui touche le prix dans l'heure précédant le ts.
- Étiquette PRU du graphique : P&L latent en % et en USDC (frais d'entrée inclus), vert ou rouge, mis à jour avec le prix en direct.

## [0.1.0] - 2026-11-14

Première version numérotée. Elle regroupe tout ce qui a été construit depuis le lancement le 13/11/2026.

### Ajouté
- Moteur PAPER (`engine/run.py`, bibliothèque standard uniquement) : rejeu des bougies 1 h clôturées, ordres limites en maker 0,40 %, ordres au marché et stops en taker 0,80 % avec 0,1 % de glissement, stop prioritaire sur l'objectif dans la même bougie, paires USDC ouvertes en France uniquement, référence « BTC conservé ».
- Cycle horaire GitHub Actions (minute 7) et à chaque push dans `decisions/`, notifications ntfy à chaque exécution.
- Tableau de bord statique (Netlify) : KPI, positions, ordres, trades, journal, courbe du portefeuille vs BTC conservé, dernière décision.
- Graphiques en bougies 1 h / 4 h / 1 j (TradingView Lightweight Charts 5.3.0) avec MA20, MA50, volume, RSI 14, niveaux d'ordres et exécutions.
- Tableau des marqueurs sur 14 paires USDC (tendance, RSI, ATR, force vs BTC), chargement progressif.
- Lecture de l'état via l'API GitHub (sha + If-None-Match), repli sur raw.githubusercontent.com.
- En-tête : version, badge d'environnement (PROD / PRÉPROD / FEATURE / LOCAL) et commit déployé (`site/version.json` écrit par `scripts/deploy.sh`).
- Ordres ouverts détaillés : montant engagé, distance au déclenchement, stop, objectif, perte max et gain visé nets de frais, ratio gain / risque, date de création, décision d'origine ; lignes dépliables sur mobile.
- Un seul site Netlify : prod en production, préprod et features en alias (`preprod--`, `feature-<nom>--`), badge d'environnement déduit de l'adresse ; script de déploiement, documentation de reprise (`docs/`), modèle de PR, tests du calcul des ordres (`tests/site/`).

### Sécurité
- L'état ne voyage jamais dans une release : contrôle CI `guard-state` (PR et branches hors `main`), `scripts/release.sh` qui refuse toute fusion touchant `state/` ou `decisions/`.

### Modifié
- Le workflow du moteur ne s'exécute que depuis `main` (garde-fou contre un lancement manuel depuis une autre branche).

- v0.3.0 PR d'intégration : quatre rubriques et synthèse mobile (code PR #37, ADR PR #38).


<!-- CONTENU CONSERVÉ DE MAIN AVANT PUBLICATION — À RÉCONCILIER -->
# Changelog

- Correction complémentaire mobile : neutralisation des anciennes largeurs minimales tablette (620 px Positions, 760 px Marqueurs) sous 680 px, avec sélecteurs plus spécifiques.

- Correctif UX mobile : les fiches des tableaux sont contraintes à la largeur du panneau, évitant le débordement constaté sur iPhone dans Positions.

## UX mobile — refonte groupée v0.2.1 (préproduction)
- Les quatre tableaux denses (ordres, positions, trades et marqueurs) deviennent des fiches compactes sous 680 px, sans dégrader les tableaux desktop.
- Les ordres affichent en priorité crypto, sens, montant et distance ; prix, stop, objectif et risque restent accessibles par « Détails ».
- Filtres, indicateurs, graphiques, journal et espaces tactiles adaptés aux petits écrans. Aucune modification du moteur PAPER.

## Intégration dashboard v0.2.1 — cohérence de sélection
- Correction du chandelier lorsque la paire sélectionnée disparaît après une actualisation du portefeuille : retour au BTC et chargement effectif de ses bougies.
- Tests d'intégration des dépendances JS, de la publication atomique des données, des contrôles du graphique et du scanner.

## Scanner — suivi des données et récupération automatique (préproduction v0.2.1)
- Progression fondée sur les cryptos réellement analysées, plutôt que le nombre de lignes déjà affichées.
- Message distinct pour les cryptos dont les données sont indisponibles ; fin de l'indicateur de chargement à la fin de la vague.
- Nouvelle position ou nouvel ordre sur une paire non suivie : mise à jour immédiate du scanner, sans attendre trois minutes.

## Préproduction v0.2.1 — scanner de marchés optimisé
- Suppression des rafales de lectures concurrentes lors des actualisations : un seul scanner actif, une demande de reprise regroupée.
- BTC calculé en premier, puis au plus deux actifs simultanément ; rendu des marqueurs groupé par quatre résultats pour limiter les reflows.
- Tests de non-régression du scanner ; aucun changement de stratégie ou de moteur.

## Préproduction v0.2.1 — session de graphique et rafraîchissement explicite
- Mémorisation dans l'onglet des choix de crypto, timeframe et 60/120/240 bougies, avec valeurs validées et repli si la paire n'est plus disponible.
- Bouton Actualiser pour relire les chandeliers Kraken et heure de dernière lecture réussie.
- Tests des préférences, des échecs de stockage et de la barre d'outils ; ADR-20.

## Préproduction v0.2.1 — fiabilité du chandelier
- Les réponses OHLC tardives ne peuvent plus écraser la paire ou l'unité de temps actuellement sélectionnée.
- Validation stricte des bougies Kraken avant leur mise en cache : horodatage, prix, volumes et chronologie.
- Conservation du dernier graphique valide en cas d'erreur réseau ou de données.
- Tests de non-régression et ADR-19.

## Préproduction v0.2.1 — garde-fous des données publiques
- Validation stricte des historiques equity.csv et journal.jsonl : pas de suppression silencieuse d'événements corrompus.
- Prix Kraken non positifs ou non numériques rejetés, statut partiel explicite et repli sur les prix du cycle moteur.
- Tests exécutables et ADR-18.

## Stabilisation des historiques longs (préproduction, v0.2.1)
- Rendu SVG plafonné selon la largeur, extrema et données manquantes préservés ; aucun cycle modifié.
- Tests de charge sur 100 000 points et ADR-17.


> Stabilisation du rafraîchissement UX v0.2.1 : une seule lecture d'état à la fois, validation et publication groupée portefeuille/equity/journal, nouvelle tentative après snapshot invalide, réponses de prix hors ordre ignorées, journal/trades/courbe reconstruits uniquement lors d'un nouveau snapshot (pas toutes les 15 s). Aucun changement du moteur PAPER.

> Explorateur d'historique UX v0.2.1 : courbe 24 h, 7 j, 30 j, 90 j, 6 mois (180 j), 1 an (365 j), tout; journal 40/100/250/tous les événements disponibles, avec indication explicite de la profondeur chargée et des filtres sur les entrées visibles. Aucun événement ni point de courbe inventé, lecture seule.

> Itération de stabilisation UX v0.2.1 : déconnexion temporaire et reconnexion garantie du MutationObserver pendant le tri DOM (sans masquer les nouvelles données), étiquette du chandelier fondée sur le nombre réel de bougies chargées, tests de non-régression et maintien de la navigation/du survol. Aucun changement de simulation.

> Durcissement UX v0.2.1 : correction du tri P&L négatif (signe moins typographique), protection contre la rétroaction MutationObserver lors des tris, accès direct Performance/Historique depuis la navigation, nom accessible du graphique portefeuille, tests d'intégration HTML/navigation/labels/scripts et non-régression du tri.

> Lot UX v0.2.1 performance et journal : périodes de courbe 24 h / 7 j / 30 j / tout (cycles réels uniquement), compteur de cycles, journal filtrable par texte et type d'événement, remise à zéro, tests Node et ergonomie mobile. Aucune modification moteur, stratégie ou données PAPER.

> Lot UX portefeuille v0.2.1 : tri des positions (valeur, P&L signé, nom), recherche crypto, recherche et filtre achat/vente dans l'historique des trades, compteurs et réinitialisation, affichage mobile. Opérations uniquement visuelles, aucun changement moteur, stratégie, état ou décisions.

> Lot graphique UX v0.2.1 : choix de fenêtre 60/120/240 bougies, recentrage manuel, lecture mobile améliorée, conservation du survol et de la vue pendant les rafraîchissements. Aucun changement de données, moteur ou stratégie.

> Correctif UX 0.2.1 : remise à zéro des filtres en un clic, message explicite sans résultat, tests Node automatisés sur les filtres d'ordres et de marché. Aucun changement moteur.

> Complément en validation : filtres de recherche et de tendance sur les marqueurs, filtres d'ordres par sens et crypto, améliorations mobiles du graphique et des tableaux. Filtres uniquement visuels, sans modification des données.
>
> Compléments UX 0.2.1 : navigation latérale rétractable publiée en préproduction (`0e744d8`) ; refonte de lisibilité des tableaux Positions et Ordres en préparation sur branche `feature/v0.2.1-readable-orders`. Aucun changement moteur ni de données.

Toutes les évolutions notables de Kraken Paper sont notées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions : [SemVer](https://semver.org/lang/fr/).
La version courante est dans le fichier `VERSION` ; chaque version publiée en prod a un tag git `vX.Y.Z`.

## [Unreleased]

### UX/UI — v0.2.1 (en préparation)
- Navigation compacte par ancres vers les zones du dashboard, accessible au clavier et sur mobile.
- Positions et ordres ouverts remontés immédiatement après le graphique principal.
- Graphique en bougies sur 1 h par défaut, largeur étendue sur grand écran et défilement réduit.
- Survol de bougie conservé lors des rafraîchissements de cours ; remis à zéro lors d'un changement de marché ou de période.
- Aucun changement de moteur, de stratégie, d'ordres ou de données PAPER.


### Déploiement (en préparation)
- Workflow GitHub Actions automatique après push/fusion sur `preprod` uniquement, réservé à l'alias Netlify `preprod`, avec secret GitHub d'environnement, vérification du commit publié et documentation ADR-16. Aucun déploiement de production. Le déclencheur manuel initial a été remplacé car GitHub exige sa présence sur la branche par défaut.


### Qualité (en préparation)
- Ajout du workflow `quality-gates` : tests Python et Node, vérification de syntaxe, garde-fous de livraison et exigence de mise à jour du CHANGELOG et du HANDOFF pour chaque PR.
- Procédure de reprise et d'activation des contrôles obligatoires documentée (ADR-15) : checks requis uniquement sur `preprod` ; `main` reste accessible aux écritures autorisées du moteur et de Grok Bot, sans PR ni checks obligatoires. Aucun changement du moteur ou des données de simulation.

## [0.2.0] - 2026-11-14

### Ajouté
- Fil « Décisions de Grok Bot » : une carte dépliable par décision (date de Paris, id, justification, actions résumées en français avec leur résultat : ordre créé ou refus et sa raison, notes), la plus récente en haut. Source : `decisions/` sur `main` via l'API GitHub (liste avec ETag, fichiers lus une seule fois par sha et gardés en cache local) ; repli sur le journal si l'API est limitée.
- Carte « Exposition » : part investie aux prix en direct, cash réservé par les achats en attente, cash libre, perte totale si tous les stops sont touchés (positions et achats en attente, frais compris, même calcul que le tableau des ordres), alerte si une position ou un achat n'a pas de stop.
- Carte « Prochains passages » : prochain cycle du moteur à la minute 9 (fonction Netlify, uniquement en production ; le cron GitHub à la minute 7 prend le relais si besoin), retard signalé si le dernier cycle a plus de 75 min, et prochaine session de gestion estimée (dernière décision + 5 h).
- « Performance par jour » : variation du portefeuille et de BTC conservé par jour de Paris (base : dernier cycle de la veille), avec texte et flèches en plus de la couleur ; fonctionne avec un seul jour de données.
- Alerte de proximité dans les ordres ouverts : badge « à 0,6 % du déclenchement (achat limite / stop / objectif) » sous 1 %, surlignage bref unique quand un ordre entre dans la zone, jamais de clignotement.
- Section « Leçons » : rendu de `docs/LESSONS.md` (markdown minimal, HTML échappé, liens http(s) seulement) ; première leçon sur le repli de 2-3 % en marché survendu.
- Cash comme sur Kraken : « cash total », « réservé dans les ordres » (achats en attente, frais maker compris) et « cash disponible » = total − réservé, dans l'en-tête des positions et la carte Exposition. La valeur totale du portefeuille ne change pas (le cash réservé y compte toujours). Le moteur réserve déjà ce cash à la pose d'un ordre (`available_cash`) : affichage seulement, moteur inchangé.
- `site/lib.js` (fonctions pures) et ses tests `tests/site/lib.test.js` ; `site/extras.js` pour les nouvelles sections.
- Fonction planifiée Netlify `engine-trigger` (minute 9 UTC) qui lance le workflow `engine.yml` sur `main` via `workflow_dispatch`. Le cron GitHub (minute 7 UTC) reste en secours. La fonction ne tourne que sur le déploiement de production publié ; le jeton `GITHUB_DISPATCH_TOKEN` (GitHub fine-grained, dépôt `kraken-paper` seulement, permission Actions lecture/écriture) est une variable d'environnement du site, scopes `builds` / `functions` / `runtime`, contextes production, branch-deploy, deploy-preview et dev, marquée secret, jamais dans le dépôt (le plan Netlify actuel refuse un scope limité à `functions` seulement). Si un cycle est déjà `in_progress` ou `queued`, elle ne relance pas. Le moteur est idempotent et le workflow a déjà un groupe de concurrence (`kraken-paper-engine`, `cancel-in-progress: false`).
- Tests de réservation du cash et des quantités (`tests/test_reservations.py`).

### Modifié
- Graphique : les textes des niveaux (« O0001 achat limite », « stop prévu », « objectif », « PRU ») sont posés sur la ligne pointillée à gauche du graphique ; l'échelle de droite ne garde que de petites étiquettes de prix. Marge à droite plus grande (12 bougies) : la dernière bougie ne touche plus l'échelle.
- Graphique : unités de temps 5 min, 15 min et 30 min en plus de 1 h, 4 h et 1 j (onglets défilants sur mobile). Cache court (1 min en 5 min, 2 min en 15 min, 3 min en 30 min) et rafraîchissement adapté à l'unité (au plus une requête toutes les 30 s pour le graphique ouvert). Le tableau des marqueurs garde ses unités (4 h et 1 j).
- Bouton « Ordres » sur le graphique pour masquer ou afficher toutes les lignes d'ordres, stops et objectifs (choix gardé dans le navigateur).
- La carte « Dernière décision » est remplacée par le fil des décisions.
- `scripts/deploy.sh` envoie aussi `netlify/functions/` quand le dossier est présent. `netlify.toml` déclare le répertoire des fonctions et le cron de `engine-trigger`.
- Datation des exécutions : quand une bougie 1 h déclenche un ordre, le moteur lit les bougies 5 min de cette heure et date le fill à l'ouverture de la première qui touche le niveau. Prix et frais inchangés. Si stop et objectif tombent dans la même heure, le premier touché en 5 min gagne ; le stop l'emporte seulement s'ils sont dans la même bougie 5 min. Repli (données 5 min absentes ou incomplètes, Kraken n'en garde que ~60 h) : même décision qu'avant sur la bougie 1 h, mais datée à l'ouverture et non plus à la fermeture. L'état déjà enregistré (T0001, T0002) n'est pas réécrit : le dash recolle le marqueur sur la première bougie affichée qui touche le prix dans l'heure précédant le ts.
- Étiquette PRU du graphique : P&L latent en % et en USDC (frais d'entrée inclus), vert ou rouge, mis à jour avec le prix en direct.

## [0.1.0] - 2026-11-14

Première version numérotée. Elle regroupe tout ce qui a été construit depuis le lancement le 13/11/2026.

### Ajouté
- Moteur PAPER (`engine/run.py`, bibliothèque standard uniquement) : rejeu des bougies 1 h clôturées, ordres limites en maker 0,40 %, ordres au marché et stops en taker 0,80 % avec 0,1 % de glissement, stop prioritaire sur l'objectif dans la même bougie, paires USDC ouvertes en France uniquement, référence « BTC conservé ».
- Cycle horaire GitHub Actions (minute 7) et à chaque push dans `decisions/`, notifications ntfy à chaque exécution.
- Tableau de bord statique (Netlify) : KPI, positions, ordres, trades, journal, courbe du portefeuille vs BTC conservé, dernière décision.
- Graphiques en bougies 1 h / 4 h / 1 j (TradingView Lightweight Charts 5.3.0) avec MA20, MA50, volume, RSI 14, niveaux d'ordres et exécutions.
- Tableau des marqueurs sur 14 paires USDC (tendance, RSI, ATR, force vs BTC), chargement progressif.
- Lecture de l'état via l'API GitHub (sha + If-None-Match), repli sur raw.githubusercontent.com.
- En-tête : version, badge d'environnement (PROD / PRÉPROD / FEATURE / LOCAL) et commit déployé (`site/version.json` écrit par `scripts/deploy.sh`).
- Ordres ouverts détaillés : montant engagé, distance au déclenchement, stop, objectif, perte max et gain visé nets de frais, ratio gain / risque, date de création, décision d'origine ; lignes dépliables sur mobile.
- Un seul site Netlify : prod en production, préprod et features en alias (`preprod--`, `feature-<nom>--`), badge d'environnement déduit de l'adresse ; script de déploiement, documentation de reprise (`docs/`), modèle de PR, tests du calcul des ordres (`tests/site/`).

### Sécurité
- L'état ne voyage jamais dans une release : contrôle CI `guard-state` (PR et branches hors `main`), `scripts/release.sh` qui refuse toute fusion touchant `state/` ou `decisions/`.

### Modifié
- Le workflow du moteur ne s'exécute que depuis `main` (garde-fou contre un lancement manuel depuis une autre branche).


### Outillage de déploiement (sans changement de version)
- Ajout d'un workflow GitHub Actions de publication production sur demande explicite, avec tests, garde-fou SHA et vérification de la version Netlify. Aucun changement moteur, état ou décision.
