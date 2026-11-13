# Changelog

Toutes les évolutions notables de Kraken Paper sont notées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions : [SemVer](https://semver.org/lang/fr/).
La version courante est dans le fichier `VERSION` ; chaque version publiée en prod a un tag git `vX.Y.Z`.

## [Unreleased]

## [0.1.0] - 2026-11-14 (en préprod, en attente de validation de Cyril pour la prod)

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
- Environnements prod / préprod, script de déploiement, documentation de reprise (`docs/`), modèle de PR, tests du calcul des ordres (`tests/site/`).

### Modifié
- Le workflow du moteur ne s'exécute que depuis `main` (garde-fou contre un lancement manuel depuis une autre branche).
