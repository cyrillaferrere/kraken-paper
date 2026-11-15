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

## ADR-14 : datation des exécutions à la bougie 5 min (14/11/2026)
- **Contexte** : le moteur ne déclenche un ordre que sur une bougie 1 h clôturée, mais datait le fill à la
  **fermeture** de cette heure (`t + HOUR`). L'achat BTC O0001, déclenché sur la bougie de 04h00, était donc
  horodaté 05:00 et le marqueur du graphique tombait une bougie trop tard (idem SOL).
- **Décision** : dès qu'une bougie 1 h touche un niveau, récupérer les 12 bougies 5 min de cette heure
  (`OHLC interval=5`). Le fill est daté à l'ouverture de la première qui touche le niveau. Si stop et objectif
  sont tous deux dans l'heure, le premier touché en 5 min gagne ; le stop reste prioritaire seulement s'ils
  tombent dans la **même** bougie 5 min. Prix et frais inchangés. Si les 5 min manquent ou sont incomplètes
  (Kraken n'en conserve qu'environ 720, soit ~60 h), on garde la décision 1 h et on date à l'**ouverture**
  de l'heure, plus à la fermeture. Les fills reçoivent `time_source` (`m5` ou `hour_open`). L'état déjà
  enregistré n'est pas réécrit : le dash (`fillMarkerTs`) recolle les anciens marqueurs (sans `time_source`)
  sur la première bougie affichée qui touche le prix dans l'heure précédant le ts.
- **Conséquences** : les nouveaux fills sont à 5 min près ; les anciens (T0001, T0002) s'affichent au bon
  endroit dès que les bougies du graphique couvrent cette heure. Au-delà de ~60 h, on perd la précision 5 min
  au moment de l'exécution, d'où le repli. Un appel OHLC 5 min supplémentaire par paire et par heure
  déclenchée, API publique uniquement.

## ADR-15 : contrôles qualité systématiques sur les PR (14/11/2026)
- **Contexte** : `guard-state` protège les données, mais les tests du moteur étaient surtout exécutés lors des cycles et des releases ; une PR pouvait être proposée sans validation transversale automatisée. Les ADR-13 (déclencheur Netlify) et ADR-14 (datation en 5 min) existent déjà.
- **Décision** : ajouter `.github/workflows/quality.yml` pour tester les PR vers `preprod` et `main`, les pushes de développement et l'exécution manuelle. Il vérifie les chemins protégés, la présence d'une mise à jour du CHANGELOG et du HANDOFF sur chaque PR, les tests Python/Node, la syntaxe JavaScript/Bash et les invariants des scripts de livraison. Il ne lance pas le moteur, ne déploie rien et ne lit aucun secret.
- **Protection des branches envisagée** : `preprod` : PR et checks `quality-gates / quality`, `guard-state / code-only` obligatoires, sans force-push ni suppression. `main` : **aucune PR ni aucun check obligatoire**, car le moteur et Grok Bot y poussent directement et ces checks ne tournent pas sur les pushes `main`. Empêcher force-push et suppression ; autoriser les pushes directs uniquement à `github-actions[bot]` et `cyrillaferrere`, dans la mesure où GitHub le permet effectivement sans bloquer le moteur. Ne pas activer de règle sans accord explicite de Cyril.
- **Conséquences** : contrôle reproductible sans modifier `state/` ni `decisions/`. Les contrôles statiques ne remplacent pas la revue Grok Bot ni les essais UX. Les règles GitHub sont une configuration distincte, non activée dans cette PR ; leur faisabilité doit être vérifiée avant application. Aucune modification des règles de simulation.

## ADR-16 : déploiement préprod automatique après fusion par GitHub Actions (14/11/2026)
- **Contexte** : le connecteur Netlify disponible à GPT ne permet pas de publier un alias ; dépendre de Grok Bot pour chaque préprod consomme son forfait.
- **Décision** : workflow `.github/workflows/deploy-preprod.yml` déclenché par **push sur `preprod`** après fusion de PR (pas de `workflow_dispatch`, qui exige un workflow présent sur la branche par défaut), avec permission GitHub `contents: read`, environnement GitHub `preprod` et secret `NETLIFY_AUTH_TOKEN`. Il appelle `scripts/deploy.sh preprod` qui exporte le commit poussé par `git archive`, publie avec `--alias preprod` et jamais `--prod`. Contrôle du `version.json` public (commit, branche et environnement) après déploiement. Aucune automatisation de la production.
- **Sécurité et limites** : aucune modification de `main`, `state/`, `decisions/` ou du moteur ; aucun jeton en clair dans le dépôt ou les logs. Le jeton Netlify est techniquement un jeton de compte et pourrait disposer de droits sur la prod : la limitation à l'alias est une **protection du workflow**, pas une limitation intrinsèque du jeton. Configurer l'environnement `preprod` et le secret dans GitHub après accord de Cyril ; ne pas considérer le déploiement opérationnel avant un premier run réussi. Si possible, utiliser un compte Netlify dédié avec permissions minimales.
- **Conséquences** : chaque intégration validée sur `preprod` déclenche et vérifie le déploiement via GitHub Actions, sans intervention manuelle, sans faire intervenir Grok Bot. La production demeure soumise à l'accord explicite de Cyril.

