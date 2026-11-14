# Changelog

Toutes les évolutions notables de Kraken Paper sont notées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions : [SemVer](https://semver.org/lang/fr/).
La version courante est dans le fichier `VERSION` ; chaque version publiée en prod a un tag git `vX.Y.Z`.

## [Unreleased]

## [0.2.0] - en attente de validation

En préprod (https://preprod--kraken-paper.netlify.app), pas encore en prod : la date sera fixée à la mise en prod, après l'accord de Cyril.

### Ajouté
- Fil « Décisions de Grok Bot » : une carte dépliable par décision (date de Paris, id, justification, actions résumées en français avec leur résultat : ordre créé ou refus et sa raison, notes), la plus récente en haut. Source : `decisions/` sur `main` via l'API GitHub (liste avec ETag, fichiers lus une seule fois par sha et gardés en cache local) ; repli sur le journal si l'API est limitée.
- Carte « Exposition » : part investie aux prix en direct, cash réservé par les achats en attente, cash libre, perte totale si tous les stops sont touchés (positions et achats en attente, frais compris, même calcul que le tableau des ordres), alerte si une position ou un achat n'a pas de stop.
- Carte « Prochains passages » : prochain cycle du moteur (:07 heure de Paris, retard signalé honnêtement si le dernier cycle a plus de 75 min) et prochaine session de gestion estimée (dernière décision + 5 h).
- « Performance par jour » : variation du portefeuille et de BTC conservé par jour de Paris (base : dernier cycle de la veille), avec texte et flèches en plus de la couleur ; fonctionne avec un seul jour de données.
- Alerte de proximité dans les ordres ouverts : badge « à 0,6 % du déclenchement (achat limite / stop / objectif) » sous 1 %, surlignage bref unique quand un ordre entre dans la zone, jamais de clignotement.
- Section « Leçons » : rendu de `docs/LESSONS.md` (markdown minimal, HTML échappé, liens http(s) seulement) ; première leçon sur le repli de 2-3 % en marché survendu.
- Cash comme sur Kraken : « cash total », « réservé dans les ordres » (achats en attente, frais maker compris) et « cash disponible » = total − réservé, dans l'en-tête des positions et la carte Exposition. La valeur totale du portefeuille ne change pas (le cash réservé y compte toujours). Le moteur réserve déjà ce cash à la pose d'un ordre (`available_cash`) : affichage seulement, moteur inchangé.
- `site/lib.js` (fonctions pures) et ses tests `tests/site/lib.test.js` ; `site/extras.js` pour les nouvelles sections.

### Modifié
- Graphique : les textes des niveaux (« O0001 achat limite », « stop prévu », « objectif », « PRU ») sont posés sur la ligne pointillée à gauche du graphique ; l'échelle de droite ne garde que de petites étiquettes de prix. Marge à droite plus grande (12 bougies) : la dernière bougie ne touche plus l'échelle.
- Graphique : unités de temps 5 min, 15 min et 30 min en plus de 1 h, 4 h et 1 j (onglets défilants sur mobile). Cache court (1 min en 5 min, 2 min en 15 min, 3 min en 30 min) et rafraîchissement adapté à l'unité (au plus une requête toutes les 30 s pour le graphique ouvert). Le tableau des marqueurs garde ses unités (4 h et 1 j).
- Bouton « Ordres » sur le graphique pour masquer ou afficher toutes les lignes d'ordres, stops et objectifs (choix gardé dans le navigateur).
- La carte « Dernière décision » est remplacée par le fil des décisions.

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
