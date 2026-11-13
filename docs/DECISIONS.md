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

## ADR-9 : environnements prod / préprod, version affichée (14/11/2026)
- **Décision** : `main` = prod, `preprod` = site kraken-paper-preprod, branches `feature/*` ; l'état reste unique sur `main` et
  le moteur ne tourne que depuis `main`. `scripts/deploy.sh` écrit `site/version.json` affiché dans l'en-tête (version,
  badge PROD / PRÉPROD / FEATURE, commit).
- **Conséquences** : on peut tester sans risque pour la prod ; la préprod montre le vrai portefeuille ; il faut maintenir
  `preprod` à jour avec `main`.

## ADR-10 : rôles (13/11/2026)
- **Décision** : Grok Bot garde la main technique et les décisions de trading ; GPT maintient et fait évoluer le code par PR
  relues par Grok Bot ; Cyril valide la prod. Pas d'équipe de bots en discussion permanente (double la consommation).