## ADR-17 : visualisation bornée des historiques longs sans altérer les cycles (14/11/2026)
- **Contexte** : une courbe sur un an peut contenir plusieurs milliers de cycles ; la création d'un SVG pour chaque point coûte cher, et `Math.min(...valeurs)` peut dépasser les limites d'arguments sur un historique volumineux.
- **Décision** : conserver tous les cycles bruts et les utiliser pour les périodes, les comptes et les bornes de l'axe ; limiter uniquement les points de tracé SVG en conservant les extrema par fenêtre, les extrémités et les frontières de données absentes. Les séries discontinues ne sont jamais reliées artificiellement.
- **Conséquences** : tracé plus fluide sur historique long sans changer l'état, les calculs de performance ni les décisions ; les détails intra-fenêtre ne sont pas tous dessinés, mais les minima et maxima sont conservés. Tests de 100 000 cycles et de lacunes de données.

## ADR-18 : refuser les données historiques corrompues et signaler les prix partiels (14/11/2026)
- **Contexte** : le navigateur supprimait silencieusement les lignes de journal JSONL malformées et les cycles CSV invalides ; des prix Kraken absents ou non numériques pouvaient être interprétés comme disponibles.
- **Décision** : valider les trois sources avant publication, rejeter le snapshot entier en cas d'historique incohérent, ignorer les prix de marché non positifs/non finis et afficher le nombre de paires effectivement reçues. Conserver les valeurs du dernier cycle pour les paires sans prix direct.
- **Conséquences** : aucun événement d'audit perdu silencieusement ; l'ancien snapshot reste affiché avec une alerte jusqu'au prochain essai ; les données live partielles sont explicitement signalées. Aucun changement moteur ni stratégie.

## ADR-19 : isoler les chargements de chandeliers concurrents (14/11/2026)
- **Contexte** : un changement rapide de paire ou d'unité de temps pouvait laisser une requête OHLC précédente modifier le graphique, son message d'erreur ou son indicateur de chargement ; des bougies invalides entraient dans le cache.
- **Décision** : numéroter chaque demande de graphique et autoriser seulement la plus récente à mettre à jour les séries et les états d'interface. Valider les OHLC (chronologie, valeurs finies, cohérence haut/bas, volume) avant mise en cache ; conserver le dernier graphique valide en cas d'erreur.
- **Conséquences** : navigation rapide stable et erreurs explicites, sans modifier les ordres, les prix de simulation ou la stratégie. Le cache est protégé contre les réponses incohérentes ; une requête périmée peut se terminer mais ne peut pas écraser le rendu courant.

## ADR-20 : préférences locales du chandelier sans impact sur le moteur (14/11/2026)
- **Contexte** : les choix de paire, d'unité de temps et de fenêtre visible sont perdus au rechargement ; l'utilisateur ne peut pas demander explicitement une relecture OHLC ni voir quand les bougies ont été chargées.
- **Décision** : mémoriser uniquement les préférences du graphique en `sessionStorage` avec validation stricte et repli sur BTC/1 h/120 bougies ; afficher un bouton d'actualisation et l'heure de dernière lecture des bougies. Ne mémoriser aucun ordre, capital, décision ni secret.
- **Conséquences** : les préférences survivent au rechargement de l'onglet mais pas à une nouvelle session ; le bouton relit les bougies Kraken sans modifier la simulation ; l'heure correspond à la lecture réussie, pas à l'horodatage du dernier trade.


## ADR-27 : publication production avec approbation GitHub obligatoire (14/11/2026)
- **Contexte** : le workflow de publication initial se fiait au champ JSON `approved_by: Cyril`, librement modifiable, sans preuve d'approbation. Le numéro ADR-21 est déjà utilisé pour Nocturne Signal.
- **Décision** : le job de publication doit cibler `environment: production`, configuré dans GitHub avec Cyril comme relecteur obligatoire et une restriction de branche à `deploy/prod-request`. Le champ JSON reste un identifiant de demande et une trace d'audit, **jamais** une autorisation suffisante. `NETLIFY_AUTH_TOKEN` est un secret de l'environnement `production`, et doit être supprimé des secrets du dépôt après migration. Le job vérifie le SHA, la version, les changements autorisés et le résultat publié.
- **Condition bloquante** : si la visibilité du dépôt ou l'abonnement GitHub ne permet pas les relecteurs obligatoires d'environnement, **aucune mise en production via ce workflow** ; il faut un autre mécanisme d'approbation indépendant vérifié. La présence de `environment: production` sans protection active n'est pas suffisante.
- **Conséquences** : pas de déclenchement de déploiement sans validation GitHub effective. La configuration de l'environnement et la migration du secret sont réalisées par Cyril dans l'interface GitHub, sans partager de jeton dans le chat.
- **Référence historique** : cette décision remplace l'ancienne entrée « ADR-21 : publication production pilotée par demande explicite » ; **ADR-21** reste réservé à `docs/ADR-21-NOCTURNE-SIGNAL.md`.

## ADR-28 : publication avec un seul GO (15/11/2026) — remplace l'approbation humaine ADR-27
- **Décision** : accord explicite de Cyril pour une version et un SHA ; suppression de `Required reviewers` dans l'environnement `production`, sans supprimer le secret ni les contrôles automatisés.
- **Limite** : le champ JSON `approved_by` ne constitue pas une preuve d'autorisation. Voir [ADR-28](ADR-28-SINGLE-GO-PRODUCTION.md).
