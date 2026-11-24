## Recette point mort conditionnel
Exécuter `python -m unittest tests.test_tp_paliers -v` puis la CI complète. Vérifier le champ `breakeven_skipped` du fill journalisé. Ne pas lancer le moteur sur l'état vivant.

## Revue Grok Bot — correctifs bloquants 5 min et versions (18/11/2026)
1. Simuler `APIError` sur OHLC 5 min avec bougie 1 h disponible : aucun repli,
   aucun fill, aucun mouvement des curseurs, message de reprise au prochain cycle.
2. Simuler un trou de donnees 5 min dans les 60 h : attendre sans avancer.
   Simuler un trou definitif au-dela de la retention : repli journalise.
3. Simuler une heure partiellement traitee en 5 min dont les donnees disparaissent :
   aucun rejeu 1 h, meme apres 60 h.
4. Verifier `Dash v0.3.7 · Moteur v0.2.0` sur routes Terminal et Activite,
   en desktop et mobile 320/390 px. En preview avec etat live moteur 0.1.0,
   le bandeau doit dire **Moteur v0.1.0** et ne jamais pretendre 0.2.0 actif.
5. Palier des frais affiche a partir des fills PAPER sur les 30 derniers jours,
   independamment du prochain fill (sous reserve du bareme conforme).

