# Décisions techniques (ADR)

Chaque entrée : contexte, décision, conséquences. Ajouter une entrée pour tout nouveau choix structurant ;
ne pas réécrire une ancienne entrée, la marquer « remplacée par ADR-n ».

## ADR-1 : un nouveau projet simple à la place de Kraken Sim V3 (13/11/2026)
- **Contexte** : Kraken Sim V3 était devenu trop complexe, avec des garde-fous (perte max −800) qui freinaient l'apprentissage.
- **Décision** : tout supprimer et repartir sur un simulateur PAPER minimal, sans limite de perte, qui ne s'arrête jamais.
- **Conséquences** : pas d'héritage de code ; priorité à apprendre vite (plusieurs cryptos, plusieurs styles, journal, bilan hebdo).

## ADR-2 : GitHub Actions + dépôt public comme moteur et base de données (13/11/2026)
- **Contexte** : il faut un cycle régulier, gratuit, traçable, sans serveur à maintenir.
- **Décision** : cron horaire (minute 7) dans GitHub Actions ; l'état est fait de fichiers JSON/CSV commités sur `main`.
  Dépôt public, donc minutes Actions gratuites et lecture de l'état sans jeton.
- **Conséquences** : historique complet de chaque cycle dans git ; le cron GitHub peut être en retard ; l'état est public
  (aucune donnée sensible dedans) ; un seul écrivain automatique (concurrence `kraken-paper-engine`).

## ADR-3 : rejeu des bougies 1 h clôturées, règles de frais Kraken Pro palier 1 (13/11/2026)
- **Décision** : les ordres s'exécutent sur les bougies 1 h **clôturées** ; limite en maker 0,40 %, marché et stop en
  taker 0,80 % + 0,1 % de glissement ; stop prioritaire sur l'objectif dans la même bougie.
- **Conséquences** : résultats prudents et reproductibles, mais pas d'exécution intra-heure ; un niveau touché en direct
  n'est enregistré qu'au cycle suivant (le dash le signale).

## ADR-4 : paires USDC disponibles en France uniquement (13/11/2026)
- **Décision** : seules les paires cotées en USDC renvoyées par `AssetPairs?country_code=FR` sont acceptées, pas d'USDT.
- **Conséquences** : conforme à ce qu'un résident français peut réellement trader (MiCA) ; certaines cryptos (ex. SUI) ne sont pas disponibles.

## ADR-5 : site statique sur Netlify, déployé à la main (13/11/2026)
- **Décision** : HTML/CSS/JS sans framework ni build ; le site n'est pas relié à GitHub sur Netlify (le connecteur ne
  permet pas la liaison) et on déploie avec `git archive` du commit poussé.
- **Conséquences** : un cycle du moteur ne demande aucun redéploiement (l'état est lu en direct) ; un déploiement
  n'embarque jamais de fichier local ; il faut penser à déployer après chaque fusion.

## ADR-6 : TradingView Lightweight Charts pour les graphiques (13/11/2026)
- **Décision** : version 5.3.0 figée, par CDN jsDelivr avec contrôle SRI.
- **Conséquences** : bougies, volets multiples, lignes de prix et marqueurs natifs, léger (~200 ko), pas d'animation des
  cours. Dépendance à un CDN : le tableau des marqueurs fonctionne sans. Le logo TradingView est l'attribution de la licence.

## ADR-7 : indicateurs calculés dans le navigateur (13/11/2026)
- **Décision** : MA20/MA50, RSI 14 (Wilder), ATR 14 (Wilder) calculés côté client depuis l'API publique Kraken (OHLC), en file
  (450 ms entre requêtes) avec cache.
- **Conséquences** : aucun coût ni clé ; 14 paires ≈ 45 requêtes et ~20 s au premier chargement, affichage progressif.

## ADR-8 : état lu via l'API GitHub, repli raw (13/11/2026)
- **Contexte** : raw.githubusercontent.com garde un cache d'environ 5 min.
- **Décision** : demander le sha de `main` avec `If-None-Match` (304 gratuit), puis lire les 3 fichiers au sha exact via
  `/contents` ; repli sur raw en cas de 403/429, de limite épuisée ou d'erreur.
- **Conséquences** : état frais à 2 min près ; limite de 60 requêtes/h par IP partagée entre onglets.

## ADR-9 : environnements prod / préprod, version affichée (14/11/2026) — remplacée en partie par ADR-11
- **Décision** : `main` = prod, `preprod` = site kraken-paper-preprod, branches `feature/*` ; l'état reste unique sur `main` et
  le moteur ne tourne que depuis `main`. `scripts/deploy.sh` écrit `site/version.json` affiché dans l'en-tête (version,
  badge PROD / PRÉPROD / FEATURE, commit).
