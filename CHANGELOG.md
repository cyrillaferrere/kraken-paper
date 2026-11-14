# Changelog

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