## Recette moteur 0.2.0 / site v0.3.7 (18/11/2026)
1. Exécuter `python -m unittest -v`, `node --test tests/site/*.test.js`, `node --test tests/functions/*.test.mjs`. CI `quality-gates` et `guard-state` verts.
2. Rejeu isolé : copier l'état de production en répertoire temporaire **hors state/**, ne jamais lancer `python engine/run.py` directement dans le dépôt de travail. Utiliser `run_cycle(copy.deepcopy(state), ..., FakeMarket, ...)` pour comparer les sorties attendues, sans notifier.
3. Vérifier les ordres ouverts O0017, O0024, O0022, O0025 et O0026 et les positions : ID, quantité, statut, niveaux inchangés à l'import; pas de recalcul des trades passés.
4. Cas BTC 17/11 : stop 63 700, mèche 63 298, ouverture 63 700; modèle sans volume => 63 636 USDC (arrondi entier).
5. Vérifier seuils 0,05 % (contact insuffisant), frais avant/après 2 500 USD de volume, heartbeat ignoré, deux limites et un stop sur la même position, TP partiels.
6. Simuler une indisponibilité 5 min : un seul événement `execution_fallback` pour chaque repli 1 h; jamais de réécriture historique.
7. Préprod/Deploy Preview : vérifier les deux versions site et moteur (moteur du portefeuille live reste 0.1 jusqu'à activation prod); vérifier la lecture du CSV à six colonnes historiques puis sept colonnes nouvelles.
8. **Moteur non déployé en préprod** : seules des données fictives sont utilisées par les tests. Aucun workflow préprod ne doit écrire sur `main`.
9. Demander la revue Grok Bot et GO explicite de Cyril avant toute modification de `main`; le build Git de production est déjà ignoré (ADR-34). Déployer via `deploy-production-controlled` seulement.

## Publication contrôlée v0.3.6.2 — recette et exploitation
1. Les versions `X.Y.Z` et `X.Y.Z.W` sont acceptées par `.github/workflows/deploy-production-controlled.yml` ; `VERSION` doit correspondre exactement à la demande approuvée.
2. Dans `netlify.toml`, `[build].ignore` appelle `scripts/netlify-ignore-build.sh`. En contexte Git `production` ou branche `main`, ce script retourne **0** (Netlify saute le build). En contexte `deploy-preview`, il retourne **1** (build permis). Les autres branches construisent si le contenu pertinent diffère, ou si les SHA de comparaison sont absents.
3. La CLI `scripts/deploy.sh prod` publie directement `site/` et les fonctions avec `--prod` ; elle n'exécute pas le filtre de build Git. Ne l'utiliser que via `deploy-production-controlled` après GO explicite de Cyril.
4. Avant une future production : vérifier la branche/SHA approuvés, les tests Python/Node, le statut CI, les droits de l'environnement GitHub et le numéro `version.json` après publication. Vérifier la page Netlify > Build & deploy : aucune voie non approuvée (deploy hooks, UI, autres tokens/workflows) ne doit pouvoir publier.
5. Tester localement `node --test tests/site/netlify-build-gate.test.js`, `sh -n scripts/netlify-ignore-build.sh`, puis les suites habituelles. Ne jamais déclencher un vrai déploiement production pour valider un simple test.
6. En cas de publication Git inattendue : bloquer immédiatement la source de déploiement, vérifier l'historique Netlify et les SHA, puis documenter l'incident avant la prochaine release. Un build skipped n'est **pas** une garantie contre un déploiement Netlify manuel.

## Recette v0.3.6 — correctif sélection des timeframes
- Faire défiler les six TF (5 min, 15 min, 30 min, 1 h, 4 h, 1 j) : le fond jade reste strictement sur le bouton actif, et il n'y a ni superposition ni texte rogné.
- Vérifier navigations au clavier par flèches et `aria-selected`; refaire le test avec le bouton Focus et à largeur mobile (scroll horizontal si nécessaire).
- Confirmer que l'OHLC et le chandelier changent selon la période sélectionnée et que l'état reste stable lors des updates Kraken. `node --test tests/site/*.test.js`, CI guard-state / quality-gates et SHA Netlify à vérifier avant toute intégration.

## Recette v0.3.6 — haut de tuile Marchés
1. Vérifier cours BTC/USDC et statut de disponibilité après rafraîchissement, changement BTC/ETH, puis changement TF 5m/1h/1j ; le prix live conserve les mises à jour.
2. En desktop large : cours, six TF et boutons Ordres/Focus sur une barre compacte ; deuxième ligne de paires scrollable sans retour ; troisième ligne toolbar 60/120/240, Actualiser/Recentrer, nb de bougies et date de lecture.
3. Sous la toolbar : vérifier la ligne OHLC avec le survol stable malgré le flux et la ligne MA20/MA50/RSI ; les chiffres doivent correspondre à ceux du chandelier, pas à des valeurs calculées ailleurs.
4. À 320/390/768/1280/1440 px et zoom 125/200 %, vérifier absence de chevauchement et retour adapté des contrôles, actions accessibles au clavier, et réduction des animations.
5. `node --test tests/site/*.test.js`, CI guard-state/quality-gates, commit Netlify exact. Aucun passage préprod/prod sans GO.

## Recette v0.3.6 — analyse de la paire compactée
1. Vérifier six indicateurs toujours visibles, lisibles en grille 3×2 sur desktop et 2×3 sur mobile.
2. Sous la réglette, une seule liste détaillée subsiste : tableau Niveau / Prix USDC / Distance / Ordre, sans double rangée de puces. Le graphique conserve ses propres marqueurs.
3. Vérifier deux ordres différents ayant la même valeur de stop : les deux restent séparés, les boutons mènent au bon détail, une protection d'achat non exécuté indique « si achat exécuté ».
4. La liste des événements de la paire présente au plus trois lignes, reliées à Activité & Bot ; erreurs API, changement de crypto, zoom mobile et actualisations ne doivent pas provoquer de sauts imprévisibles.
5. Exécuter `node --test tests/site/*.test.js`, puis vérifier quality-gates, guard-state, dernier SHA Netlify ; PR #66 **draft** et `preprod`/production intacts en attente de GO.

## Recette v0.3.6 — zone sous le graphique
1. Marché > choisir BTC puis ETH : les six indicateurs de la paire sont bien sous le chandelier ; colonne de droite libérée sans double affichage.
2. Réglette : vérifier cours observé, PRU uniquement si position, limite et stops/TP uniquement s'ils existent, étiquette « si achat exécuté » sur protections d'un achat en attente. Vérifier les distances depuis le prix réel courant et les valeurs manquantes affichées comme telles.
3. Activité récente : maximum quatre événements de la paire explicitement trouvés dans le journal public, jamais des décisions supposées à partir de leur horaire. Clic Journal ouvre la vue Activité & Bot.
4. Vérifier la stabilité au refresh, la largeur 390/768/1440 px et le mode Focus, la navigation clavier et la lisibilité des données. Tests `node --test tests/site/*.test.js` et CI, contrôle du SHA Netlify.
5. Branche `feature/v0.3.6` seulement, PR #66 en brouillon. Aucun passage préprod ou production sans GO explicite.

## Recette v0.3.6 — stabilité des hauteurs du carnet (18/11/2026)
- Dans Marché, tester prix changeant, rafraîchissement manuel, erreur de l'API et changement de paire : aucun des trois blocs meilleur achat/spread/meilleure vente ne doit changer de hauteur et le tableau réserve toujours 10 niveaux.
- Dans Ordres & protections, titres sur une ligne et descriptions sur deux lignes maximum ; les cartes restent de hauteur uniforme même avec plusieurs TP. Vérifier lecture du texte intégral au survol / par technologie d'assistance, et accès aux détails au clic.
- Mesurer en particulier à 320, 390, 768 et 1440 px ainsi qu'avec zoom navigateur à 125 % et 200 %. Si les prix sont illisibles ou coupés, ajuster la taille des colonnes sans fausser les données.
- Exécuter `node --test tests/site/*.test.js`, conserver `VERSION=0.3.6`, PR #66 en feature sans fusion ni production.

## Recette v0.3.6 — Terminal unifié + heartbeat (feature uniquement)
1. Confirmer `VERSION=0.3.6`, PR #66 brouillon, Netlify avec SHA identique au dernier commit feature. `preprod` reste sur v0.3.4 et `main` inchangée.
2. Naviguer entre `#/terminal` et `#/activite` à 390, 768 et 1440 px. Dans Terminal, barre interne Synthèse / Marché / Ordres / Performance, et mobile cinq raccourcis dont Activité. Vérifier `#/marches`, `#/portefeuille`, `#market-card` et `#orders-panel` comme liens anciens.
3. Sur Terminal, vérifier cockpit compact, chandelier et carnet au premier plan, positions et ordres, graphe performance, scanner en bas. Tous les IDs d'origine existent une seule fois, les sélections et flux Kraken ne sont pas réinitialisés.
4. Simuler un fichier heartbeat dans les tests (ne PAS l'ajouter à `decisions/` du dépôt) : `type=heartbeat`, `actions=[]`, note non vide, timestamp ISO avec fuseau, ID unique. Le moteur ne crée aucun ordre, aucun événement rejeté et ne touche pas à `last_decision` ou `processed_decisions`.
5. Compteur : dernière décision 17/11 22:09, heartbeat 18/11 03:09, heure locale 07:54 => prochain passage **08:09, dans 15 min**, jamais un faux retard. Sans fichier récent, « estimation dépassée », non un retard certain.
6. Les passages sans modification sont repliés en gris dans Activité. Tester une nouvelle lecture du dossier GitHub sans changement de `state/`, avec ETag et limites d'API.
7. Exécuter `python -m unittest discover -s tests` et `node --test tests/site/*.test.js`. Vérifier `quality-gates` et `guard-state`, puis contrôle manuel du rendu/du clavier/du mobile.
8. **Grok ne doit activer la production de heartbeats qu'après un GO distinct de Cyril et la release production confirmée**. Aucune fusion automatique.

## Recette UX v0.3.5 — branche feature uniquement (17/11/2026)
1. Vérifier l'aperçu Netlify de la PR et son SHA exact ; contrôler le badge FEATURE et `VERSION=0.3.5`.
2. Marchés : sélectionner BTC, ETH puis SOL ; carnet Kraken récupéré séparément pour chaque paire, 10 niveaux max, bid inférieur ou égal à ask, spread en prix et %, heure d'instantané. Tester coupure réseau/onglet masqué et changement rapide de paire : aucun ancien carnet ne doit rester présenté comme frais.
3. Mode Focus : indicateurs du scanner 4 h/1 j, RSI et ATR cohérents ; lorsqu'une paire n'est pas calculée afficher l'indisponibilité. Ruban de niveaux PAPER : un stop/TP associé à un achat non exécuté indique « si achat exécuté ». Cliquer pour afficher le détail de l'ordre, aucune simulation modifiée.
4. Performance : période 24 h, 7 j, tout ; bornes et écart vs BTC calculés seulement si données présentes. Vérifier les valeurs indisponibles et l'absence d'extrapolation.
5. Décisions : ouvrir la chronologie et vérifier les liens de décision seulement quand `decision_id` est présent. Vérifier le clavier, Escape mode Focus et responsive à 390/768/1440 px, plus `prefers-reduced-motion`.
6. Tests Node `node --test tests/site/*.test.js` et contrôles CI. Ne rien modifier dans moteur, `state/`, `decisions/`, `main` ; GO indépendant requis pour preprod puis production.

## Recette feature v0.3.4 — Focus marché et micrographe
- Depuis `feature/v0.3.4` en Deploy Preview, vérifier le SHA exact de Netlify puis ouvrir Marchés et activer « Mode Focus ». Contrôler Esc, Tab, focus rendu au déclencheur, absence de scroll arrière-plan, largeur desktop et petit écran.
- Cliquer sur « Graphique ↗ » depuis une position et un ordre : la paire choisie doit être affichée, ainsi que son cours et ses niveaux; cliquer un ordre du panneau pour ouvrir son détail.
- Vérifier qu'un cours indisponible donne « — », qu'aucun stop ou TP absent n'est inventé, et que la légende OHLC conserve la bougie survolée pendant la mise à jour des cours; les niveaux d'ordres restent conditionnels quand l'achat n'est pas exécuté.
- Micrographe 24 h / 7 j : moins de deux cycles = message, trous > 2 h 30 = lignes disjointes; prix jamais interpolés. Tester via `node --test tests/site/focus-ux.test.js` puis tests Node/Python globaux.
- Mobile 390 px : barre basse Accueil/Marchés/Ordres/Performance, aucune superposition avec le contenu et possibilité d'ouvrir le menu latéral. Vérifier `prefers-reduced-motion` et le comportement pendant le polling Kraken.
- Ne jamais toucher au moteur PAPER, `state/`, `decisions/` ni à la production.

## Webhook Grok Bot — séquence après commit (PR #60)
- Le workflow capture la position de départ de `state/journal.jsonl`, exécute le moteur, puis commit et pousse l'état sur `main`.
- La notification Grok Bot vient **après** l'étape « Commit de l'etat ». Si le commit/push échoue, le job échoue et aucun webhook n'est envoyé. Si aucun fichier d'état n'a changé, l'état courant est déjà à jour et l'étape suivante peut notifier.
- Le script envoie un seul POST JSON pour tous les fills du cycle. Sans fill : aucun POST et log « aucune exécution ». Après acceptation du POST : log « webhook envoyé ». Secrets absents, erreur HTTP/réseau : log « échec d'envoi » ; le cycle n'est pas bloqué.
- Les seules variables sensibles utilisées sont les secrets GitHub Actions `GROKBOT_WEBHOOK_URL` et `GROKBOT_WEBHOOK_KEY`. Ne jamais les afficher ni les ajouter au dépôt.
- Tests : `python -m unittest tests.test_grokbot_webhook -v` (ou la commande globale CI). Vérifier les trois statuts et le contrôle de branche.
- Cette notification ne change aucune décision ni exécution PAPER. Aucun déploiement de production sans accord explicite de Cyril.

## Publication production — GO unique (ADR-28, remplace la validation humaine ADR-27)
- Cyril autorise explicitement une version et un SHA précis ; une CI verte ou une PR fusionnée ne vaut pas GO.
- Après revue Grok Bot, tests et recette préprod, l'assistant soumet `.github/prod-release-request.json` sur `deploy/prod-request` uniquement après ce GO.
- Environnement `production` : `Required reviewers` désactivé par Cyril le 15/11/2026 ; secret `NETLIFY_AUTH_TOKEN` conservé ; branche autorisée `deploy/prod-request` seulement.
- Le workflow doit être synchronisé sur `deploy/prod-request` avant activation. Vérifier SHA, version, tests et `version.json` après déploiement.
- `approved_by` est déclaratif, non une preuve cryptographique ; limiter les droits de modification de la branche et du workflow.
- Ne jamais publier automatiquement ni modifier `state/` ou `decisions/`. Si Netlify indique `Auto Publishing Locked`, vérifier la publication effective.

## Recette finale v0.3.1 avant proposition de production
- Vérifier VERSION 0.3.1, commit affiché, bandeau pending avec nouveau stop et TP1/TP2, ancien stop actif.
- Vérifier journal ordre à deux TP et TP unique historique ; vente limite avec break-even sans stop conservée sans effet.
- Lancer les tests Python, site, functions et la CI ; inspecter le déploiement Netlify preprod sur mobile.
- Demander l'accord explicite de Cyril avant toute fusion dans main ou déploiement de production.

## Recette v0.3.1 — finitions TP (P2)
- Sur un ordre de vente avec `pending_exits`, vérifier la mention de la date d’activation et la visibilité du stop actuellement actif.
- Sur un événement `order_placed` avec `take_profits`, vérifier chaque TP et sa fraction.
- Rejeter `market_buy` et `place_limit` achat avec `breakeven_after_tp1: true` sans `stop_loss`; ne pas modifier les décisions historiques.
- Exécuter les tests Python et Node, puis demander la revue Grok Bot ; fusion dans `preprod` uniquement après CI verte.

## Recette v0.3.0 — sorties par paliers (ADR-26)
- Vérifier TP1→TP2, TP1→stop remonté, stop avant TP1, collision stop/TP en même 5 min, TP1 puis stop plus tard dans l'heure.
- Vérifier anciennes décisions `take_profit`, rejet fractions invalides, arrondis et modification `update_exits`.
- Vérifier les lignes TP1/TP2, le stop résiduel, gain/risque net depuis le PRU, journal et historique.
- Exécuter `python -m unittest -v`, `node --test tests/site/*.test.js`, `node --test tests/functions/*.test.mjs` ; revue Grok Bot, puis seulement fusion vers `preprod`.

## Recette retour interface production — ADR-25
- Vérifier les empreintes des 6 fichiers `site/` contre `main` et l'absence de `site/workspace-tabs.js`.
- Vérifier les liens du menu, KPI, chandelier 1h, interactions de survol, tableaux, rafraîchissements, responsive iOS/Android et affichage du commit.
- Exécuter les tests Node/Python et les contrôles GitHub ; vérifier l'absence de modifications `state/`, `decisions/` et moteur.
- Après validation, intégrer dans `preprod` uniquement, puis contrôler le déploiement Netlify. Ne pas toucher à la production.

## Recette v0.3.1 — Nocturne Signal
- Contrôler `VERSION=0.3.1` sur preprod et `site/version.json` généré par Netlify ; le bandeau doit afficher `v0.3.1`, `commit <SHA>` et `branche preprod`.
- Vérifier absence de navigation doublonnée sur desktop (menu gauche uniquement), onglets mobiles, logo K/, palette sans violet, contrastes et focus clavier.
- Tester les 4 rubriques, le graphique (sélection, rafraîchissement, survol), positions, ordres, prix en direct, reduced-motion et tailles 375/390/430/1280 px.
- Exécuter `node --test tests/site/*.test.js` et `python -m unittest -v` ; confirmer les deux workflows CI. Aucune publication main sans accord explicite.

## Recette v0.3.0 — rubriques mobiles
- Ouvrir `#overview`, `#market-card`, `#orders-panel`, `#performance-panel` sur iPhone et desktop ; vérifier les quatre rubriques et le retour navigateur.
- Vérifier que le chandelier se met à jour et que les données restent cohérentes lorsque la rubrique est masquée puis affichée.
- Vérifier les liens historiques `#positions-panel`, `#trades-panel`, `#journal-panel`, `#dec-h`, l'accès clavier et VoiceOver.
- Exécuter `node --test tests/site/*.test.js` et `python -m unittest -v`, puis recette Safari réelle.
- Ne pas déployer en production sans accord explicite.

## v0.2.2 — lot d'intégration UX (PR #28–#35)
- Référentiels modern-web-guidance et kraken-motion-ux, checklist UX.
- Navigation mobile : fermeture et restitution du focus, tests unitaires.
- Chandelier : aide textuelle, préférences normalisées, tests de régression et commandes plus lisibles.
- Ordres et scanner : meilleure hiérarchie des états visuels ; cibles tactiles et focus renforcés.
- Les changements concernent uniquement la présentation du dashboard ; aucun moteur, état ou décision modifié.
- Validation : `node --test tests/site/*.test.js`, `python -m unittest -v`, contrôle CI et recette sur Safari iPhone / desktop, sans mouvement imposé.
- Intégration de remplacement des PR #28–#35 : ne pas les fusionner à nouveau. Aucun déploiement de production autorisé.

# Kraken Paper : runbook (opérations)

## Recette ciblée v0.2.2 — intégrité equity
- Vérifier avec des fixtures locales qu'une equity négative, une valeur vide/espaces et un benchmark BTC négatif sont refusés.
- Confirmer que les cycles valides, y compris un benchmark absent, restent affichés et que le dashboard conserve son dernier snapshot valide en cas de rejet.
- Exécuter les tests Node et Python, puis une recette navigateur sur la branche de préproduction. Aucun déploiement production sans validation.


- Vérifier la cascade CSS mobile : aucune largeur minimale tablette de 620/760 px ne doit subsister pour les tableaux Positions/Marqueurs à 390 px ; contrôler les fiches SOL/BTC/ETH sur iPhone.

- Régression mobile : sur iPhone, vérifier que chaque fiche SOL/BTC/ETH tient entièrement à l'intérieur de Positions, sans bande noire à droite, puis contrôler Ordres, Trades et Marqueurs.

## Recette groupée UX mobile
- Tester largeur 320, 375, 390, 430, 680, 768 et 1280 px : aucun débordement horizontal du contenu principal.
- Ordres : crypto/sens/montant/distance visibles immédiatement ; bouton Détails ouvre prix/stop/objectif/risque ; filtres et statut proche/atteint lisibles sans occuper toute la fiche.
- Positions, trades et marqueurs : chaque valeur possède un libellé visible ; filtres et tri fonctionnent ; état vide et données manquantes restent compréhensibles.
- Vérifier chandeliers, KPI, navigation latérale, journal, décisions, performance et actualisations en direct sans perte de sélection.
- Exécuter `node --test tests/site/*.test.js` puis comparer visuellement iOS Safari, Android Chrome et desktop sur le SHA effectivement déployé en préproduction. Aucun déploiement production sans validation explicite.

## Recette intégrée du dashboard
- Vérifier commit affiché, sources GitHub, cours Kraken, chandelier 1 h par défaut et changement rapide de paire/période.
- Supprimer une paire sélectionnée de l'ensemble des paires disponibles dans un état fictif : le graphique doit revenir effectivement sur BTC.
- Contrôler simultanément scanner, portefeuille, journal et historique sur plusieurs actualisations, puis simuler une panne Kraken et une panne de source d'état.
- Tests automatisés : `node --test tests/site/*.test.js`. Les tests statiques ne remplacent pas la recette navigateur.

## Recette du scanner : progression et nouvelles paires
- Vérifier que la progression augmente à chaque réponse Kraken et disparaît à la fin, même en cas de panne partielle.
- Ajouter dans un état fictif de test une paire absente de la watchlist et déclencher `onState` : le scanner doit la charger immédiatement.
- Vérifier les erreurs, la récupération automatique et l'absence de rafales de requêtes. Exécuter `node --test tests/site/*.test.js`.

## Recette scanner de marchés
- Ouvrir les marqueurs, vérifier la progression et le calcul BTC avant les autres paires.
- Déclencher deux rafraîchissements rapprochés : ils doivent être regroupés, sans multiplier les vagues de requêtes simultanées.
- Tester une panne Kraken et son retour ; les derniers marqueurs valides restent visibles, l'erreur est signalée.
- Exécuter `node --test tests/site/*.test.js` et vérifier le SHA de préproduction après fusion.

## Recette — session du chandelier
- Sélectionner ETH, 4 h, 240 bougies ; recharger l'onglet et vérifier la conservation de ces trois choix.
- Ouvrir une nouvelle session et vérifier le défaut BTC/1 h/120 ; tester la disparition d'une paire et le repli BTC.
- Cliquer Actualiser : la dernière heure de lecture ne change qu'après une réponse OHLC valide ; contrôler la stabilité du survol et du zoom.
- Vérifier clavier, mobile et `node --test tests/site/*.test.js`.

## Recette du chandelier en préproduction
- Changer rapidement BTC/ETH/SOL puis 5 min/15 min/1 h pendant le chargement ; le dernier choix doit toujours gagner.
- Déconnecter momentanément l'API OHLC : le dernier graphique valide reste visible, le message indique l'échec, le prochain rafraîchissement réessaie.
- Contrôler le survol des bougies pendant les actualisations, les 60/120/240 bougies, les labels et le mobile.
- Exécuter `node --test tests/site/*.test.js` et vérifier le commit réellement publié dans l'en-tête Netlify.

## Recette — intégrité des données publiques
- Vérifier prix Kraken en direct, statut partiel si une paire manque, et repli sur les prix du dernier cycle si API indisponible.
- Tester localement des cycles CSV hors ordre et une ligne JSONL corrompue : le dashboard doit garder le snapshot précédent et afficher une erreur, sans effacer d'événement.
- Vérifier l'actualisation normale après correction et l'absence de secrets/ordres réels. Tests : `node --test tests/site/*.test.js`.

## Recette ciblée — historiques volumineux
- Ouvrir Performance sur 24 h, 1 an et Tout ; vérifier que le nombre de cycles correspond aux données et que les extrema sont visibles.
- Avec une série BTC incomplète, vérifier que le graphique ne relie pas deux segments séparés par une lacune.
- Vérifier le rendu sur mobile et l'absence de ralentissement avec un historique long ; `node --test tests/site/*.test.js`.
- Vérifier que la préproduction affiche le SHA fusionné après déploiement ; aucune opération sur `main` ni sur `state/` ou `decisions/`.


Heures en heure de Paris. Commandes à lancer depuis la racine du dépôt.

## Contrôles UX v0.2.1 (branche feature)

Stabilisation du rafraîchissement UX v0.2.1 : une seule lecture d'état à la fois, validation et publication groupée portefeuille/equity/journal, nouvelle tentative après snapshot invalide, réponses de prix hors ordre ignorées, journal/trades/courbe reconstruits uniquement lors d'un nouveau snapshot (pas toutes les 15 s). Aucun changement du moteur PAPER. Recette : vérifier filtres journal et profondeur après plusieurs tickers 15 s, courbe inchangée hors nouveau cycle, nouveaux événements après cycle, erreurs API et reprise, cohérence de l'horodatage, mobile et survol des chandelles. Le site doit rester PAPER/lecture seule.

Explorateur d'historique UX v0.2.1 : courbe 24 h, 7 j, 30 j, 90 j, 6 mois (180 j), 1 an (365 j), tout; journal 40/100/250/tous les événements disponibles, avec indication explicite de la profondeur chargée et des filtres sur les entrées visibles. Aucun événement ni point de courbe inventé, lecture seule. Recette : vérifier 90 j/6 mois/1 an/tout avec historique court; journal 40/100/250/tout et compteur exact; filtrer une entrée ancienne après passage à tout; rafraîchissement, mobile, clavier, performance navigateur sur journal volumineux.

Itération de stabilisation UX v0.2.1 : déconnexion temporaire et reconnexion garantie du MutationObserver pendant le tri DOM (sans masquer les nouvelles données), étiquette du chandelier fondée sur le nombre réel de bougies chargées, tests de non-régression et maintien de la navigation/du survol. Aucun changement de simulation. Recette : trier positions et laisser passer un cycle de rafraîchissement, vérifier que les nouvelles lignes sont prises en compte; changer 60/120/240 bougies sur paires peu fournies, contrôler les compteurs, survol et absence de nouvelle requête; tester mobile.

Durcissement UX v0.2.1 : correction du tri P&L négatif (signe moins typographique), protection contre la rétroaction MutationObserver lors des tris, accès direct Performance/Historique depuis la navigation, nom accessible du graphique portefeuille, tests d'intégration HTML/navigation/labels/scripts et non-régression du tri. Contrôler navigation clavier/mobile, tri de deux pertes (−0,80 devant −10,00), filtres sur mises à jour automatiques, performance et journal; vérifier commit Netlify après déploiement.

Lot UX v0.2.1 performance et journal : périodes de courbe 24 h / 7 j / 30 j / tout (cycles réels uniquement), compteur de cycles, journal filtrable par texte et type d'événement, remise à zéro, tests Node et ergonomie mobile. Aucune modification moteur, stratégie ou données PAPER. Vérifier 24 h/7 j/30 j/tout sur la courbe, périodes avec moins de deux cycles, filtres journal, compteurs et stabilité après nouveau cycle; test mobile 375/820 px.

Lot UX portefeuille v0.2.1 : tri des positions (valeur, P&L signé, nom), recherche crypto, recherche et filtre achat/vente dans l'historique des trades, compteurs et réinitialisation, affichage mobile. Opérations uniquement visuelles, aucun changement moteur, stratégie, état ou décisions. Vérifier tri P&L avec pertes négatives françaises (−), retour à l'ordre initial, filtres et réinitialisation après rafraîchissement, colonnes mobiles à 375/820 px et navigation clavier.

Lot graphique UX v0.2.1 : choix de fenêtre 60/120/240 bougies, recentrage manuel, lecture mobile améliorée, conservation du survol et de la vue pendant les rafraîchissements. Aucun changement de données, moteur ou stratégie. Vérifier le choix de fenêtre sur BTC et SOL, le recentrage après zoom/déplacement manuel, le survol pendant un rafraîchissement, les dimensions mobiles et le clavier.

Correctif UX 0.2.1 : remise à zéro des filtres en un clic, message explicite sans résultat, tests Node automatisés sur les filtres d'ordres et de marché. Aucun changement moteur. Vérifier aussi le retour du focus dans le champ de recherche après « Effacer les filtres ».

Lot `feature/v0.2.1-market-workspace` : tester recherche d'une crypto et d'un identifiant d'ordre, filtre achat/vente, filtre de tendance 4 h / 1 j, compteurs affichés, réinitialisation des filtres, stabilité après rafraîchissement des données, détails d'ordre ouverts, affichage à 375/820/1440 px, navigation clavier. Les filtres n'agissent que sur les lignes HTML et ne doivent pas changer les ordres ni les indicateurs.

Pour `feature/v0.2.1-readable-orders`, contrôler les boutons Détails/Réduire sur ordinateur et mobile, les lignes développées après rafraîchissement des prix, l'accessibilité clavier et les colonnes masquées en mobile. Le déploiement Netlify de `preprod` est manuel et doit être vérifié par commit affiché dans le header.

Avant fusion dans `preprod`, vérifier les ancres de navigation au clavier et sur mobile, la position des tableaux, le graphique 1 h par défaut, les survols de bougies pendant un rafraîchissement et `prefers-reduced-motion`. Exécuter les tests Python et Node décrits ci-dessous. Ne pas déployer sur `main` sans accord explicite.

## Déployer

Il n'y a **qu'un seul site Netlify, `kraken-paper`**, non relié à GitHub : on déploie à la main avec `scripts/deploy.sh`, qui exporte le commit
**poussé** sur `origin` (`git archive`, donc aucun fichier local ou ignoré, ni `.ntfy_topic`), écrit
`site/version.json` (version, environnement, commit, branche, heure) et envoie le dossier.

| Environnement | Branche | Site Netlify | Commande |
| --- | --- | --- | --- |
| préprod | `preprod` | https://preprod--kraken-paper.netlify.app (alias, non production) | `scripts/deploy.sh preprod` |
| feature | `feature/<nom>` | `https://feature-<nom>--kraken-paper.netlify.app` (alias) | `scripts/deploy.sh feature feature/<nom>` |
| **prod** | `main` | https://kraken-paper.netlify.app (déploiement de production) | `CONFIRM_PROD=oui scripts/deploy.sh prod` **après l'accord de Cyril** |

Site id Netlify : `01cb62cb-bc97-4b2c-be7e-21960b44bfd5`. Le badge d'environnement de l'en-tête se déduit de l'adresse.

Moyen d'envoi :
- **Préprod et features : Netlify CLI obligatoire** : `NETLIFY_AUTH_TOKEN=<jeton personnel> scripts/deploy.sh preprod`
  (`netlify deploy --alias preprod`, **sans** `--prod` : la prod n'est pas touchée). Jeton créé dans Netlify → User settings
  → Applications → Personal access tokens, jamais commité.
- **Prod** : la même CLI (`--prod`), ou le connecteur Netlify de Grok Bot : l'outil `deploy-site` renvoie une commande
  `npx @netlify/mcp ... --proxy-path "<chemin>"` ; lancer `NETLIFY_MCP_PROXY="<chemin>" CONFIRM_PROD=oui scripts/deploy.sh prod`.
  **Ce connecteur ne fait que des déploiements de production** : ne jamais l'utiliser pour la préprod (le script le refuse).

Après déploiement : ouvrir l'adresse, vérifier le badge d'environnement, la version et le commit dans l'en-tête, et que
la console du navigateur est sans erreur. Après un déploiement de préprod, vérifier aussi que la prod n'a pas changé :
`curl -s https://kraken-paper.netlify.app/app.js | cmp - <(git show origin/main:site/app.js)`.
Accès public : dans Netlify → Site configuration → Access & security → Visitor access, la protection doit être désactivée
pour les déploiements non production (sinon la préprod demande une connexion).

## Mettre en prod une release (procédure contrôlée — ADR-28, remplace ADR-27)

**La fusion de code et la publication sont deux opérations distinctes.** Aucune commande directe `scripts/deploy.sh prod` ni `scripts/release.sh` ne doit être utilisée comme raccourci de publication. La v0.3.1 est déjà publiée ; pour une future release, obtenir un nouvel accord explicite de Cyril.

1. Faire relire et valider la PR dans `preprod` par Grok Bot, vérifier les contrôles CI et la recette sur l'alias Netlify.
2. Préparer le candidat code sur `main` **uniquement après autorisation explicite**, en préservant les versions courantes de `state/` et `decisions/`. Vérifier les SHA, les tests et la sauvegarde. Les cycles de production peuvent continuer.
3. Depuis `deploy/prod-request`, après autorisation explicite, soumettre la demande `.github/prod-release-request.json` avec version et SHA approuvé. Ne jamais faire cette opération depuis une branche de fonctionnalité.
4. L'accord explicite de Cyril dans le chat pour une version et un SHA précis constitue l'unique GO humain. L'environnement GitHub `production` conserve son secret et sa restriction à `deploy/prod-request`, mais **Required reviewers** est désactivé selon ADR-28. Le champ JSON `approved_by` reste une trace, pas une authentification. Contrôler les droits d'écriture sur la branche de demande.
5. Vérifier le résultat réel sur `https://kraken-paper.netlify.app/version.json`, le dashboard et le cycle moteur suivant. Si la vérification échoue, ne pas considérer le site comme publié.

**Blocage Netlify « Auto Publishing Locked » :** un déploiement peut être téléversé sans devenir la version servie sur le domaine de production. Contrôler dans Netlify **Deploys** si le déploiement est publié ou bloqué. Un opérateur autorisé doit décider d'autoriser la publication et de publier le bon déploiement dans Netlify ; ne pas désactiver le verrou par automatisation non approuvée. Recontrôler le SHA réellement servi dans `version.json`. En cas de décalage, arrêter la procédure et consigner l'incident.

L'ancien script de release peut encore contenir des protections utiles, mais il **ne remplace pas** le GO explicite de Cyril, le verrou Netlify ni les contrôles `state/` et `decisions/`. Aucune deuxième approbation GitHub n'est requise selon ADR-28.

## Déclenchement horaire du moteur

Deux déclencheurs lancent le même workflow `engine.yml` sur `main` :

| Source | Horaire (UTC) | Rôle |
| --- | --- | --- |
| Fonction planifiée Netlify `engine-trigger` | minute 9 | Déclencheur principal, **à partir de la mise en prod** de la v0.2.0 |
| Cron GitHub Actions | minute 7 | Secours : souvent en retard, parfois sauté sur un dépôt gratuit |

Netlify n'exécute les fonctions planifiées que sur le **déploiement de production** publié. Un déploiement préprod ou
alias ne les fait pas tourner.

Un double déclenchement est sans risque : le moteur rejoue seulement les bougies 1 h clôturées pas encore traitées
(`last_candle`) et ignore les décisions déjà appliquées (`processed_decisions`) ; le workflow a un groupe de concurrence
`kraken-paper-engine` (`cancel-in-progress: false`), donc deux cycles ne tournent jamais en parallèle. La fonction
vérifie aussi qu'aucun run n'est déjà `in_progress` ou `queued` avant d'appeler `workflow_dispatch`.

## Lancer un cycle à la main

```bash
gh workflow run engine.yml --ref main
gh run list --workflow engine.yml -L 3
```
Ou GitHub → Actions → engine → Run workflow (branche **main** ; depuis une autre branche le job est ignoré).
Un push dans `decisions/` sur `main` lance aussi un cycle.

Sur le dash, la carte « Prochains passages » vise la minute 9 (heure de Paris comme de UTC) et rappelle que le cron
GitHub (minute 7) prend le relais si besoin. La fonction planifiée ne tourne qu'en production : en préprod le texte le
dit, c'est attendu.

## Datation des exécutions

Le moteur décide toujours sur les bougies 1 h clôturées, mais date le fill à l'ouverture de la première bougie 5 min
de cette heure qui touche le niveau (`time_source: m5`). Kraken ne garde qu'environ 60 h de bougies 5 min : au-delà,
ou en cas d'erreur API, repli sur l'ouverture de la bougie 1 h (`time_source: hour_open`), sans changer le prix ni les
frais. Ne pas réécrire `state/` ni le journal pour corriger un ancien horaire : le dash (`fillMarkerTs`) place le
marqueur des fills sans `time_source` (T0001, T0002) sur la première bougie affichée qui touche le prix dans l'heure
précédant le ts enregistré.

## Un cycle a échoué

1. `gh run list --workflow engine.yml -L 5` puis `gh run view <id> --log-failed`.
2. **Tests en échec** : le cycle ne tourne pas, l'état n'est pas touché. Corriger le code par PR.
3. **API Kraken indisponible** : le moteur saute l'étape et note l'erreur dans `last_cycle_errors` et le journal.
   Rien à faire, le cycle suivant rattrape les bougies manquées.
4. **Décision illisible** : un avertissement apparaît dans le journal. Corriger le JSON dans un **nouveau** fichier
   avec un **nouvel** `id` (ne jamais réutiliser un `id`).
5. **Conflit de push** : le workflow réessaie trois fois avec `pull --rebase`. Si cela échoue encore, relancer le cycle.
6. **État corrompu** (seul cas où l'on touche `state/` à la main, avec l'accord de Cyril) :
   ```bash
   git log --oneline -- state/            # trouver le dernier commit d'état sain
   git checkout <sha> -- state/
   git commit -m "fix(state): restauration de l'etat au commit <sha> (raison)"
   git pull --rebase && git push origin main
   ```
   Le moteur reprend depuis `last_candle` de cet état et rejoue les bougies suivantes. Noter l'incident dans le CHANGELOG.

## Changer le canal ntfy

Le nom du canal sert de mot de passe : le changer s'il a fuité.
```bash
NEW="kraken-paper-$(head -c 9 /dev/urandom | base64 | tr -dc 'a-z0-9' | head -c 12)"
echo "$NEW" > .ntfy_topic                 # fichier local gitignoré
gh secret set NTFY_TOPIC --body "$NEW"    # secret GitHub Actions
```
Puis donner le nouveau nom à Cyril pour qu'il s'abonne dans l'app ntfy et supprime l'ancien abonnement.

## Jeton GITHUB_DISPATCH_TOKEN (fonction Netlify)

Variable d'environnement du site `kraken-paper` (id `01cb62cb-bc97-4b2c-be7e-21960b44bfd5`), nom
`GITHUB_DISPATCH_TOKEN`, scopes **builds**, **functions** et **runtime** (le plan Netlify actuel refuse un scope limité
à `functions` seulement ; `post_processing` est exclu car incompatible avec un secret), contextes `production`,
`branch-deploy`, `deploy-preview` et `dev` (un secret n'accepte pas le contexte unique « all »), marquée secret.
Jamais dans le dépôt, jamais dans les logs, jamais en argument visible d'une commande.

C'est un jeton GitHub **fine-grained** : accès au seul dépôt `cyrillaferrere/kraken-paper`, permission **Actions** en
lecture et écriture, rien d'autre. Expiration actuelle : **90 jours, vers le 12/02/2027**.

Rotation, avant expiration (ou si le jeton a fuité) :

1. Créer un nouveau jeton sur https://github.com/settings/personal-access-tokens/new avec les mêmes réglages
   (nom `kraken-paper-dispatch`, dépôt `kraken-paper` seulement, Actions : Read and write).
2. Le poser à la place de l'ancien, sans afficher la valeur, par l'API Netlify ou le tableau de bord
   (Project configuration → Environment variables). En CLI, seulement si la valeur vient d'une variable d'environnement
   et n'est pas échoée, avec `--secret` et les scopes `builds`, `functions`, `runtime` (pas `functions` seul : le plan
   l'interdit) et les quatre contextes explicites. Ne pas lancer `netlify env:list` sans masquer les valeurs.
3. Vérifier un dispatch (logs ci-dessous, ou un `workflow_dispatch` manuel).
4. Révoquer l'ancien jeton sur GitHub.

## Logs de la fonction engine-trigger

Disponibles seulement après un déploiement de **production** (et donc après l'accord de Cyril pour la v0.2.0) :

- Netlify → site `kraken-paper` → Functions → `engine-trigger` → Logs
- ou `netlify logs:function engine-trigger --site 01cb62cb-bc97-4b2c-be7e-21960b44bfd5`

On doit voir `dispatch HTTP 204` (succès) ou `skip: un cycle engine est déjà in_progress ou queued`. Le jeton ne doit
jamais apparaître. Puis vérifier le run GitHub : `gh run list --workflow engine.yml -L 5` (événement `workflow_dispatch`).

## Problèmes fréquents

| Symptôme | Cause | Action |
| --- | --- | --- |
| Le dash affiche un état en retard de quelques minutes et la pastille « Source de secours » | Limite de l'API GitHub (60 requêtes/h par IP) atteinte ou API en erreur : repli sur raw.githubusercontent.com, qui a un cache d'environ 5 min | Rien : retour automatique à l'API après la remise à zéro de la limite (au moins 10 min). Éviter d'ouvrir beaucoup d'onglets. |
| « Dernier cycle moteur : plus de 2 h » | Le cron GitHub peut partir en retard ou sauter un créneau. À partir de la v0.2.0 en prod, le déclencheur principal est la fonction Netlify (minute 9 UTC) | Vérifier les logs de `engine-trigger` et qu'un run `workflow_dispatch` apparaît dans Actions. Si le jeton a expiré (vers le 12/02/2027) : le renouveler (section ci-dessus). Sinon lancer un cycle à la main. Un dépôt public inactif 60 jours désactive aussi les crons GitHub : les réactiver dans Actions. |
| Graphiques vides, message « bibliothèque » | CDN jsDelivr injoignable | Le tableau des marqueurs reste utilisable ; réessayer plus tard. |
| « Bougies Kraken indisponibles » ou marqueurs « indisponible » | Limite publique Kraken ou API en panne | Nouvel essai automatique (1 à 3 min). |
| Décision non appliquée | `id` déjà utilisé, JSON invalide, ou API Kraken absente pendant le cycle | Lire le journal ; si API absente, elle sera retentée automatiquement. |
| Le contrôle CI `guard-state` échoue | La branche modifie `state/` ou `decisions/` | Retirer ces changements (`git checkout origin/main -- state/ decisions/`), ils n'ont rien à faire hors `main`. |
| Un ordre affiche « Niveau atteint en direct » | Le prix live a touché le niveau, mais le moteur n'exécute qu'à la clôture de la bougie 1 h | Attendre le cycle suivant. |

## Contrôle qualité des PR (v0.3.0, préparation)

Le workflow `.github/workflows/quality.yml` (`quality-gates / quality`) s'exécute sur les PR vers `preprod` et `main`, les pushes sur `preprod`, `feature/*`, `fix/*`, et manuellement. Il teste le moteur **sans exécuter de cycle**, les calculs du dash, la fonction planifiée, la syntaxe JS/Bash et les invariants de déploiement. Sur PR, `CHANGELOG.md` et `docs/HANDOFF.md` doivent être modifiés. Le workflow historique `guard-state / code-only` continue de protéger `state/` et `decisions/`.

**Configuration cible des protections, non activée** : sur **`preprod` uniquement**, créer un ruleset imposant les PR et les checks `quality-gates / quality` et `guard-state / code-only`, interdisant force-push et suppression. Vérifier les noms exacts des checks après exécution. Sur **`main`**, ne pas rendre obligatoires les PR ni ces checks : le moteur (`github-actions[bot]`, écritures horaires dans `state/`) et Grok Bot (décisions sous le compte `cyrillaferrere`, `decisions/`) poussent directement ; `quality` et `code-only` ne s'exécutent pas sur ces pushes. Protéger `main` contre les force-pushes et la suppression, en limitant les pushes directs aux seuls acteurs autorisés `github-actions[bot]` et `cyrillaferrere` **si GitHub permet de l'exprimer sans perturber l'automatisation**. En particulier, le filtrage par acteur ne suffit pas à empêcher des modifications accidentelles de code sur `main` par un acteur autorisé : respecter `scripts/release.sh` et la revue humaine. Ne pas créer une protection qui empêche les commits du moteur ou les décisions. **Ne modifier aucune règle GitHub sans l'accord explicite de Cyril.** Vérifier les possibilités et restrictions du plan GitHub avant toute activation ; si la restriction d'acteurs n'est pas réalisable, la documenter plutôt que d'improviser un blocage.

**Avant fusion** : vérifier les deux checks verts, relire les fichiers modifiés (aucun `state/`, `decisions/`), obtenir la revue Grok Bot, puis déployer la préprod via `scripts/deploy.sh preprod`. Après déploiement, vérifier l'alias `preprod--`, le commit affiché, le navigateur mobile/bureau, les graphiques et l'absence de changement du site de production. Aucun passage en prod sans accord explicite de Cyril.

**Limites** : le workflow n'effectue pas de tests de navigateur de bout en bout ni de déploiement Netlify ; la vérification de secrets est partielle et ne remplace pas la revue. Les tests CI doivent être observés sur GitHub avant de déclarer le dispositif opérationnel.

## Déploiement préprod automatique par GitHub Actions (ADR-16)

Le workflow `.github/workflows/deploy-preprod.yml` se déclenche **uniquement sur push vers `preprod`** (après fusion validée). Le déclencheur manuel `workflow_dispatch` a été écarté : GitHub exige que ce workflow existe sur la branche par défaut `main`, que nous ne modifions pas. Aucun déclenchement sur PR, `main`, `feature/*` ou cycle moteur.

**Configuration initiale (effectuée le 14/11/2026)** : environnement GitHub `preprod`, branches autorisées : `preprod`, secret d'environnement `NETLIFY_AUTH_TOKEN` créé par Cyril. Ne jamais divulguer le jeton ; expiration Netlify prévue le 12/02/2027 : le renouveler avant cette date dans GitHub et révoquer l'ancien. Ce jeton de compte peut avoir des droits plus larges que l'alias : la protection de la production dépend du workflow et du script, pas d'une limitation intrinsèque du jeton.

**Utilisation** : faire relire la PR par Grok Bot, vérifier les checks puis fusionner dans `preprod`. GitHub → Actions → `deploy-preprod` : vérifier le run vert, puis `https://preprod--kraken-paper.netlify.app/version.json` (commit exact, `env: preprod`, `branch: preprod`). Le script `scripts/deploy.sh preprod` utilise `--alias preprod`, jamais `--prod`. Un push direct sur `preprod` déclencherait également le workflow : privilégier les PR et activer ultérieurement les protections de branche après accord distinct de Cyril.

**En cas d'échec** : vérifier les logs GitHub Actions sans afficher de secret ; si jeton manquant, contrôler le secret d'environnement `preprod`. En cas de SHA différent dans `version.json`, ne pas déclarer le déploiement réussi. Déploiement CLI manuel possible en secours. Aucun changement de `main`, `state/`, `decisions/` ni de production.

**Statut** : secret configuré, PR à faire relire et fusionner ; premier run de déploiement à vérifier. Aucun déploiement encore validé par cette automatisation.


<!-- ARCHIVE MAIN AVANT PUBLICATION — À RÉCONCILIER -->
# Kraken Paper : runbook (opérations)

- Vérifier la cascade CSS mobile : aucune largeur minimale tablette de 620/760 px ne doit subsister pour les tableaux Positions/Marqueurs à 390 px ; contrôler les fiches SOL/BTC/ETH sur iPhone.

- Régression mobile : sur iPhone, vérifier que chaque fiche SOL/BTC/ETH tient entièrement à l'intérieur de Positions, sans bande noire à droite, puis contrôler Ordres, Trades et Marqueurs.

## Recette groupée UX mobile
- Tester largeur 320, 375, 390, 430, 680, 768 et 1280 px : aucun débordement horizontal du contenu principal.
- Ordres : crypto/sens/montant/distance visibles immédiatement ; bouton Détails ouvre prix/stop/objectif/risque ; filtres et statut proche/atteint lisibles sans occuper toute la fiche.
- Positions, trades et marqueurs : chaque valeur possède un libellé visible ; filtres et tri fonctionnent ; état vide et données manquantes restent compréhensibles.
- Vérifier chandeliers, KPI, navigation latérale, journal, décisions, performance et actualisations en direct sans perte de sélection.
- Exécuter `node --test tests/site/*.test.js` puis comparer visuellement iOS Safari, Android Chrome et desktop sur le SHA effectivement déployé en préproduction. Aucun déploiement production sans validation explicite.

## Recette intégrée du dashboard
- Vérifier commit affiché, sources GitHub, cours Kraken, chandelier 1 h par défaut et changement rapide de paire/période.
- Supprimer une paire sélectionnée de l'ensemble des paires disponibles dans un état fictif : le graphique doit revenir effectivement sur BTC.
- Contrôler simultanément scanner, portefeuille, journal et historique sur plusieurs actualisations, puis simuler une panne Kraken et une panne de source d'état.
- Tests automatisés : `node --test tests/site/*.test.js`. Les tests statiques ne remplacent pas la recette navigateur.

## Recette du scanner : progression et nouvelles paires
- Vérifier que la progression augmente à chaque réponse Kraken et disparaît à la fin, même en cas de panne partielle.
- Ajouter dans un état fictif de test une paire absente de la watchlist et déclencher `onState` : le scanner doit la charger immédiatement.
- Vérifier les erreurs, la récupération automatique et l'absence de rafales de requêtes. Exécuter `node --test tests/site/*.test.js`.

## Recette scanner de marchés
- Ouvrir les marqueurs, vérifier la progression et le calcul BTC avant les autres paires.
- Déclencher deux rafraîchissements rapprochés : ils doivent être regroupés, sans multiplier les vagues de requêtes simultanées.
- Tester une panne Kraken et son retour ; les derniers marqueurs valides restent visibles, l'erreur est signalée.
- Exécuter `node --test tests/site/*.test.js` et vérifier le SHA de préproduction après fusion.

## Recette — session du chandelier
- Sélectionner ETH, 4 h, 240 bougies ; recharger l'onglet et vérifier la conservation de ces trois choix.
- Ouvrir une nouvelle session et vérifier le défaut BTC/1 h/120 ; tester la disparition d'une paire et le repli BTC.
- Cliquer Actualiser : la dernière heure de lecture ne change qu'après une réponse OHLC valide ; contrôler la stabilité du survol et du zoom.
- Vérifier clavier, mobile et `node --test tests/site/*.test.js`.

## Recette du chandelier en préproduction
- Changer rapidement BTC/ETH/SOL puis 5 min/15 min/1 h pendant le chargement ; le dernier choix doit toujours gagner.
- Déconnecter momentanément l'API OHLC : le dernier graphique valide reste visible, le message indique l'échec, le prochain rafraîchissement réessaie.
- Contrôler le survol des bougies pendant les actualisations, les 60/120/240 bougies, les labels et le mobile.
- Exécuter `node --test tests/site/*.test.js` et vérifier le commit réellement publié dans l'en-tête Netlify.

## Recette — intégrité des données publiques
- Vérifier prix Kraken en direct, statut partiel si une paire manque, et repli sur les prix du dernier cycle si API indisponible.
- Tester localement des cycles CSV hors ordre et une ligne JSONL corrompue : le dashboard doit garder le snapshot précédent et afficher une erreur, sans effacer d'événement.
- Vérifier l'actualisation normale après correction et l'absence de secrets/ordres réels. Tests : `node --test tests/site/*.test.js`.

## Recette ciblée — historiques volumineux
- Ouvrir Performance sur 24 h, 1 an et Tout ; vérifier que le nombre de cycles correspond aux données et que les extrema sont visibles.
- Avec une série BTC incomplète, vérifier que le graphique ne relie pas deux segments séparés par une lacune.
- Vérifier le rendu sur mobile et l'absence de ralentissement avec un historique long ; `node --test tests/site/*.test.js`.
- Vérifier que la préproduction affiche le SHA fusionné après déploiement ; aucune opération sur `main` ni sur `state/` ou `decisions/`.


Heures en heure de Paris. Commandes à lancer depuis la racine du dépôt.

## Contrôles UX v0.2.1 (branche feature)

Stabilisation du rafraîchissement UX v0.2.1 : une seule lecture d'état à la fois, validation et publication groupée portefeuille/equity/journal, nouvelle tentative après snapshot invalide, réponses de prix hors ordre ignorées, journal/trades/courbe reconstruits uniquement lors d'un nouveau snapshot (pas toutes les 15 s). Aucun changement du moteur PAPER. Recette : vérifier filtres journal et profondeur après plusieurs tickers 15 s, courbe inchangée hors nouveau cycle, nouveaux événements après cycle, erreurs API et reprise, cohérence de l'horodatage, mobile et survol des chandelles. Le site doit rester PAPER/lecture seule.

Explorateur d'historique UX v0.2.1 : courbe 24 h, 7 j, 30 j, 90 j, 6 mois (180 j), 1 an (365 j), tout; journal 40/100/250/tous les événements disponibles, avec indication explicite de la profondeur chargée et des filtres sur les entrées visibles. Aucun événement ni point de courbe inventé, lecture seule. Recette : vérifier 90 j/6 mois/1 an/tout avec historique court; journal 40/100/250/tout et compteur exact; filtrer une entrée ancienne après passage à tout; rafraîchissement, mobile, clavier, performance navigateur sur journal volumineux.

Itération de stabilisation UX v0.2.1 : déconnexion temporaire et reconnexion garantie du MutationObserver pendant le tri DOM (sans masquer les nouvelles données), étiquette du chandelier fondée sur le nombre réel de bougies chargées, tests de non-régression et maintien de la navigation/du survol. Aucun changement de simulation. Recette : trier positions et laisser passer un cycle de rafraîchissement, vérifier que les nouvelles lignes sont prises en compte; changer 60/120/240 bougies sur paires peu fournies, contrôler les compteurs, survol et absence de nouvelle requête; tester mobile.

Durcissement UX v0.2.1 : correction du tri P&L négatif (signe moins typographique), protection contre la rétroaction MutationObserver lors des tris, accès direct Performance/Historique depuis la navigation, nom accessible du graphique portefeuille, tests d'intégration HTML/navigation/labels/scripts et non-régression du tri. Contrôler navigation clavier/mobile, tri de deux pertes (−0,80 devant −10,00), filtres sur mises à jour automatiques, performance et journal; vérifier commit Netlify après déploiement.

Lot UX v0.2.1 performance et journal : périodes de courbe 24 h / 7 j / 30 j / tout (cycles réels uniquement), compteur de cycles, journal filtrable par texte et type d'événement, remise à zéro, tests Node et ergonomie mobile. Aucune modification moteur, stratégie ou données PAPER. Vérifier 24 h/7 j/30 j/tout sur la courbe, périodes avec moins de deux cycles, filtres journal, compteurs et stabilité après nouveau cycle; test mobile 375/820 px.

Lot UX portefeuille v0.2.1 : tri des positions (valeur, P&L signé, nom), recherche crypto, recherche et filtre achat/vente dans l'historique des trades, compteurs et réinitialisation, affichage mobile. Opérations uniquement visuelles, aucun changement moteur, stratégie, état ou décisions. Vérifier tri P&L avec pertes négatives françaises (−), retour à l'ordre initial, filtres et réinitialisation après rafraîchissement, colonnes mobiles à 375/820 px et navigation clavier.

Lot graphique UX v0.2.1 : choix de fenêtre 60/120/240 bougies, recentrage manuel, lecture mobile améliorée, conservation du survol et de la vue pendant les rafraîchissements. Aucun changement de données, moteur ou stratégie. Vérifier le choix de fenêtre sur BTC et SOL, le recentrage après zoom/déplacement manuel, le survol pendant un rafraîchissement, les dimensions mobiles et le clavier.

Correctif UX 0.2.1 : remise à zéro des filtres en un clic, message explicite sans résultat, tests Node automatisés sur les filtres d'ordres et de marché. Aucun changement moteur. Vérifier aussi le retour du focus dans le champ de recherche après « Effacer les filtres ».

Lot `feature/v0.2.1-market-workspace` : tester recherche d'une crypto et d'un identifiant d'ordre, filtre achat/vente, filtre de tendance 4 h / 1 j, compteurs affichés, réinitialisation des filtres, stabilité après rafraîchissement des données, détails d'ordre ouverts, affichage à 375/820/1440 px, navigation clavier. Les filtres n'agissent que sur les lignes HTML et ne doivent pas changer les ordres ni les indicateurs.

Pour `feature/v0.2.1-readable-orders`, contrôler les boutons Détails/Réduire sur ordinateur et mobile, les lignes développées après rafraîchissement des prix, l'accessibilité clavier et les colonnes masquées en mobile. Le déploiement Netlify de `preprod` est manuel et doit être vérifié par commit affiché dans le header.

Avant fusion dans `preprod`, vérifier les ancres de navigation au clavier et sur mobile, la position des tableaux, le graphique 1 h par défaut, les survols de bougies pendant un rafraîchissement et `prefers-reduced-motion`. Exécuter les tests Python et Node décrits ci-dessous. Ne pas déployer sur `main` sans accord explicite.

## Déployer

Il n'y a **qu'un seul site Netlify, `kraken-paper`**, non relié à GitHub : on déploie à la main avec `scripts/deploy.sh`, qui exporte le commit
**poussé** sur `origin` (`git archive`, donc aucun fichier local ou ignoré, ni `.ntfy_topic`), écrit
`site/version.json` (version, environnement, commit, branche, heure) et envoie le dossier.

| Environnement | Branche | Site Netlify | Commande |
| --- | --- | --- | --- |
| préprod | `preprod` | https://preprod--kraken-paper.netlify.app (alias, non production) | `scripts/deploy.sh preprod` |
| feature | `feature/<nom>` | `https://feature-<nom>--kraken-paper.netlify.app` (alias) | `scripts/deploy.sh feature feature/<nom>` |
| **prod** | `main` | https://kraken-paper.netlify.app (déploiement de production) | `CONFIRM_PROD=oui scripts/deploy.sh prod` **après l'accord de Cyril** |

Site id Netlify : `01cb62cb-bc97-4b2c-be7e-21960b44bfd5`. Le badge d'environnement de l'en-tête se déduit de l'adresse.

Moyen d'envoi :
- **Préprod et features : Netlify CLI obligatoire** : `NETLIFY_AUTH_TOKEN=<jeton personnel> scripts/deploy.sh preprod`
  (`netlify deploy --alias preprod`, **sans** `--prod` : la prod n'est pas touchée). Jeton créé dans Netlify → User settings
  → Applications → Personal access tokens, jamais commité.
- **Prod** : la même CLI (`--prod`), ou le connecteur Netlify de Grok Bot : l'outil `deploy-site` renvoie une commande
  `npx @netlify/mcp ... --proxy-path "<chemin>"` ; lancer `NETLIFY_MCP_PROXY="<chemin>" CONFIRM_PROD=oui scripts/deploy.sh prod`.
  **Ce connecteur ne fait que des déploiements de production** : ne jamais l'utiliser pour la préprod (le script le refuse).

Après déploiement : ouvrir l'adresse, vérifier le badge d'environnement, la version et le commit dans l'en-tête, et que
la console du navigateur est sans erreur. Après un déploiement de préprod, vérifier aussi que la prod n'a pas changé :
`curl -s https://kraken-paper.netlify.app/app.js | cmp - <(git show origin/main:site/app.js)`.
Accès public : dans Netlify → Site configuration → Access & security → Visitor access, la protection doit être désactivée
pour les déploiements non production (sinon la préprod demande une connexion).

## Mettre en prod une release

**L'état vit uniquement sur `main`, écrit seulement par le moteur ; le dash est en lecture seule ; une release ne livre
que du code.** Après l'accord de Cyril :
```bash
# sur preprod : VERSION et CHANGELOG à jour ([X.Y.Z] - date), poussés
scripts/release.sh X.Y.Z                 # fusionne preprod dans main, tests, tag vX.Y.Z, push
CONFIRM_PROD=oui scripts/deploy.sh prod  # déploie main en production
```
`release.sh` s'arrête si `git diff origin/main...origin/preprod` touche `state/` ou `decisions/`, puis contrôle la fusion
elle-même (`git diff --cached` contre `main`) avant de commiter. Si l'un des deux contrôles échoue : retirer ces fichiers
de `preprod` (`git checkout origin/main -- state/ decisions/` sur preprod, commit, push), puis relancer.

## Déclenchement horaire du moteur

Deux déclencheurs lancent le même workflow `engine.yml` sur `main` :

| Source | Horaire (UTC) | Rôle |
| --- | --- | --- |
| Fonction planifiée Netlify `engine-trigger` | minute 9 | Déclencheur principal, **à partir de la mise en prod** de la v0.2.0 |
| Cron GitHub Actions | minute 7 | Secours : souvent en retard, parfois sauté sur un dépôt gratuit |

Netlify n'exécute les fonctions planifiées que sur le **déploiement de production** publié. Un déploiement préprod ou
alias ne les fait pas tourner.

Un double déclenchement est sans risque : le moteur rejoue seulement les bougies 1 h clôturées pas encore traitées
(`last_candle`) et ignore les décisions déjà appliquées (`processed_decisions`) ; le workflow a un groupe de concurrence
`kraken-paper-engine` (`cancel-in-progress: false`), donc deux cycles ne tournent jamais en parallèle. La fonction
vérifie aussi qu'aucun run n'est déjà `in_progress` ou `queued` avant d'appeler `workflow_dispatch`.

## Lancer un cycle à la main

```bash
gh workflow run engine.yml --ref main
gh run list --workflow engine.yml -L 3
```
Ou GitHub → Actions → engine → Run workflow (branche **main** ; depuis une autre branche le job est ignoré).
Un push dans `decisions/` sur `main` lance aussi un cycle.

Sur le dash, la carte « Prochains passages » vise la minute 9 (heure de Paris comme de UTC) et rappelle que le cron
GitHub (minute 7) prend le relais si besoin. La fonction planifiée ne tourne qu'en production : en préprod le texte le
dit, c'est attendu.

## Datation des exécutions

Le moteur décide toujours sur les bougies 1 h clôturées, mais date le fill à l'ouverture de la première bougie 5 min
de cette heure qui touche le niveau (`time_source: m5`). Kraken ne garde qu'environ 60 h de bougies 5 min : au-delà,
ou en cas d'erreur API, repli sur l'ouverture de la bougie 1 h (`time_source: hour_open`), sans changer le prix ni les
frais. Ne pas réécrire `state/` ni le journal pour corriger un ancien horaire : le dash (`fillMarkerTs`) place le
marqueur des fills sans `time_source` (T0001, T0002) sur la première bougie affichée qui touche le prix dans l'heure
précédant le ts enregistré.

## Un cycle a échoué

1. `gh run list --workflow engine.yml -L 5` puis `gh run view <id> --log-failed`.
2. **Tests en échec** : le cycle ne tourne pas, l'état n'est pas touché. Corriger le code par PR.
3. **API Kraken indisponible** : le moteur saute l'étape et note l'erreur dans `last_cycle_errors` et le journal.
   Rien à faire, le cycle suivant rattrape les bougies manquées.
4. **Décision illisible** : un avertissement apparaît dans le journal. Corriger le JSON dans un **nouveau** fichier
   avec un **nouvel** `id` (ne jamais réutiliser un `id`).
5. **Conflit de push** : le workflow réessaie trois fois avec `pull --rebase`. Si cela échoue encore, relancer le cycle.
6. **État corrompu** (seul cas où l'on touche `state/` à la main, avec l'accord de Cyril) :
   ```bash
   git log --oneline -- state/            # trouver le dernier commit d'état sain
   git checkout <sha> -- state/
   git commit -m "fix(state): restauration de l'etat au commit <sha> (raison)"
   git pull --rebase && git push origin main
   ```
   Le moteur reprend depuis `last_candle` de cet état et rejoue les bougies suivantes. Noter l'incident dans le CHANGELOG.

## Changer le canal ntfy

Le nom du canal sert de mot de passe : le changer s'il a fuité.
```bash
NEW="kraken-paper-$(head -c 9 /dev/urandom | base64 | tr -dc 'a-z0-9' | head -c 12)"
echo "$NEW" > .ntfy_topic                 # fichier local gitignoré
gh secret set NTFY_TOPIC --body "$NEW"    # secret GitHub Actions
```
Puis donner le nouveau nom à Cyril pour qu'il s'abonne dans l'app ntfy et supprime l'ancien abonnement.

## Jeton GITHUB_DISPATCH_TOKEN (fonction Netlify)

Variable d'environnement du site `kraken-paper` (id `01cb62cb-bc97-4b2c-be7e-21960b44bfd5`), nom
`GITHUB_DISPATCH_TOKEN`, scopes **builds**, **functions** et **runtime** (le plan Netlify actuel refuse un scope limité
à `functions` seulement ; `post_processing` est exclu car incompatible avec un secret), contextes `production`,
`branch-deploy`, `deploy-preview` et `dev` (un secret n'accepte pas le contexte unique « all »), marquée secret.
Jamais dans le dépôt, jamais dans les logs, jamais en argument visible d'une commande.

C'est un jeton GitHub **fine-grained** : accès au seul dépôt `cyrillaferrere/kraken-paper`, permission **Actions** en
lecture et écriture, rien d'autre. Expiration actuelle : **90 jours, vers le 12/02/2027**.

Rotation, avant expiration (ou si le jeton a fuité) :

1. Créer un nouveau jeton sur https://github.com/settings/personal-access-tokens/new avec les mêmes réglages
   (nom `kraken-paper-dispatch`, dépôt `kraken-paper` seulement, Actions : Read and write).
2. Le poser à la place de l'ancien, sans afficher la valeur, par l'API Netlify ou le tableau de bord
   (Project configuration → Environment variables). En CLI, seulement si la valeur vient d'une variable d'environnement
   et n'est pas échoée, avec `--secret` et les scopes `builds`, `functions`, `runtime` (pas `functions` seul : le plan
   l'interdit) et les quatre contextes explicites. Ne pas lancer `netlify env:list` sans masquer les valeurs.
3. Vérifier un dispatch (logs ci-dessous, ou un `workflow_dispatch` manuel).
4. Révoquer l'ancien jeton sur GitHub.

## Logs de la fonction engine-trigger

Disponibles seulement après un déploiement de **production** (et donc après l'accord de Cyril pour la v0.2.0) :

- Netlify → site `kraken-paper` → Functions → `engine-trigger` → Logs
- ou `netlify logs:function engine-trigger --site 01cb62cb-bc97-4b2c-be7e-21960b44bfd5`

On doit voir `dispatch HTTP 204` (succès) ou `skip: un cycle engine est déjà in_progress ou queued`. Le jeton ne doit
jamais apparaître. Puis vérifier le run GitHub : `gh run list --workflow engine.yml -L 5` (événement `workflow_dispatch`).

## Problèmes fréquents

| Symptôme | Cause | Action |
| --- | --- | --- |
| Le dash affiche un état en retard de quelques minutes et la pastille « Source de secours » | Limite de l'API GitHub (60 requêtes/h par IP) atteinte ou API en erreur : repli sur raw.githubusercontent.com, qui a un cache d'environ 5 min | Rien : retour automatique à l'API après la remise à zéro de la limite (au moins 10 min). Éviter d'ouvrir beaucoup d'onglets. |
| « Dernier cycle moteur : plus de 2 h » | Le cron GitHub peut partir en retard ou sauter un créneau. À partir de la v0.2.0 en prod, le déclencheur principal est la fonction Netlify (minute 9 UTC) | Vérifier les logs de `engine-trigger` et qu'un run `workflow_dispatch` apparaît dans Actions. Si le jeton a expiré (vers le 12/02/2027) : le renouveler (section ci-dessus). Sinon lancer un cycle à la main. Un dépôt public inactif 60 jours désactive aussi les crons GitHub : les réactiver dans Actions. |
| Graphiques vides, message « bibliothèque » | CDN jsDelivr injoignable | Le tableau des marqueurs reste utilisable ; réessayer plus tard. |
| « Bougies Kraken indisponibles » ou marqueurs « indisponible » | Limite publique Kraken ou API en panne | Nouvel essai automatique (1 à 3 min). |
| Décision non appliquée | `id` déjà utilisé, JSON invalide, ou API Kraken absente pendant le cycle | Lire le journal ; si API absente, elle sera retentée automatiquement. |
| Le contrôle CI `guard-state` échoue | La branche modifie `state/` ou `decisions/` | Retirer ces changements (`git checkout origin/main -- state/ decisions/`), ils n'ont rien à faire hors `main`. |
| Un ordre affiche « Niveau atteint en direct » | Le prix live a touché le niveau, mais le moteur n'exécute qu'à la clôture de la bougie 1 h | Attendre le cycle suivant. |

## Contrôle qualité des PR (v0.3.0, préparation)

Le workflow `.github/workflows/quality.yml` (`quality-gates / quality`) s'exécute sur les PR vers `preprod` et `main`, les pushes sur `preprod`, `feature/*`, `fix/*`, et manuellement. Il teste le moteur **sans exécuter de cycle**, les calculs du dash, la fonction planifiée, la syntaxe JS/Bash et les invariants de déploiement. Sur PR, `CHANGELOG.md` et `docs/HANDOFF.md` doivent être modifiés. Le workflow historique `guard-state / code-only` continue de protéger `state/` et `decisions/`.

**Configuration cible des protections, non activée** : sur **`preprod` uniquement**, créer un ruleset imposant les PR et les checks `quality-gates / quality` et `guard-state / code-only`, interdisant force-push et suppression. Vérifier les noms exacts des checks après exécution. Sur **`main`**, ne pas rendre obligatoires les PR ni ces checks : le moteur (`github-actions[bot]`, écritures horaires dans `state/`) et Grok Bot (décisions sous le compte `cyrillaferrere`, `decisions/`) poussent directement ; `quality` et `code-only` ne s'exécutent pas sur ces pushes. Protéger `main` contre les force-pushes et la suppression, en limitant les pushes directs aux seuls acteurs autorisés `github-actions[bot]` et `cyrillaferrere` **si GitHub permet de l'exprimer sans perturber l'automatisation**. En particulier, le filtrage par acteur ne suffit pas à empêcher des modifications accidentelles de code sur `main` par un acteur autorisé : respecter `scripts/release.sh` et la revue humaine. Ne pas créer une protection qui empêche les commits du moteur ou les décisions. **Ne modifier aucune règle GitHub sans l'accord explicite de Cyril.** Vérifier les possibilités et restrictions du plan GitHub avant toute activation ; si la restriction d'acteurs n'est pas réalisable, la documenter plutôt que d'improviser un blocage.

**Avant fusion** : vérifier les deux checks verts, relire les fichiers modifiés (aucun `state/`, `decisions/`), obtenir la revue Grok Bot, puis déployer la préprod via `scripts/deploy.sh preprod`. Après déploiement, vérifier l'alias `preprod--`, le commit affiché, le navigateur mobile/bureau, les graphiques et l'absence de changement du site de production. Aucun passage en prod sans accord explicite de Cyril.

**Limites** : le workflow n'effectue pas de tests de navigateur de bout en bout ni de déploiement Netlify ; la vérification de secrets est partielle et ne remplace pas la revue. Les tests CI doivent être observés sur GitHub avant de déclarer le dispositif opérationnel.

## Déploiement préprod automatique par GitHub Actions (ADR-16)

Le workflow `.github/workflows/deploy-preprod.yml` se déclenche **uniquement sur push vers `preprod`** (après fusion validée). Le déclencheur manuel `workflow_dispatch` a été écarté : GitHub exige que ce workflow existe sur la branche par défaut `main`, que nous ne modifions pas. Aucun déclenchement sur PR, `main`, `feature/*` ou cycle moteur.

**Configuration initiale (effectuée le 14/11/2026)** : environnement GitHub `preprod`, branches autorisées : `preprod`, secret d'environnement `NETLIFY_AUTH_TOKEN` créé par Cyril. Ne jamais divulguer le jeton ; expiration Netlify prévue le 12/02/2027 : le renouveler avant cette date dans GitHub et révoquer l'ancien. Ce jeton de compte peut avoir des droits plus larges que l'alias : la protection de la production dépend du workflow et du script, pas d'une limitation intrinsèque du jeton.

**Utilisation** : faire relire la PR par Grok Bot, vérifier les checks puis fusionner dans `preprod`. GitHub → Actions → `deploy-preprod` : vérifier le run vert, puis `https://preprod--kraken-paper.netlify.app/version.json` (commit exact, `env: preprod`, `branch: preprod`). Le script `scripts/deploy.sh preprod` utilise `--alias preprod`, jamais `--prod`. Un push direct sur `preprod` déclencherait également le workflow : privilégier les PR et activer ultérieurement les protections de branche après accord distinct de Cyril.

**En cas d'échec** : vérifier les logs GitHub Actions sans afficher de secret ; si jeton manquant, contrôler le secret d'environnement `preprod`. En cas de SHA différent dans `version.json`, ne pas déclarer le déploiement réussi. Déploiement CLI manuel possible en secours. Aucun changement de `main`, `state/`, `decisions/` ni de production.

**Statut** : secret configuré, PR à faire relire et fusionner ; premier run de déploiement à vérifier. Aucun déploiement encore validé par cette automatisation.


## Publication production contrôlée depuis GitHub
- Selon ADR-28 (un seul GO, sans approbation GitHub supplémentaire), après accord explicite de Cyril et fusion de la release sur `main`, créer ou mettre à jour sur la branche `deploy/prod-request` le fichier `.github/prod-release-request.json` contenant `environment: production`, `approved_by: Cyril`, `version: X.Y.Z` et `approved_commit: <SHA main approuvé>`.
- Le push de ce fichier déclenche `deploy-production-controlled` ; il vérifie que le code de `main` est identique au SHA approuvé (hors cycles `state/` et `decisions/`), exécute les tests, publie via `scripts/deploy.sh prod`, puis contrôle `https://kraken-paper.netlify.app/version.json`.
- Le secret `NETLIFY_AUTH_TOKEN` doit être accessible au workflow via GitHub Secrets ; s'il est absent, le job échoue avant toute publication. Ne jamais l'envoyer par message ni le commiter.
- Aucun push sur `main`, y compris les cycles moteur, ne publie automatiquement la production. Le déclenchement ne vaut que pour la version explicitement approuvée. En cas d'échec, lire les logs du job, corriger, puis redéclencher par une nouvelle demande approuvée.