- **Conséquences** : on peut tester sans risque pour la prod ; la préprod montre le vrai portefeuille ; il faut maintenir
  `preprod` à jour avec `main`.

## ADR-11 : un seul site Netlify, préprod en alias (14/11/2026) — remplace la partie « deux sites » d'ADR-9
- **Contexte** : un second site `kraken-paper-preprod` dispersait la configuration (futur stockage, variables d'environnement).
- **Décision** : un seul site `kraken-paper`. Prod = déploiement de production depuis `main`. Préprod = déploiement non
  production avec l'alias `preprod` (https://preprod--kraken-paper.netlify.app), features = alias `feature-<nom>`. Le badge
  d'environnement se déduit du nom d'hôte. Déploiement des alias avec la Netlify CLI (`--alias`, sans `--prod`).
- **Conséquences** : toute la configuration au même endroit ; un jeton Netlify personnel est nécessaire pour la préprod,
  car le connecteur de Grok Bot ne fait que des déploiements de production (le script refuse de l'utiliser pour un alias).
  L'ancien site kraken-paper-preprod est à supprimer à la main.

## ADR-12 : l'état ne voyage jamais dans une release (14/11/2026)
- **Contexte** : passer la préprod en prod ne doit jamais écraser le portefeuille ni les ordres.
- **Décision** : `state/` vit uniquement sur `main` et n'est écrit que par le moteur ; `decisions/` que par Grok Bot sur `main`.
  Le dash est en lecture seule. Contrôle CI `guard-state` sur les PR (vers `main` et `preprod`) et les push hors `main` ;
  `scripts/release.sh` contrôle le diff `main...preprod` et la fusion elle-même.
- **Conséquences** : une release ne livre que du code ; les commits du moteur et de Grok Bot, poussés directement sur `main`,
  ne passent pas par les PR et ne sont donc pas bloqués.

## ADR-10 : rôles (13/11/2026)
- **Décision** : Grok Bot garde la main technique et les décisions de trading ; GPT maintient et fait évoluer le code par PR
  relues par Grok Bot ; Cyril valide la prod. Pas d'équipe de bots en discussion permanente (double la consommation).

## ADR-13 : déclencheur externe Netlify, cron GitHub en secours (14/11/2026)
- **Contexte** : le cron GitHub Actions (`'7 * * * *'` dans `engine.yml`) est peu fiable sur un dépôt public gratuit :
  il peut partir en retard ou sauter des créneaux (aucun cycle planifié entre 03h15 et 09h03 heure de Paris le 14/11/2026).
  Changer l'horaire n'y change pas grand-chose.
- **Décision** : une fonction planifiée Netlify (`netlify/functions/engine-trigger.mjs`, cron `'9 * * * *'` UTC, légèrement
  décalée) appelle l'API GitHub `workflow_dispatch` du workflow `engine.yml` sur `ref: main`. Le cron GitHub reste en
  secours. Le jeton `GITHUB_DISPATCH_TOKEN` (fine-grained, dépôt `cyrillaferrere/kraken-paper` seulement, permission
  Actions lecture/écriture) est une variable d'environnement du **même** site `kraken-paper`, scopes `builds` +
  `functions` + `runtime` (le plan actuel refuse un scope `functions` seul), contextes production / branch-deploy /
  deploy-preview / dev, marquée secret ; il n'est jamais commité ni journalisé. Netlify n'exécute les fonctions planifiées que sur le déploiement
  de production publié.
- **Conséquences** : le moteur continue de ne tourner que depuis `main` (garde-fou `if:` du workflow). Un double
  déclenchement (Netlify + cron, ou deux appels rapprochés) est sans risque : le moteur est idempotent (rejeu des bougies
  déjà traitées ignoré via `last_candle`, décisions déjà appliquées ignorées via `processed_decisions`), le workflow a
  un groupe de concurrence `kraken-paper-engine` (`cancel-in-progress: false`), et la fonction ne dispatch pas si un run
  est déjà `in_progress` ou `queued`. Le jeton expire (90 jours, vers le 12/02/2027) : procédure de rotation dans le
  [RUNBOOK](RUNBOOK.md). La fonction ne commencera à tourner qu'après la mise en prod de la v0.2.0.
