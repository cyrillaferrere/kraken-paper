## PR 03 — Réveil Grok Bot sur cours (24/11/2026)
- Branche feature/engine-021-price-move-wakeup, issue de preprod. Ne pas fusionner avant revue Grok Bot.
- engine/run.py : price_move_alerts ; scripts/notify_grokbot.py : payload sur variation sans secret dans les journaux.
- Prix de référence stocké dans price_move_watch ; cooldown indépendant par crypto.
- Tests : tests/test_price_move_wakeup.py, tests/test_grokbot_webhook.py ; commande Python/Node et qualité GitHub.
- Limite avant validation : prise en compte explicite des heartbeats de session, granularité des événements multiples et conformité du contrat Grok Bot.

## Correctifs apres revue Grok Bot — PR #73 (18/11/2026)
- Panne API OHLC 5 min ou absence temporaire des barres : ne pas basculer en 1 h.
  Reprise au cycle suivant sans mouvement des curseurs. Au-dela de 60 h,
  le repli 1 h n'est possible que si aucune barre de l'heure n'a deja ete traitee.
- Versions visibles partout : Dash v0.3.7 · Moteur v0.2.0 lorsque le nouvel
  etat existe. Tant que le moteur prod 0.1 produit les fichiers vivants,
  l'aperçu affiche correctement Moteur v0.1.0.
- Palier des frais affiche par volume PAPER glissant 30 jours sans nouveau fill.
- Tests : `tests/test_engine_v02.py`, `tests/test_precise_fills.py`,
  `tests/site/version-header.test.js`; PR brouillon jusqu'a confirmation CI.

## Feature moteur 0.2.0 / site v0.3.7 — 18/11/2026
- Branche : `feature/engine-v0.2.0`, base `preprod`; PR à relire par Grok Bot avant validation.
- Moteur : `engine/run.py` garde les ordres existants; ajoute `engine_version=0.2.0`, curseur `last_m5`, limites avec pénétration, slippage dynamique, frais selon volume 30 j.
- Anciennes exécutions 0.1 non réécrites; `state/`, `decisions/` jamais inclus dans la PR.
- Source de vérité : `docs/ADR-35-ENGINE-EXECUTION.md`, historique : `docs/ENGINE_CHANGELOG.md`.
- Repli horaire explicite `execution_fallback`; volume 5 min public lorsque disponible; fills toujours PAPER.
- Fichiers à examiner : `engine/run.py`, `tests/test_engine_v02.py`, `tests/test_precise_fills.py`, `site/app.js`, `site/index.html`.
- Les nouveaux ordres sont actifs à la bougie 5 min suivante. Grok doit adapter les sessions avant tout GO prod.
- Pas de production, pas de modification de state/ ou decisions/ avant validation et recette.

## Feature v0.3.6.2 — verrou de production (18/11/2026)
- Branche `fix/v0.3.6.2-production-gate` depuis `preprod` ; `VERSION=0.3.6.2`.
- Cause : le workflow `deploy-production-controlled.yml` n'acceptait que trois segments de version, tandis que Netlify pouvait publier automatiquement après un merge sur `main`.
- Correction : regex à trois/quatre segments ; `netlify.toml` appelle `scripts/netlify-ignore-build.sh` pour ignorer tout build Git sur `main` / `production`. Les previews et builds non-production restent possibles. Le chemin CLI `scripts/deploy.sh prod` est inchangé.
- ADR-34 ; tests `tests/site/netlify-build-gate.test.js`. Vérifier une build Netlify production Git *skipped* lors d'un prochain push de code autorisé sur `main`, et vérifier qu'un déploiement CLI contrôlé fonctionne avec son GO ; ne pas provoquer ces actions pour tester.
- Limite : la configuration UI Netlify, les deploy hooks et les publications manuelles sont à inspecter/restricter séparément.
- Ne pas toucher `state/`, `decisions/`, `docs/LESSONS.md`, `engine/`, `main` ; pas de promotion sans GO.

## Fix v0.3.6.1 — échelle du graphique au changement de paire (18/11/2026)
- Capture de Cyril (prod v0.3.6, 12h18) : XRP/USDC 1 h affiché sur une échelle 63 000–71 000, étiquettes 0,987 et 0,966 collées en bas.
- Cause (`site/markets.js`, `loadChartInner` / `overlays`) : (1) si l'échelle de prix n'était plus en autoscale (glisser ou zoom vertical sur BTC), le changement de paire gardait la plage BTC ; (2) `setData` des bougies XRP partait avec les niveaux BTC encore dans `levelPrices`, et Lightweight Charts ne recalcule pas l'échelle quand on retire ou crée une priceLine.
- Correctif : synchroniseur de niveaux `createLevelSync` (exposé `window.KPChartLevelSync`) ; `levels.clear()` + autoscale avant `setData` à chaque changement de paire/TF ; niveaux filtrés par paire ; autoscale relancé quand les niveaux changent ; « Recentrer » remet l'autoscale.
- Recette : BTC → glisser l'axe des prix → XRP : l'axe doit se caler sur ~0,9–1,1 avec la ligne O0025 à 0,966. Refaire avec ETH et SOL, en 1 h et 1 j, sur ordinateur et mobile. VERSION 0.3.6.1, PR vers `preprod`, aucune prod sans GO.

## Feature v0.3.6 — correction des onglets bougies (18/11/2026)
- Capture utilisateur : fond actif 1 h décalé et texte des intervalles comprimé après compactage de l'en-tête.
- `site/index.html` : retirer le seul `.seg-thumb` du `tf-tabs` ; `site/markets.js` : ne plus positionner `--idx`, conserver `aria-selected` et le focus clavier ; `site/spa-v036.css` : états actifs sur les boutons, tailles intrinsèques et défilement horizontal mobile.
- Test `tests/site/dashboard-integration.test.js` : six TF, un seul sélectionné, suppression du thumb et état ARIA. Vérifier chaque TF visuellement à 320/390/768/1440 px, Focus, retour du navigateur, et la récupération des bougies.
- Version 0.3.6 et PR #66 inchangées, `state/`, `decisions/`, `main` et préprod intacts.

## Feature v0.3.6 — en-tête Marchés compact (18/11/2026)
- `site/index.html` : déplacer l'unique bloc `.selected-live` dans `.card-h` (via `.market-header-live`), sans dupliquer les IDs ; titre conservé pour accessibilité. L'ordre des contrôles est prix/live, timeframes, Ordres/Focus, paires, toolbar bougies.
- `site/markets.js` : modifier seulement le balisage de `legend()` pour deux lignes logiques, OHLC puis MA20/MA50/RSI, en conservant les calculs et le temps survolé.
- `site/spa-v036.css` : nouvelles règles à la fin pour compacter entête, paires, outils et légende, avec retours ciblés à 1260 et 760 px. Le statut live conserve son élément DOM tandis que la fraîcheur des bougies reste visible dans `chart-updated`.
- Test `tests/site/dashboard-integration.test.js` : unicité des IDs, ordre des éléments et présence du balisage dynamique OHLC ; exécuter CI complète. Version **0.3.6**, PR #66, sans fusion préprod/prod.

## Feature v0.3.6 — compactage de l'analyse (18/11/2026)
- `site/index.html` : suppression du seul bloc redondant `chart-order-levels`; le chandelier et ses tracés/annotations sont inchangés.
- `site/market-v035.js` : `renderPriceScale()` affiche réglette + tableau quatre colonnes (niveau, prix, distance, ordre). Chaque ordre reste identifiable et cliquable via `data-v035-order`. La limite de `recentPairEvents()` passe de quatre à trois. `collectPriceLevels()` conserve sans fusion tous les niveaux partageant le même prix et les conditions de protections d'achat en attente.
- `site/spa-v036.css` : grille indicateurs rapprochée, tableau à en-tête fixe et lignes de hauteur stable, activité compacte ; version inchangée 0.3.6.
- Tests `tests/site/market-v035.test.js` actualisés pour le nouveau DOM et les prix partagés. Contrôler le comportement à 320/390/768/1440 px et à 200 % de zoom avant fusion ; aucune modification moteur/state/decisions/main.

## Feature v0.3.6 — analyse sous chandelier (18/11/2026)
- `site/index.html` : les six indicateurs existants sont déplacés de la colonne contexte vers une bande sous le chandelier ; ajout `v036-price-scale` et `v036-pair-events` dans la colonne graphique. Les IDs antérieurs `focus-indicators`, `chart-order-levels` sont uniques et préservés.
- `site/market-v035.js` : `collectPriceLevels()` construit exclusivement prix live connu, PRU, limites/stops/TP de la paire ; distance au cours en %. Une protection d'achat en attente est signalée conditionnelle. `recentPairEvents()` limite à quatre événements explicitement associés à la paire, à partir du journal, et dirige vers Activité, sans relier artificiellement les décisions.
- `site/spa-v036.css` : grille indicateurs et réglette, hauteur contrôlée des modules, responsive. Test `tests/site/market-v035.test.js` étendu. Aucun nouveau flux, aucun changement d'ordre ni de simulation, version maintenue à 0.3.6.

## Feature v0.3.6 — stabilité du panneau Marchés (18/11/2026)
- Dans `site/spa-v036.css`, les tuiles d'ordres du Focus sont normalisées à 94 px (96 px mobile), titre une ligne et description deux lignes. Les détails complets restent accessibles par l'attribut `title` et `aria-label` dans `site/focus-ux.js`, avec ouverture du détail d'ordre au clic.
- `site/index.html` expose `book-spread-pct` sous `book-spread`, et `site/market-v035.js` renseigne séparément les deux valeurs, y compris leur indisponibilité. Les trois tuiles du carnet gardent 100 px, le statut réserve deux lignes et les dix rangs de profondeur 287 px, y compris en cas de chargement/échec. Aucun chiffre/trade inventé ni données tronquées côté logique.
- Test `tests/site/market-layout-stability.test.js`. Recette visuelle desktop/mobile et changement rapide de paire à vérifier ; ne pas modifier `state/`, `decisions/`, `main` ni version 0.3.6.

## Feature v0.3.6 — Terminal et heartbeat Grok (18/11/2026)
- **Version toujours 0.3.6**. Branche `feature/v0.3.6`, PR #66 en brouillon vers `preprod` ; elle inclut aussi les ajouts de la v0.3.5 encore en feature. Ne fusionner aucune PR sans GO de Cyril.
- `site/index.html` + `site/spa-router.js` + `site/spa-v036.css` : seulement deux vues, `#/terminal` (cockpit, marchés, positions, ordres, performance, calendrier, scanner en fin) et `#/activite`. Liens historiques redirigés, barre rapide adhésive, quatre raccourcis internes mobiles plus Activité.
- `engine/run.py` accepte `type=heartbeat` + `actions=[]` + `note` + timestamp ISO 8601 décalé, puis saute le heartbeat avant toute mutation de `state`, journal, refus ou ordre. Contrat : `docs/ADR-32-GROK-HEARTBEAT.md`. Aucune création/modification de `state/` et `decisions/`.
- `site/lib.js` contient `latestSession` ; `site/extras.js` lit `decisions/*.json` sur main, choisit le passage le plus récent, plus 5 h, évite « retard » sans preuve et groupe les heartbeats repliés. Le dépôt est interrogé par ETag toutes les cinq minutes même sans cycle d'état.
- Convention Grok **après mise en prod uniquement** : `decisions/YYYY-MM-DD-HHMM-heartbeat.json`, ID `heartbeat-YYYYMMDD-HHMM`, note, timestamp local Paris avec offset. README + ADR-32.
- Tests : `python -m unittest discover -s tests`, `node --test tests/site/*.test.js` et CI ; test runtime 03:09 +5 h = 08:09 ; heartbeat ne modifie pas `processed_decisions` ni `last_decision`.
- ADR-33 remplace la disposition 5 vues initiale de l'ADR-31 sans nouvelle version. Les règles de trading, préprod et prod restent inchangées.

## Feature v0.3.5 — marché, performance et audit (17/11/2026)
- Départ : `preprod` après intégration #64 (v0.3.4), nouvelle branche `feature/v0.3.5` ; `main`, `state/` et `decisions/` inchangés.
- Front HTML/CSS : `site/index.html`, `site/v035.css`; nouveau module `site/market-v035.js`. Chargé après `site/focus-ux.js` ; pas de dépendance ni de build additionnels.
- Marchés : `site/markets.js` transmet la paire, les indicateurs calculés et le contexte PAPER au nouveau module, via `KPV035.onMarket`. Le module charge exclusivement la profondeur via l'API REST publique Kraken et affiche spreads/volumes par niveau. Échecs, changement de paire et arrière-plan gérés sans mélanger les livres.
- Performance/chronologie : `site/app.js` passe equity et journal à `KPV035.onPortfolio`. Comparaison des bornes observées, aucune interpolation. Corrélation des événements uniquement sur des IDs effectivement présents.
- Tests : `node --test tests/site/market-v035.test.js` puis `node --test tests/site/*.test.js` ; CI, contrôle mobile, panne API, raccourcis ordres et accessibilité avant intégration.
- ADR-30 : portée, limites de REST, conventions d'audit et garde-fous. La PR vers preprod reste en brouillon en attendant un GO d'intégration. Aucun ordre n'est créé par le front.

## Feature v0.3.4 — Focus marché et parcours UX (17/11/2026)
- `site/index.html` : bouton Focus marché, scène graphique + panneau contextuel par paire, micrographe d'equity 24 h / 7 j, navigation inférieure mobile à 4 destinations.
- `site/focus-ux.js` : commandes plein écran (Escape, Tab cyclique, bouton de sortie et aria-modal), position/ordres de la paire sélectionnée calculés depuis le contexte public existant, navigation vers le détail d'ordre, micrographe SVG fondé uniquement sur cycles disponibles avec coupures si intervalle > 2 h 30.
- `site/markets.js` : sélection de paire exposée pour les tableaux, conservation du temps OHLC sur streaming jusqu'à sortie réelle du pointeur ; lignes de stop/TP et marqueurs d'exécutions existants conservés.
- `site/app.js` : boutons « Graphique » dans positions et ordres, notification de nouveaux cycles au micrographe, aucune écriture backend.
- `site/design-system.css` : focus isolé, panneau contextuel, tracés financiers sobres, barre mobile et reduced-motion.
- Tests : `node --test tests/site/focus-ux.test.js`, puis suite complète `node --test tests/site/*.test.js`, `python -m unittest -v`, contrôles CI et navigation desktop/mobile sur Deploy Preview. Vérifier le commit SHA exact dans Netlify (PR #64).
- Aucune modification du moteur, `state/`, `decisions/` ou `main`; ne pas fusionner ni publier en production sans GO explicite.

## UX v0.3.4 — refonte visible du dashboard (17/11/2026)
- `site/index.html` : accueil éditorial et raccourcis Marchés/Ordres ; titres à deux niveaux pour les principales sections ; IDs existants inchangés.
- `site/design-system.css` : palette graphite/jade, rythme et typographie, capital et P&L mis en avant, cockpit rééquilibré dès 940 px de largeur utile, marché et chandelier privilégiés, tableaux plus clairs, navigation active, mobile et mode réduction de mouvement.
- `VERSION=0.3.4` sur la feature uniquement ; `main` non modifiée ; le site continue de lire l'état PAPER sur `main`.
- Recette à terminer : échelle 390/768/1280/1600 px, composants générés, hover chandelier durant polling Kraken, menu ouvert/rétracté, filtres et accès clavier ; vérifier le SHA dans `version.json` sur l'aperçu Netlify.
- Pas de changement de moteur, ordres, stratégie, `state/` ou `decisions/`. Pas de fusion preprod/prod dans cette passe.

## Feature v0.3.4 — Design System (17/11/2026)
- Branche `feature/v0.3.4` depuis `preprod` ; ajout de `site/design-system.css` et chargement après `style.css`.
- Hiérarchie financière stable, contrôle tactile immédiat, indicateurs de focus cohérents, cibles mobiles, suppression des mouvements non essentiels en mode réduit.
- ADR-29 : principes d'interface native adaptés à un terminal PAPER sans lisser ou inventer de prix.
- À vérifier : CI Python/Node, affichage sur mobile et desktop, menu rétractable, chandeliers 1 h, survol et pollings sans clignotement ; revue Grok Bot avant fusion.
- `main`, `state/`, `decisions/`, moteur et stratégie inchangés. Aucun déploiement en production.

## PR #62 — test de liaison Cursor/Grok Bot
- Workflow manuel `test-grokbot-webhook.yml` proposé vers `preprod` : envoi `{"type":"test_connection"}`, sortie limitée au code HTTP, secrets GitHub non journalisés. Aucun appel exécuté lors de la PR, aucun accès moteur, `state/` ou `decisions/`.
- PR #60 déjà fusionnée dans `preprod` : notification moteur après commit/push ; reste inchangée. Publication main seulement après GO explicite de Cyril.

## PR #60 — correction revue Grok Bot
- Revue Grok Bot : OK sur le fond ; correction demandée appliquée sur `feature/grokbot-cycle-webhook`.
- Dans `.github/workflows/engine.yml`, la notification est maintenant placée après « Commit de l'etat ». L'étape de notification ne démarre que si l'étape de commit/push s'est terminée avec succès ; si le push échoue après les tentatives, le job s'arrête avant le webhook.
- `scripts/notify_grokbot.py` affiche exactement un statut sans secret : « webhook envoyé », « aucune exécution » ou « échec d'envoi ». L'échec reste non bloquant.
- Tests mis à jour dans `tests/test_grokbot_webhook.py` pour les statuts, l'envoi groupé et l'absence de fill.
- Après CI verte, fusionner la PR #60 dans `preprod` uniquement. Ne pas modifier `main`, `state/` ou `decisions/`. Le déploiement Netlify préprod automatique est à vérifier après fusion ; aucune production sans GO explicite de Cyril.

## Feature webhook Grok Bot après cycle — intégrée dans preprod (PR #60)
- PR #60 fusionnée dans `preprod` ; commit d'intégration : `da19b2631a4a5db92dd56bb2011d44fff90eed2f`.
- Séquence corrigée après revue Grok Bot : le workflow mesure la taille de `state/journal.jsonl` avant `engine/run.py`, exécute le moteur, commit/pousse l'état sur `main`, puis seulement appelle `scripts/notify_grokbot.py`.
- Si le commit/push échoue, l'étape de notification n'est pas exécutée. Si aucun état n'a changé, le commit step réussit sans push et la notification peut continuer.
- Le script envoie un seul POST JSON pour les événements `fill` ajoutés depuis l'offset ; statut loggé sans secret : « webhook envoyé », « aucune exécution » ou « échec d'envoi ».
- Secrets GitHub Actions attendus : `GROKBOT_WEBHOOK_URL` et `GROKBOT_WEBHOOK_KEY`. Une panne ou l'absence de secrets ne bloque pas le cycle.
- CI de la PR : `guard-state` et `quality-gates` vertes ; 55 tests Python exécutés, dont les 4 tests webhook.
- Netlify a annulé le build de branche preprod car aucun contenu statique n'avait changé ; cela ne remet pas en cause l'intégration du workflow et des scripts. Aucun déploiement de production.
- Aucun changement de `engine/run.py`, `state/`, `decisions/` ou logique de trading. Le nouveau workflow ne sera actif dans l'environnement moteur qu'après une promotion ultérieure sur `main`, avec le processus de release et le GO de Cyril.

## Feature v0.3.3 — cockpit haute densité (en cours)
- Passe UX consolidée : retrait des règles CSS cockpit concurrentes, container queries sur la largeur réelle de `#overview` (2 colonnes uniquement à partir de 1120 px), une colonne en espace contraint, grille KPI 4/2 colonnes. Classe `.sr-only` standard et complète pour masquer les notes de diagnostic sans casser l'accessibilité.
- Feedback live local à 720 ms sur les valeurs réellement changées : cours sélectionné, marqueurs, cellules positions/ordres, allocation et risque. Aucun flash de panneau, aucune interpolation.
- Passe visuelle v3 : `benchmark-box` composé en deux lignes indépendantes (plus de collision), explications masquées visuellement mais conservées pour lecteurs d'écran lorsque pertinent, allocation sans note comptable redondante, risque compact, compteurs moteur/Grok sur une ligne ; feedback local de 600 ms.
- Recette visuelle desktop/mobile et cohérence des métriques toujours requises avant fusion.
- Correctif du flash global : `.kpi-updated` est désormais un contenant positionné et isolé ; les mises à jour de métriques `put()` déclenchent le feedback uniquement si leur texte change. Recette visuelle requise sur Deploy Preview.
- Rafraîchissement live corrigé : `renderLive()` met à jour les métriques et les seules cellules dépendantes des prix ; les tableaux complets, les onglets Marchés, le journal, les décisions et le calendrier ne sont reconstruits que sur nouveau snapshot d'état. `KPMarkets.onPrice` et `KPExtras.onPrice` isolent les zones live.
- Feedback de changement de valeur adouci à 360 ms ; aucun lissage/interpolation des cours, aucune animation d'entrée rejouée sur polling.
- Recomposition v2 après recette visuelle : allocation unique via `extras.js` (montants + %), risque unique via `exp-risk`, suppression des rendus en double ; cartes à hauteur naturelle et risque responsive sans débordement.
- Compteur de trades clôturés calculé uniquement sur `closed_trades[].realized_pnl != null` (les fills d'achat ne sont pas comptés comme des trades clôturés).
- Branche `feature/v0.3.3-pending-order-lines`, PR #57 vers `preprod`, aucun déploiement production.
- `site/index.html`, `site/style.css`, `site/app.js` : synthèse portefeuille compacte et dense ; capital + P&L regroupés, écart BTC/frais secondaires, P&L réalisé/latent, performances 24 h/7 j depuis le dernier snapshot disponible, drawdown actuel/maximal, ratio de frais, trades gagnants/perdants, allocation en USDC et % du portefeuille, positions/ordres, risques stops actifs et conditionnels, échéances moteur/Grok.
- Chaque montant monétaire porte explicitement `USDC` ; chaque pourcentage précise sa base de référence. Données indisponibles ou incomplètes affichées comme indisponibles, pas extrapolées.
- `extras.js` conserve son rendu de l'allocation et des comptes à rebours via des éléments de compatibilité masqués accessibles ; aucun calcul métier/moteur, `state/` ou `decisions/` modifié.
- Skill `kraken-motion-ux` : animations non rejouées au polling, pas d'animation de données financières, respect `prefers-reduced-motion`.
- À valider : tests Node, CI, Deploy Preview, lecture visuelle desktop/mobile et exactitude des métriques sur les snapshots disponibles.

## PR finition v0.3.1 — préparation publication
- Branche `fix/v0.3.1-release-polish` issue de `preprod`, après fusion PR #46 (`d2942a0`).
- `VERSION=0.3.1` ; affichage du nouveau stop et des TP dans `pending_exits`, formateurs testables dans `site/app.js`.
- Trois tests JS ciblés et un test Python de compatibilité de vente limite (break-even ignoré sur vente indépendante).
- Vérifier CI, déploiement preprod et affichage mobile. Ne pas toucher à `main` ni aux données vivantes sans autorisation explicite.

## PR v0.3.1 — trois P2 de la revue Grok Bot
- Branche `feature/v0.3.1-p2-finishing` depuis `preprod`.
- `site/app.js` : sorties en attente et TP dans `order_placed` ; `site/style.css` : signal visuel accessible.
- `engine/run.py` : `breakeven_after_tp1` nécessite un stop sur les achats marché et limite, selon le contrat ADR-26.
- Tests Python dédiés. Recette : prix actuel et stop historique toujours visibles pendant `pending_exits`, journal des paliers, rejets des achats sans stop, tests Python/Node et CI.
- Revue Grok Bot nécessaire avant fusion dans `preprod` ; aucun changement sur `main`, `state/` ou `decisions/`.

## PR #45 — cours Kraken de la paire sélectionnée (préproduction)
- Branche `fix/ux-selected-live-price` depuis `preprod`, PR en brouillon.
- `site/index.html` : bandeau de cours sous les sélecteurs de crypto ; `site/markets.js` : prix et paire synchronisés ; `site/app.js` : transmission de la fraîcheur du ticker ; `site/style.css` : affichage mobile lisible.
- Aucun appel API supplémentaire : réutilise le ticker 15 s déjà présent. En échec, dernier cours du cycle indiqué comme non direct.
- Recette à faire : iPhone, changement BTC/ETH/SOL, rafraîchissement 15 s, indisponibilité API, absence de clignotement du graphique. Ne pas fusionner avant CI verte.

## Revue Grok Bot PR #44 — correctifs après GO sous réserves
- Correctifs P1 engagés : validation du stop par rapport au dernier cours dans `update_exits`, prix du stop borné à l'ouverture en cas de gap (5 min et repli 1 h), prix limite d'achat préservé dans le dashboard.
- P2 traités partiellement : refus de TP sous cours, booléen strict `breakeven_after_tp1`, stop obligatoire si break-even, compteur `tp_filled` conservé après mise à jour, résumés des décisions.
- **Corrigé, à revalider par Grok Bot** : continuité de protection par l'ancien stop pendant le délai d'activation de `update_exits`, via `pending_exits` ; tests dédiés ajoutés.
- Recette supplémentaire à compléter : scénarios gap après TP1, plusieurs TP dans la même 5 min, fractions 0,3333, décisions rejouées, tests JS dashboard et rejeu fixe de `main`.
- Ne pas fusionner avant CI verte sur le dernier commit et nouvelle revue Grok Bot.

## Développement v0.3.0 — paliers (ADR-26)
- Branche `feature/v0.3-paliers` depuis `preprod` ; moteur et tests en cours, aucune fusion.
- Un groupe de sortie représente le stop et tous les TP sans double réservation ; `take_profits` et `tp_filled` suivent la quantité résiduelle.
- À finaliser : affichage Ordres, gain/risque global, lignes graphiques, historique et journal, tests et CI ; revue Grok Bot avant fusion.
- Ne jamais modifier `state/`, `decisions/` ou `main`.

## Retour au dashboard de production — ADR-25
- Branche de travail `fix/restore-prod-ui-preprod` basée sur `preprod` : fichiers du site remis à l'identique de `main`, sans reprendre l'état vivant ni les décisions.
- Les tests créés pour les workspaces de `preprod` peuvent devoir être adaptés ou retirés dans un lot de nettoyage contrôlé. Vérifier CI et rendu Netlify avant toute fusion.
- PR #41 Analog / Robotic exclue. `main` et `preprod` inchangées tant que la PR de restauration n'est pas validée.

## Refonte visuelle v0.3.1 — Nocturne Signal
- Branche feature/v0.3.1-nocturne-signal ; design CSS, palette graphique Lightweight Charts, monogramme K/, VERSION 0.3.1.
- ADR : docs/ADR-21-NOCTURNE-SIGNAL.md. La préproduction seule reçoit cette version ; main et PAPER restent intacts.
- Vérifier sur Netlify l'en-tête `v0.3.1`, le commit exact et la branche `preprod`. Ne pas fusionner en prod sans Cyril.

## UX v0.3.0 — reprise
- PR #37 : quatre rubriques (Vue d’ensemble, Marchés, Ordres, Historique), ancres compatibles et aucun changement du moteur.
- ADR : `docs/ADR-20-UX-NAVIGATION.md`. Préprod uniquement, valider sur iPhone avant toute release.

## v0.2.2 — lot d'intégration UX (PR #28–#35)
- Référentiels modern-web-guidance et kraken-motion-ux, checklist UX.
- Navigation mobile : fermeture et restitution du focus, tests unitaires.
- Chandelier : aide textuelle, préférences normalisées, tests de régression et commandes plus lisibles.
- Ordres et scanner : meilleure hiérarchie des états visuels ; cibles tactiles et focus renforcés.
- Les changements concernent uniquement la présentation du dashboard ; aucun moteur, état ou décision modifié.
- Validation : `node --test tests/site/*.test.js`, `python -m unittest -v`, contrôle CI et recette sur Safari iPhone / desktop, sans mouvement imposé.
- Intégration de remplacement des PR #28–#35 : ne pas les fusionner à nouveau. Aucun déploiement de production autorisé.

# Kraken Paper : document de reprise

## Démarrage v0.2.2 — fiabilité des données
- Branche `fix/v0.2.2-dashboard-reliability`, issue de `preprod`, destinée à une PR vers `preprod`.
- Premier correctif : le validateur de `equity.csv` refuse les valeurs de portefeuille ou benchmark négatives et les champs equity vides/espaces ; les erreurs préservent le dernier snapshot valide.
- Contrôler `node --test tests/site/*.test.js`, puis les tests Python et Netlify, et vérifier les données valides ainsi que le comportement sur un CSV malformé. Revue Grok Bot requise.
- Aucun changement du moteur, de la stratégie, de `state/`, de `decisions/` ou de `main`.


## Cause racine du débordement mobile
- L'ancien CSS tablette `#positions-panel table { min-width: 620px; }` et `#markers table { min-width: 760px; }` était plus spécifique que la règle mobile par identifiant simple. Les cartes s'étendaient donc malgré les contraintes de grille.
- Correctif : sélecteurs combinés `#positions-panel #positions` et `#market-card #markers` dans la media query téléphone. Tests de cascade ajoutés ; vérifier Safari après déploiement du nouveau SHA.

## Correctif mobile Positions
- Capture iPhone du 14/11 : fiches Positions débordant à droite malgré le conteneur étroit.
- Correction des contraintes intrinsèques CSS grid sur les corps et lignes de tableaux mobiles ; même garde-fou pour Ordres, Trades et Marqueurs.
- Recette Safari réelle indispensable : le test CSS ne remplace pas une mesure de largeur à l'écran.

## Lot unique de refonte mobile — à valider sur appareil
- Branche `feature/v0.2.1-mobile-dashboard-overhaul` : CSS responsive des quatre tableaux, filtres, KPI, chandelier et journal ; tests `mobile-dashboard-layout.test.js`.
- Les tableaux desktop et le calcul des ordres sont inchangés. Sous 680 px, les lignes sont des fiches ; les détails des ordres restent pilotés par le bouton existant.
- Avant validation Grok Bot : contrôler iPhone Safari (320/375/430 px), Android Chrome, tablette 768 px, desktop, clavier/VoiceOver, filtres, détails et mise à jour en direct. La CI ne constitue pas une recette visuelle.

## Intégration dashboard : contrat de bout en bout
- Branche `fix/v0.2.1-integrated-dashboard-contracts` : `site/markets.js` et `tests/site/integrated-dashboard-contracts.test.js`.
- Une paire disparue pendant la session déclenche désormais une nouvelle lecture du graphique BTC ; avant, seule la sélection visuelle changeait.
- Les tests couvrent les contrats statiques et de cohérence ; une recette interactive sur le site déployé reste indispensable. Aucun changement du moteur PAPER ni de production.

## Scanner : intégration et récupération des paires
- Branche `fix/v0.2.1-scanner-failure-recovery` vers `preprod`. Le scanner indique `scannerCompleted/scannerTotal` pendant la lecture, et distingue les paires indisponibles en fin de cycle.
- Les nouvelles paires provenant des positions ou ordres déclenchent une nouvelle analyse. Tests `tests/site/scanner-recovery.test.js`.
- Recette visuelle à effectuer ; aucune modification de stratégie, moteur, `state/`, `decisions/` ni production.

## Scanner de marchés — lot de performance
- Branche `perf/v0.2.1-market-scanner-batch` : orchestration de `refreshMetrics` dans `site/markets.js`, test `tests/site/scanner-batch.test.js`.
- Les données restent publiques Kraken ; benchmark BTC calculé avant la force relative, deux workers maximum pour les autres actifs.
- Vérifier les marqueurs après un cycle de rafraîchissement, les prix partiels, les erreurs Kraken, et l'absence de requêtes superposées. `main`, `state/` et `decisions/` intouchés.

## Itération UX chandelier — session et actualisation
- Branche `fix/v0.2.1-chart-session-consistency` ; fichiers `site/chart-preferences.js`, `site/markets.js`, `site/index.html`, tests `tests/site/chart-session.test.js`.
- Les préférences restent dans sessionStorage (pas de donnée de trading), valeurs par défaut BTC/1 h/120. Actualiser force une lecture OHLC sans effet sur le moteur.
- Vérifier la recette sur préproduction et le comportement lorsque Kraken ne répond pas, sans toucher à production.

## Lot de développement — chandelier résilient (14/11/2026)
- Branche `fix/v0.2.1-chart-concurrency-and-resilience`, PR vers `preprod` uniquement.
- `site/ohlc-utils.js` : validateur de bougies ; `site/markets.js` : séquencement des requêtes et gestion du chargement.
- Vérifier les tests `tests/site/chart-concurrency.test.js`, l'ADR-19 et le comportement du graphique lors de changements rapides de paire et de période.
- Aucune modification moteur PAPER, stratégie, `state/`, `decisions/` ni production.

## Itération données publiques — 14/11/2026
- Branche `fix/v0.2.1-market-data-guardrails` : `site/data-validators.js`, validation atomique CSV/JSONL, prix Kraken partiels signalés.
- Le moteur reste source de vérité ; en cas de snapshot invalide, conserver le dernier rendu et afficher l'alerte, sans modifier les données.
- Tests `tests/site/market-data-guardrails.test.js`, ADR-18 ; recette Netlify à effectuer après CI et fusion.

## État de l'itération — historiques longs (14/11/2026)
- Branche `fix/v0.2.1-history-scale-and-data-integrity` vers `preprod` : helper `site/history-utils.js` et tests `tests/site/history-scale.test.js`.
- Les cycles complets restent la source de vérité ; le SVG seul est échantillonné en conservant extrema et ruptures. ADR-17.
- Vérifier CI, affichage mobile, périodes 1 an/tout, journal, survol et absence de modification PAPER avant validation.


> Stabilisation du rafraîchissement UX v0.2.1 : une seule lecture d'état à la fois, validation et publication groupée portefeuille/equity/journal, nouvelle tentative après snapshot invalide, réponses de prix hors ordre ignorées, journal/trades/courbe reconstruits uniquement lors d'un nouveau snapshot (pas toutes les 15 s). Aucun changement du moteur PAPER. Branche `fix/v0.2.1-data-refresh-integrity` vers `preprod`, tests et recette navigateur obligatoires.

> Explorateur d'historique UX v0.2.1 : courbe 24 h, 7 j, 30 j, 90 j, 6 mois (180 j), 1 an (365 j), tout; journal 40/100/250/tous les événements disponibles, avec indication explicite de la profondeur chargée et des filtres sur les entrées visibles. Aucun événement ni point de courbe inventé, lecture seule. Branche `feature/v0.2.1-history-explorer` vers `preprod`, recette CI + navigateur obligatoire avant fusion.

> Itération de stabilisation UX v0.2.1 : déconnexion temporaire et reconnexion garantie du MutationObserver pendant le tri DOM (sans masquer les nouvelles données), étiquette du chandelier fondée sur le nombre réel de bougies chargées, tests de non-régression et maintien de la navigation/du survol. Aucun changement de simulation. Branche `fix/v0.2.1-integrated-regression` vers `preprod`; attendre CI et vérifier Netlify avant toute conclusion de déploiement.

> Durcissement UX v0.2.1 : correction du tri P&L négatif (signe moins typographique), protection contre la rétroaction MutationObserver lors des tris, accès direct Performance/Historique depuis la navigation, nom accessible du graphique portefeuille, tests d'intégration HTML/navigation/labels/scripts et non-régression du tri. Branche `fix/v0.2.1-ux-hardening` vers `preprod`. Contrôler CI et recette navigateur avant fusion.

> Lot UX v0.2.1 performance et journal : périodes de courbe 24 h / 7 j / 30 j / tout (cycles réels uniquement), compteur de cycles, journal filtrable par texte et type d'événement, remise à zéro, tests Node et ergonomie mobile. Aucune modification moteur, stratégie ou données PAPER. Branche `feature/v0.2.1-performance-journal` vers `preprod`, sous réserve CI et recette.

> Lot UX portefeuille v0.2.1 : tri des positions (valeur, P&L signé, nom), recherche crypto, recherche et filtre achat/vente dans l'historique des trades, compteurs et réinitialisation, affichage mobile. Opérations uniquement visuelles, aucun changement moteur, stratégie, état ou décisions. Branche `feature/v0.2.1-portfolio-workspace` vers `preprod`, à valider par CI et recette visuelle.

> Lot graphique UX v0.2.1 : choix de fenêtre 60/120/240 bougies, recentrage manuel, lecture mobile améliorée, conservation du survol et de la vue pendant les rafraîchissements. Aucun changement de données, moteur ou stratégie. Branche `feature/v0.2.1-chart-workspace` à valider avant fusion.

> Correctif UX 0.2.1 : remise à zéro des filtres en un clic, message explicite sans résultat, tests Node automatisés sur les filtres d'ordres et de marché. Aucun changement moteur. Branche `fix/v0.2.1-filter-reliability`, PR à valider vers `preprod`.

> À lire en premier si tu reprends le projet (GPT, un autre agent, ou un humain).
> UX 0.2.1 : menu latéral fusionné `0e744d8`, tableaux Positions/Ordres fusionnés `9558c00` dans `preprod`. Branche en cours `feature/v0.2.1-market-workspace` : filtres UI marqueurs/ordres, responsive, aucun changement moteur.
>
> Dernière mise à jour : 14/11/2026. Netlify préprod doit être vérifié par commit, le déploiement est manuel.

## Reprise UX 0.2.1 (branche feature/v0.2.1-dashboard-layout)

- Base : branche `preprod` affichée au commit `fc9af4c` lors du contrôle navigateur.
- Navigation par ancres, positions et ordres placés après le graphique, chandeliers en 1 h par défaut et largeur accrue sur grand écran.
- Le survol des chandeliers est conservé lors des mises à jour de cours (hors changement de marché ou d'unité).
- À vérifier avant fusion : navigation clavier/mobile, graphique et survol stable pendant les mises à jour, tests Node/Python, relecture Grok Bot.
- Aucun déploiement ni fusion automatique vers `main` ; `state/` et `decisions/` intouchés.

## 1. Le projet en bref

Kraken Paper est un **simulateur de trading crypto en argent fictif** (PAPER) qui utilise les **vrais prix Kraken**.
But : apprendre le plus possible, le plus vite possible, sur des styles de trading actifs, avec des frais réalistes,
une justification écrite pour chaque décision et un bilan hebdomadaire des leçons.

- Propriétaire : **Cyril Laferrère**.
- Capital de départ : **6 606,42 USDC** fictifs, le 13/11/2026 à 22:56 (heure de Paris).
- Aucune limite de perte : la simulation ne s'arrête jamais.
- **Aucun ordre réel n'est jamais passé.** Uniquement l'API publique Kraken.

| Lien | Rôle |
| --- | --- |
| https://github.com/cyrillaferrere/kraken-paper | Dépôt public (code, état, décisions) |
| https://kraken-paper.netlify.app | Tableau de bord **prod** (branche `main`) |
| https://preprod--kraken-paper.netlify.app | Tableau de bord **préprod** (branche `preprod`, déploiement non production du même site) |
| `https://feature-<nom>--kraken-paper.netlify.app` | Aperçu d'une branche `feature/<nom>` |
| https://github.com/cyrillaferrere/kraken-paper/actions | Cycles du moteur |

## 2. Qui fait quoi

| Qui | Rôle |
| --- | --- |
| **Grok Bot** (assistant « Kraken - Bot Crypto ») | Chef de projet technique et **seul décideur de trading** : sessions de gestion, fichiers `decisions/`, bilan hebdo. Relit toutes les PR. |
| **GPT** | Maintenance et évolutions du code (dash, moteur, tests) **par PR** vers `preprod`. Ne touche jamais `decisions/` ni `state/`. |
| **Cyril** | Teste la préprod, **valide chaque mise en prod**, valide toute évolution du moteur. |
| Dev CASCIE | Une relecture ponctuelle du projet, pas de rôle permanent. |

Si Grok Bot n'est pas disponible : les ordres déjà posés continuent d'être gérés par le moteur (stops et objectifs
compris). Personne d'autre ne prend de décision de trading sans l'accord explicite de Cyril.

## 3. Architecture

```
 Grok Bot (session)                    GitHub (dépôt public)                       Netlify (site unique)
 ───────────────────                   ─────────────────────                       ──────────────────
 lit l'état, analyse le      push      decisions/<id>.json                         site/ (HTML/CSS/JS)
 marché (API publique) ────────────▶   │                                           │ lit l'état sur main
                                       ▼                                           │ via l'API GitHub (repli raw)
                              GitHub Actions « engine »   ── commit ──▶ state/ ◀───┘
                              déclenché par :                                      │
                               • fonction Netlify, min. 9 UTC (principal, prod)    │ engine-trigger
                               • cron GitHub, min. 7 UTC (secours)                 │ (schedule, prod seulement)
                               • push dans decisions/     ◀── workflow_dispatch ───┘
                               • lancement manuel
                                       │
                                       ▼
                              ntfy.sh ──▶ téléphone de Cyril
 Le dash lit aussi les prix et bougies sur l'API publique Kraken.
```

- **Un seul site Netlify** (`kraken-paper`) : la prod est son déploiement de production, la préprod et les features sont
  des déploiements non production avec un alias (`preprod--`, `feature-<nom>--`). Un futur stockage ou des variables
  d'environnement seront donc au même endroit.
- **L'état vit uniquement sur `main`, et il n'est écrit que par le moteur** (workflow `engine`). Les décisions
  (`decisions/`) ne sont écrites que par Grok Bot, directement sur `main`. Prod, préprod et features lisent le même état de
  `main` via l'API GitHub : **le dash est en lecture seule**, il n'écrit jamais rien.
- **Une release ne livre que du code.** Les branches `preprod` et `feature/*` ne modifient jamais `state/` ni
  `decisions/` : le contrôle CI `guard-state` bloque toute PR ou tout push qui le ferait, et `scripts/release.sh` refuse
  une fusion vers `main` qui toucherait ces dossiers. Passer la préprod en prod ne peut donc pas écraser le portefeuille
  ni les ordres.
- Le moteur ne tourne **que depuis `main`** (garde-fou `if:` dans le workflow ; les déclencheurs, y compris la fonction
  Netlify, demandent toujours `ref: main`). Déclencheur principal : fonction planifiée Netlify `engine-trigger`
  (minute 9 UTC), qui n'est exécutée que sur le déploiement de production. Secours : cron GitHub (minute 7 UTC).

## 4. Fichiers

| Chemin | Rôle |
| --- | --- |
| `engine/run.py` | Moteur, Python stdlib. Un appel = un cycle. |
| `tests/test_engine.py` | Tests du moteur, sans réseau : `python -m unittest -v`. |
| `tests/test_reservations.py` | Tests de réservation du cash et des quantités. |
| `tests/site/*.test.js` | Tests du calcul des ordres du dash : `node --test tests/site/*.test.js`. |
| `tests/functions/*.test.mjs` | Tests de la fonction planifiée (fetch mocké) : `node --test tests/functions/*.test.mjs`. |
| `.github/workflows/engine.yml` | Cycle : fonction Netlify + cron GitHub (secours) + push `decisions/**` + manuel. |
| `netlify/functions/engine-trigger.mjs` | Fonction planifiée Netlify (minute 9 UTC) : `workflow_dispatch` sur `main`. |
| `decisions/*.json` | Décisions de Grok Bot, une par session, appliquées une seule fois par `id`. |
| `state/portfolio.json` | **Source de vérité** : cash, positions, ordres ouverts, trades, frais, décisions traitées. |
| `state/journal.jsonl` | Journal en ajout seul (décisions, ordres, exécutions, refus, notes, alertes). |
| `state/equity.csv` | Un point par cycle : valeur du portefeuille et de « BTC conservé ». |
| `site/index.html`, `style.css` | Tableau de bord. |
| `site/app.js` | Lecture de l'état, KPI, positions, ordres (calcul perte/gain), trades, journal, courbe, version. |
| `site/markets.js` | Graphiques en bougies, indicateurs (MA, RSI, ATR), étiquettes des niveaux, bouton « Ordres », tableau des marqueurs. |
| `site/lib.js` | Fonctions pures testées : markdown sûr, résumé des actions, performance par jour, comptes à rebours, exposition, proximité. |
| `site/extras.js` | Exposition, prochains passages, calendrier, fil des décisions, leçons (API GitHub avec ETag et cache local). |
| `docs/LESSONS.md` | Leçons apprises, affichées dans le dash. Écrites par Grok Bot (bilan hebdo), une entrée par leçon, la plus récente en haut. |
| `site/version.json` | **Généré au déploiement** par `scripts/deploy.sh` (absent du dépôt). |
| `scripts/deploy.sh` | Déploiement prod / préprod / feature sur le site unique. |
| `scripts/release.sh` | Mise en prod du code (preprod → main) avec garde-fou state/decisions. |
| `scripts/netlify-build.sh` | Commande de build Netlify : écrit `version.json` s'il manque. |
| `.github/workflows/guard-state` (`guard.yml`) | Échoue si une PR ou une branche autre que main modifie `state/` ou `decisions/`. |
| `VERSION`, `CHANGELOG.md` | Version SemVer et historique. |
| `docs/` | Ce document, RUNBOOK, CONTRIBUTING, décisions techniques (ADR). |
| `.ntfy_topic` | Canal ntfy, **local uniquement** (gitignoré), copie du secret Actions `NTFY_TOPIC`. |
| `GITHUB_DISPATCH_TOKEN` | Variable d'environnement Netlify (scopes builds/functions/runtime, secret), **jamais dans le dépôt**. Voir [RUNBOOK](RUNBOOK.md). |

## 5. Règles du moteur (résumé)

À chaque cycle : charger l'état → appliquer les nouvelles décisions (une fois par `id`) → rejouer les bougies 1 h
**clôturées** depuis la dernière traitée → enregistrer un point de valeur → sauvegarder → notifier les exécutions.

- **Achat limite** exécuté si le plus bas de la bougie ≤ prix limite, au prix limite, **maker 0,40 %**.
- **Vente limite / objectif** exécutée si le plus haut ≥ prix, au prix, **maker 0,40 %**.
- **Stop** exécuté si le plus bas ≤ stop, au **stop − 0,1 %**, **taker 0,80 %**.
- **Stop et objectif dans la même heure** : le premier touché en bougie 5 min gagne ; le stop l'emporte seulement s'ils sont dans la **même bougie 5 min** (si les 5 min manquent : stop prioritaire sur la bougie 1 h, comme avant).
- Le fill est daté à l'ouverture de la première bougie 5 min qui touche le niveau ; repli : ouverture de la bougie 1 h. Prix et frais inchangés. L'état déjà écrit n'est pas modifié (le dash ajuste l'affichage des anciens marqueurs).
- **Ordre au marché** : dernier prix ± 0,1 %, taker 0,80 %.
- Un ordre ne regarde que les bougies qui **commencent après sa pose** (`active_from`).
- Un achat limite avec `stop_loss` / `take_profit` crée, une fois exécuté, l'ordre de sortie (OCO).
- Refus si cash ou quantité insuffisants (ni levier ni vente à découvert), si l'ordre limite est déjà exécutable
  (utiliser un ordre au marché), si la paire n'est pas en USDC ou pas disponible en France (`country_code=FR`).
- Frais arrondis à 6 décimales, quantités aux décimales de la paire (AssetPairs).
- Si l'API Kraken ne répond pas : étape sautée, état intact, décision retentée au cycle suivant.
- Référence « BTC conservé » : tout le capital en BTC au premier cycle (maker 0,40 %), puis gardé.

## 6. Contrat des décisions (`decisions/<id>.json`)

```json
{"id": "2026-11-14-matin", "timestamp": "2026-11-14T08:30:00+01:00",
 "rationale": "Pourquoi, en clair : tendance, niveaux, marqueurs utilisés, risque.",
 "actions": [
  {"type": "market_buy", "pair": "BTC/USDC", "quote_amount": 1000, "stop_loss": 63000},
  {"type": "place_limit", "pair": "ETH/USDC", "side": "buy", "quote_amount": 800, "price": 1850, "stop_loss": 1700, "take_profit": 2100},
  {"type": "place_limit", "pair": "XBTUSDC", "side": "sell", "qty": 0.005, "price": 74000, "stop_loss": 64000},
  {"type": "cancel", "order_id": "O0003"},
  {"type": "note", "text": "Leçon à vérifier : ..."}]}
```

| Action | Champs |
| --- | --- |
| `place_limit` | `pair`, `side` (`buy`/`sell`), `qty` **ou** `quote_amount` (USDC), `price`, option `stop_loss`, option `take_profit` (achat seulement) |
| `market_buy` | `pair`, `qty` ou `quote_amount`, option `stop_loss`, `take_profit` |
| `market_sell` | `pair`, `qty` ou `quote_amount` |
| `cancel` | `order_id` |
| `note` | `text` |

- `id` **unique et jamais réutilisé** (convention `AAAA-MM-JJ-HHhMM`). Un fichier peut contenir une liste.
- Une action refusée est journalisée (`rejected`) sans bloquer les autres.
- `quote_amount` d'un achat inclut les frais : quantité = montant / (prix × (1 + frais)).

## 7. Comment se passe une session de Grok Bot

Environ toutes les 5 heures (routine de Grok Bot) :
1. Lire `state/` sur `main` (positions, ordres, dernier cycle, erreurs).
2. Analyser le marché avec l'API publique Kraken : tendance (MA20/MA50 en 4 h et 1 j), niveaux, RSI, ATR, volume, force vs BTC.
3. Écrire `decisions/<id>.json` avec une justification claire, commit `decision: <id>`, push sur `main`
   (déclenche un cycle immédiat).
4. Vérifier dans Actions puis `state/journal.jsonl` que la décision est appliquée (ou lire la raison des refus).
5. Envoyer un court récapitulatif en français à Cyril.

Chaque semaine : bilan des leçons (quels styles et quels marqueurs ont fonctionné, frais payés, écart vs BTC conservé).

## 8. Environnements et cycle de livraison

`feature/<nom>` → PR vers `preprod` → déploiement préprod (alias) → **Cyril teste** → `scripts/release.sh X.Y.Z` (preprod → `main`, code seulement) →
déploiement prod **après l'accord de Cyril** → tag `vX.Y.Z`. Détails : [RUNBOOK](RUNBOOK.md), [CONTRIBUTING](CONTRIBUTING.md).

## 9. Ce qu'il ne faut jamais faire

- Passer un ordre réel, utiliser un endpoint privé Kraken, mettre une clé Kraken dans le dépôt ou dans les secrets.
- Retirer ou transférer des fonds (interdit en toutes circonstances).
- Modifier `state/` à la main, sauf la procédure de récupération du RUNBOOK.
- Écrire dans `decisions/` si on n'est pas Grok Bot (ou sans l'accord explicite de Cyril).
- Déployer la prod sans l'accord de Cyril.
- Toucher un autre dépôt ou site (en particulier `planning-com-cascie`), ou le dossier `/workspace/kraken-jeu`.

## 10. Où en est le projet

Voir [CHANGELOG](../CHANGELOG.md). Idées en attente : stop suiveur, page de bilan hebdo, alertes ntfy plus fines,
backtest de la leçon du 14/11 (entrées fractionnées en survendu).

Budget API GitHub du dash (60 requêtes/h par visiteur, sans clé) : état = `commits/main` en sha + ETag (304 gratuit)
puis 3 fichiers seulement quand le sha change ; décisions = liste `contents/decisions` avec ETag (304 gratuit),
chaque nouveau fichier lu une seule fois par son sha (`git/blobs`) puis gardé en `localStorage` ; leçons =
`contents/docs/LESSONS.md` avec ETag, lu sur la branche déployée (`preprod` en préprod, `main` en prod). Sur 403/429
le dash attend 10 min et affiche les décisions depuis le journal.

## 11. Chantier contrôle qualité (14/11/2026)

**Branche** : `feature/quality-gates-handoff`, issue de `preprod`. **Objet** : sécuriser les futures PR avant les fonctionnalités v0.3.0. Aucun changement du moteur, des stratégies, de `state/`, de `decisions/`, du site Netlify ou de la production.

**Audit initial** : `main` était 11 commits devant `preprod` au moment du contrôle, avec les derniers commits `55284ec`, `7c79bd7`, `6d5c9c6` correspondant aux cycles horaires (fichiers `state/`). Ne jamais recopier l'état de préprod sur main. La synchronisation des branches doit préserver les fichiers d'état de main et être validée par les protections existantes.

**Ajout** : `.github/workflows/quality.yml`, job `quality`, vérifie les PR vers `preprod`/`main` et les branches de développement : aucun changement de `state/` ou `decisions/`, CHANGELOG et HANDOFF modifiés sur chaque PR, tests `python -m unittest -v`, `node --test tests/site/*.test.js`, `node --test tests/functions/*.test.mjs`, `node --check` des JS, `bash -n` des scripts, invariants statiques de livraison. **Aucun cycle moteur ni déploiement** dans ce workflow. ADR-15 et RUNBOOK détaillent la décision et l'exploitation.

**Pour Grok Bot** : lire la PR de cette branche vers `preprod`, inspecter les checks GitHub, vérifier les chemins protégés et confirmer que les tests passent. Ne pas confondre tests verts et blocage des merges : configuration cible : PR et checks obligatoires uniquement sur `preprod` ; sur `main`, ni PR ni checks obligatoires, car le moteur et Grok Bot poussent directement. Sur `main`, interdire force-push/suppression et, si techniquement réalisable, restreindre les pushes à `github-actions[bot]` et `cyrillaferrere` ; ne pas activer de règle sans accord explicite de Cyril. Une fois les checks et la revue validés, intégrer dans `preprod` et tester. Aucune release `main` ni prod sans validation de Cyril.

**Reste à faire** : vérifier les checks CI à nouveau après ces corrections documentaires, passer la PR Ready et fusionner en squash dans `preprod` après validation ; ne configurer les règles GitHub qu'après accord explicite de Cyril, et uniquement selon la matrice `preprod`/`main` documentée dans le RUNBOOK. Puis lancer les développements UX v0.3.0. Les tests navigateur/visuels restent manuels à ce stade.

## 12. Déploiement préprod autonome par GPT (ADR-16, 14/11/2026)

**Pourquoi** : la préprod v0.2.0 commit `7f58759` a été déployée et vérifiée par Grok Bot ; l'objectif est de permettre à GPT de déployer les prochains changements sans consommer le forfait Grok Bot.

**Implémentation** : branche `feature/preprod-deploy-actions`, PR vers `preprod` ; nouveau workflow `.github/workflows/deploy-preprod.yml`, déclenchement automatique sur push vers `preprod` uniquement, environnement GitHub `preprod`, secret `NETLIFY_AUTH_TOKEN`, script existant `scripts/deploy.sh preprod`, vérification du commit via `version.json`. Pas de déclencheur sur `main`, pas de `--prod`, pas d'écriture dans `state/` ou `decisions/`, pas de changement de logique de trading.

**Reprise Grok Bot / GPT** : après revue et CI vertes, fusionner la PR dans `preprod` ; Cyril configure une seule fois le secret GitHub de l'environnement `preprod` sans jamais le partager en chat. La fusion dans `preprod` déclenche le workflow automatiquement ; vérifier que le SHA du dashboard correspond au commit de `preprod`. Si aucun run ne démarre, vérifier le push vers `preprod` et la présence du workflow ; si le run échoue, consulter les logs sans afficher le secret. Le jeton Netlify n'est pas intrinsèquement restreint à la préprod : la sécurité repose aussi sur le workflow et les permissions du compte Netlify. **Aucun déploiement prod sans accord de Cyril.**

**Statut** : workflow proposé, secret GitHub `preprod` configuré le 14/11/2026 ; attendre la revue Grok Bot, la fusion et le premier run réussi. Le déclencheur manuel a été remplacé par `push` sur `preprod` pour éviter l'exigence GitHub de présence sur la branche par défaut. Aucune règle GitHub changée.

## Intégration v0.3.0
- Reprise du code de PR #37 sur preprod après fusion documentaire #38, sans conflits. Vérifier CI, ancres et Safari avant prod.


<!-- ARCHIVE MAIN AVANT PUBLICATION — À RÉCONCILIER -->
# Kraken Paper : document de reprise

## Cause racine du débordement mobile
- L'ancien CSS tablette `#positions-panel table { min-width: 620px; }` et `#markers table { min-width: 760px; }` était plus spécifique que la règle mobile par identifiant simple. Les cartes s'étendaient donc malgré les contraintes de grille.
- Correctif : sélecteurs combinés `#positions-panel #positions` et `#market-card #markers` dans la media query téléphone. Tests de cascade ajoutés ; vérifier Safari après déploiement du nouveau SHA.

## Correctif mobile Positions
- Capture iPhone du 14/11 : fiches Positions débordant à droite malgré le conteneur étroit.
- Correction des contraintes intrinsèques CSS grid sur les corps et lignes de tableaux mobiles ; même garde-fou pour Ordres, Trades et Marqueurs.
- Recette Safari réelle indispensable : le test CSS ne remplace pas une mesure de largeur à l'écran.

## Lot unique de refonte mobile — à valider sur appareil
- Branche `feature/v0.2.1-mobile-dashboard-overhaul` : CSS responsive des quatre tableaux, filtres, KPI, chandelier et journal ; tests `mobile-dashboard-layout.test.js`.
- Les tableaux desktop et le calcul des ordres sont inchangés. Sous 680 px, les lignes sont des fiches ; les détails des ordres restent pilotés par le bouton existant.
- Avant validation Grok Bot : contrôler iPhone Safari (320/375/430 px), Android Chrome, tablette 768 px, desktop, clavier/VoiceOver, filtres, détails et mise à jour en direct. La CI ne constitue pas une recette visuelle.

## Intégration dashboard : contrat de bout en bout
- Branche `fix/v0.2.1-integrated-dashboard-contracts` : `site/markets.js` et `tests/site/integrated-dashboard-contracts.test.js`.
- Une paire disparue pendant la session déclenche désormais une nouvelle lecture du graphique BTC ; avant, seule la sélection visuelle changeait.
- Les tests couvrent les contrats statiques et de cohérence ; une recette interactive sur le site déployé reste indispensable. Aucun changement du moteur PAPER ni de production.

## Scanner : intégration et récupération des paires
- Branche `fix/v0.2.1-scanner-failure-recovery` vers `preprod`. Le scanner indique `scannerCompleted/scannerTotal` pendant la lecture, et distingue les paires indisponibles en fin de cycle.
- Les nouvelles paires provenant des positions ou ordres déclenchent une nouvelle analyse. Tests `tests/site/scanner-recovery.test.js`.
- Recette visuelle à effectuer ; aucune modification de stratégie, moteur, `state/`, `decisions/` ni production.

## Scanner de marchés — lot de performance
- Branche `perf/v0.2.1-market-scanner-batch` : orchestration de `refreshMetrics` dans `site/markets.js`, test `tests/site/scanner-batch.test.js`.
- Les données restent publiques Kraken ; benchmark BTC calculé avant la force relative, deux workers maximum pour les autres actifs.
- Vérifier les marqueurs après un cycle de rafraîchissement, les prix partiels, les erreurs Kraken, et l'absence de requêtes superposées. `main`, `state/` et `decisions/` intouchés.

## Itération UX chandelier — session et actualisation
- Branche `fix/v0.2.1-chart-session-consistency` ; fichiers `site/chart-preferences.js`, `site/markets.js`, `site/index.html`, tests `tests/site/chart-session.test.js`.
- Les préférences restent dans sessionStorage (pas de donnée de trading), valeurs par défaut BTC/1 h/120. Actualiser force une lecture OHLC sans effet sur le moteur.
- Vérifier la recette sur préproduction et le comportement lorsque Kraken ne répond pas, sans toucher à production.

## Lot de développement — chandelier résilient (14/11/2026)
- Branche `fix/v0.2.1-chart-concurrency-and-resilience`, PR vers `preprod` uniquement.
- `site/ohlc-utils.js` : validateur de bougies ; `site/markets.js` : séquencement des requêtes et gestion du chargement.
- Vérifier les tests `tests/site/chart-concurrency.test.js`, l'ADR-19 et le comportement du graphique lors de changements rapides de paire et de période.
- Aucune modification moteur PAPER, stratégie, `state/`, `decisions/` ni production.

## Itération données publiques — 14/11/2026
- Branche `fix/v0.2.1-market-data-guardrails` : `site/data-validators.js`, validation atomique CSV/JSONL, prix Kraken partiels signalés.
- Le moteur reste source de vérité ; en cas de snapshot invalide, conserver le dernier rendu et afficher l'alerte, sans modifier les données.
- Tests `tests/site/market-data-guardrails.test.js`, ADR-18 ; recette Netlify à effectuer après CI et fusion.

## État de l'itération — historiques longs (14/11/2026)
- Branche `fix/v0.2.1-history-scale-and-data-integrity` vers `preprod` : helper `site/history-utils.js` et tests `tests/site/history-scale.test.js`.
- Les cycles complets restent la source de vérité ; le SVG seul est échantillonné en conservant extrema et ruptures. ADR-17.
- Vérifier CI, affichage mobile, périodes 1 an/tout, journal, survol et absence de modification PAPER avant validation.


> Stabilisation du rafraîchissement UX v0.2.1 : une seule lecture d'état à la fois, validation et publication groupée portefeuille/equity/journal, nouvelle tentative après snapshot invalide, réponses de prix hors ordre ignorées, journal/trades/courbe reconstruits uniquement lors d'un nouveau snapshot (pas toutes les 15 s). Aucun changement du moteur PAPER. Branche `fix/v0.2.1-data-refresh-integrity` vers `preprod`, tests et recette navigateur obligatoires.

> Explorateur d'historique UX v0.2.1 : courbe 24 h, 7 j, 30 j, 90 j, 6 mois (180 j), 1 an (365 j), tout; journal 40/100/250/tous les événements disponibles, avec indication explicite de la profondeur chargée et des filtres sur les entrées visibles. Aucun événement ni point de courbe inventé, lecture seule. Branche `feature/v0.2.1-history-explorer` vers `preprod`, recette CI + navigateur obligatoire avant fusion.

> Itération de stabilisation UX v0.2.1 : déconnexion temporaire et reconnexion garantie du MutationObserver pendant le tri DOM (sans masquer les nouvelles données), étiquette du chandelier fondée sur le nombre réel de bougies chargées, tests de non-régression et maintien de la navigation/du survol. Aucun changement de simulation. Branche `fix/v0.2.1-integrated-regression` vers `preprod`; attendre CI et vérifier Netlify avant toute conclusion de déploiement.

> Durcissement UX v0.2.1 : correction du tri P&L négatif (signe moins typographique), protection contre la rétroaction MutationObserver lors des tris, accès direct Performance/Historique depuis la navigation, nom accessible du graphique portefeuille, tests d'intégration HTML/navigation/labels/scripts et non-régression du tri. Branche `fix/v0.2.1-ux-hardening` vers `preprod`. Contrôler CI et recette navigateur avant fusion.

> Lot UX v0.2.1 performance et journal : périodes de courbe 24 h / 7 j / 30 j / tout (cycles réels uniquement), compteur de cycles, journal filtrable par texte et type d'événement, remise à zéro, tests Node et ergonomie mobile. Aucune modification moteur, stratégie ou données PAPER. Branche `feature/v0.2.1-performance-journal` vers `preprod`, sous réserve CI et recette.

> Lot UX portefeuille v0.2.1 : tri des positions (valeur, P&L signé, nom), recherche crypto, recherche et filtre achat/vente dans l'historique des trades, compteurs et réinitialisation, affichage mobile. Opérations uniquement visuelles, aucun changement moteur, stratégie, état ou décisions. Branche `feature/v0.2.1-portfolio-workspace` vers `preprod`, à valider par CI et recette visuelle.

> Lot graphique UX v0.2.1 : choix de fenêtre 60/120/240 bougies, recentrage manuel, lecture mobile améliorée, conservation du survol et de la vue pendant les rafraîchissements. Aucun changement de données, moteur ou stratégie. Branche `feature/v0.2.1-chart-workspace` à valider avant fusion.

> Correctif UX 0.2.1 : remise à zéro des filtres en un clic, message explicite sans résultat, tests Node automatisés sur les filtres d'ordres et de marché. Aucun changement moteur. Branche `fix/v0.2.1-filter-reliability`, PR à valider vers `preprod`.

> À lire en premier si tu reprends le projet (GPT, un autre agent, ou un humain).
> UX 0.2.1 : menu latéral fusionné `0e744d8`, tableaux Positions/Ordres fusionnés `9558c00` dans `preprod`. Branche en cours `feature/v0.2.1-market-workspace` : filtres UI marqueurs/ordres, responsive, aucun changement moteur.
>
> Dernière mise à jour : 14/11/2026. Netlify préprod doit être vérifié par commit, le déploiement est manuel.

## Reprise UX 0.2.1 (branche feature/v0.2.1-dashboard-layout)

- Base : branche `preprod` affichée au commit `fc9af4c` lors du contrôle navigateur.
- Navigation par ancres, positions et ordres placés après le graphique, chandeliers en 1 h par défaut et largeur accrue sur grand écran.
- Le survol des chandeliers est conservé lors des mises à jour de cours (hors changement de marché ou d'unité).
- À vérifier avant fusion : navigation clavier/mobile, graphique et survol stable pendant les mises à jour, tests Node/Python, relecture Grok Bot.
- Aucun déploiement ni fusion automatique vers `main` ; `state/` et `decisions/` intouchés.

## 1. Le projet en bref

Kraken Paper est un **simulateur de trading crypto en argent fictif** (PAPER) qui utilise les **vrais prix Kraken**.
But : apprendre le plus possible, le plus vite possible, sur des styles de trading actifs, avec des frais réalistes,
une justification écrite pour chaque décision et un bilan hebdomadaire des leçons.

- Propriétaire : **Cyril Laferrère**.
- Capital de départ : **6 606,42 USDC** fictifs, le 13/11/2026 à 22:56 (heure de Paris).
- Aucune limite de perte : la simulation ne s'arrête jamais.
- **Aucun ordre réel n'est jamais passé.** Uniquement l'API publique Kraken.

| Lien | Rôle |
| --- | --- |
| https://github.com/cyrillaferrere/kraken-paper | Dépôt public (code, état, décisions) |
| https://kraken-paper.netlify.app | Tableau de bord **prod** (branche `main`) |
| https://preprod--kraken-paper.netlify.app | Tableau de bord **préprod** (branche `preprod`, déploiement non production du même site) |
| `https://feature-<nom>--kraken-paper.netlify.app` | Aperçu d'une branche `feature/<nom>` |
| https://github.com/cyrillaferrere/kraken-paper/actions | Cycles du moteur |

## 2. Qui fait quoi

| Qui | Rôle |
| --- | --- |
| **Grok Bot** (assistant « Kraken - Bot Crypto ») | Chef de projet technique et **seul décideur de trading** : sessions de gestion, fichiers `decisions/`, bilan hebdo. Relit toutes les PR. |
| **GPT** | Maintenance et évolutions du code (dash, moteur, tests) **par PR** vers `preprod`. Ne touche jamais `decisions/` ni `state/`. |
| **Cyril** | Teste la préprod, **valide chaque mise en prod**, valide toute évolution du moteur. |
| Dev CASCIE | Une relecture ponctuelle du projet, pas de rôle permanent. |

Si Grok Bot n'est pas disponible : les ordres déjà posés continuent d'être gérés par le moteur (stops et objectifs
compris). Personne d'autre ne prend de décision de trading sans l'accord explicite de Cyril.

## 3. Architecture

```
 Grok Bot (session)                    GitHub (dépôt public)                       Netlify (site unique)
 ───────────────────                   ─────────────────────                       ──────────────────
 lit l'état, analyse le      push      decisions/<id>.json                         site/ (HTML/CSS/JS)
 marché (API publique) ────────────▶   │                                           │ lit l'état sur main
                                       ▼                                           │ via l'API GitHub (repli raw)
                              GitHub Actions « engine »   ── commit ──▶ state/ ◀───┘
                              déclenché par :                                      │
                               • fonction Netlify, min. 9 UTC (principal, prod)    │ engine-trigger
                               • cron GitHub, min. 7 UTC (secours)                 │ (schedule, prod seulement)
                               • push dans decisions/     ◀── workflow_dispatch ───┘
                               • lancement manuel
                                       │
                                       ▼
                              ntfy.sh ──▶ téléphone de Cyril
 Le dash lit aussi les prix et bougies sur l'API publique Kraken.
```

- **Un seul site Netlify** (`kraken-paper`) : la prod est son déploiement de production, la préprod et les features sont
  des déploiements non production avec un alias (`preprod--`, `feature-<nom>--`). Un futur stockage ou des variables
  d'environnement seront donc au même endroit.
- **L'état vit uniquement sur `main`, et il n'est écrit que par le moteur** (workflow `engine`). Les décisions
  (`decisions/`) ne sont écrites que par Grok Bot, directement sur `main`. Prod, préprod et features lisent le même état de
  `main` via l'API GitHub : **le dash est en lecture seule**, il n'écrit jamais rien.
- **Une release ne livre que du code.** Les branches `preprod` et `feature/*` ne modifient jamais `state/` ni
  `decisions/` : le contrôle CI `guard-state` bloque toute PR ou tout push qui le ferait, et `scripts/release.sh` refuse
  une fusion vers `main` qui toucherait ces dossiers. Passer la préprod en prod ne peut donc pas écraser le portefeuille
  ni les ordres.
- Le moteur ne tourne **que depuis `main`** (garde-fou `if:` dans le workflow ; les déclencheurs, y compris la fonction
  Netlify, demandent toujours `ref: main`). Déclencheur principal : fonction planifiée Netlify `engine-trigger`
  (minute 9 UTC), qui n'est exécutée que sur le déploiement de production. Secours : cron GitHub (minute 7 UTC).

## 4. Fichiers

| Chemin | Rôle |
| --- | --- |
| `engine/run.py` | Moteur, Python stdlib. Un appel = un cycle. |
| `tests/test_engine.py` | Tests du moteur, sans réseau : `python -m unittest -v`. |
| `tests/test_reservations.py` | Tests de réservation du cash et des quantités. |
| `tests/site/*.test.js` | Tests du calcul des ordres du dash : `node --test tests/site/*.test.js`. |
| `tests/functions/*.test.mjs` | Tests de la fonction planifiée (fetch mocké) : `node --test tests/functions/*.test.mjs`. |
| `.github/workflows/engine.yml` | Cycle : fonction Netlify + cron GitHub (secours) + push `decisions/**` + manuel. |
| `netlify/functions/engine-trigger.mjs` | Fonction planifiée Netlify (minute 9 UTC) : `workflow_dispatch` sur `main`. |
| `decisions/*.json` | Décisions de Grok Bot, une par session, appliquées une seule fois par `id`. |
| `state/portfolio.json` | **Source de vérité** : cash, positions, ordres ouverts, trades, frais, décisions traitées. |
| `state/journal.jsonl` | Journal en ajout seul (décisions, ordres, exécutions, refus, notes, alertes). |
| `state/equity.csv` | Un point par cycle : valeur du portefeuille et de « BTC conservé ». |
| `site/index.html`, `style.css` | Tableau de bord. |
| `site/app.js` | Lecture de l'état, KPI, positions, ordres (calcul perte/gain), trades, journal, courbe, version. |
| `site/markets.js` | Graphiques en bougies, indicateurs (MA, RSI, ATR), étiquettes des niveaux, bouton « Ordres », tableau des marqueurs. |
| `site/lib.js` | Fonctions pures testées : markdown sûr, résumé des actions, performance par jour, comptes à rebours, exposition, proximité. |
| `site/extras.js` | Exposition, prochains passages, calendrier, fil des décisions, leçons (API GitHub avec ETag et cache local). |
| `docs/LESSONS.md` | Leçons apprises, affichées dans le dash. Écrites par Grok Bot (bilan hebdo), une entrée par leçon, la plus récente en haut. |
| `site/version.json` | **Généré au déploiement** par `scripts/deploy.sh` (absent du dépôt). |
| `scripts/deploy.sh` | Déploiement prod / préprod / feature sur le site unique. |
| `scripts/release.sh` | Mise en prod du code (preprod → main) avec garde-fou state/decisions. |
| `scripts/netlify-build.sh` | Commande de build Netlify : écrit `version.json` s'il manque. |
| `.github/workflows/guard-state` (`guard.yml`) | Échoue si une PR ou une branche autre que main modifie `state/` ou `decisions/`. |
| `VERSION`, `CHANGELOG.md` | Version SemVer et historique. |
| `docs/` | Ce document, RUNBOOK, CONTRIBUTING, décisions techniques (ADR). |
| `.ntfy_topic` | Canal ntfy, **local uniquement** (gitignoré), copie du secret Actions `NTFY_TOPIC`. |
| `GITHUB_DISPATCH_TOKEN` | Variable d'environnement Netlify (scopes builds/functions/runtime, secret), **jamais dans le dépôt**. Voir [RUNBOOK](RUNBOOK.md). |

## 5. Règles du moteur (résumé)

À chaque cycle : charger l'état → appliquer les nouvelles décisions (une fois par `id`) → rejouer les bougies 1 h
**clôturées** depuis la dernière traitée → enregistrer un point de valeur → sauvegarder → notifier les exécutions.

- **Achat limite** exécuté si le plus bas de la bougie ≤ prix limite, au prix limite, **maker 0,40 %**.
- **Vente limite / objectif** exécutée si le plus haut ≥ prix, au prix, **maker 0,40 %**.
- **Stop** exécuté si le plus bas ≤ stop, au **stop − 0,1 %**, **taker 0,80 %**.
- **Stop et objectif dans la même heure** : le premier touché en bougie 5 min gagne ; le stop l'emporte seulement s'ils sont dans la **même bougie 5 min** (si les 5 min manquent : stop prioritaire sur la bougie 1 h, comme avant).
- Le fill est daté à l'ouverture de la première bougie 5 min qui touche le niveau ; repli : ouverture de la bougie 1 h. Prix et frais inchangés. L'état déjà écrit n'est pas modifié (le dash ajuste l'affichage des anciens marqueurs).
- **Ordre au marché** : dernier prix ± 0,1 %, taker 0,80 %.
- Un ordre ne regarde que les bougies qui **commencent après sa pose** (`active_from`).
- Un achat limite avec `stop_loss` / `take_profit` crée, une fois exécuté, l'ordre de sortie (OCO).
- Refus si cash ou quantité insuffisants (ni levier ni vente à découvert), si l'ordre limite est déjà exécutable
  (utiliser un ordre au marché), si la paire n'est pas en USDC ou pas disponible en France (`country_code=FR`).
- Frais arrondis à 6 décimales, quantités aux décimales de la paire (AssetPairs).
- Si l'API Kraken ne répond pas : étape sautée, état intact, décision retentée au cycle suivant.
- Référence « BTC conservé » : tout le capital en BTC au premier cycle (maker 0,40 %), puis gardé.

## 6. Contrat des décisions (`decisions/<id>.json`)

```json
{"id": "2026-11-14-matin", "timestamp": "2026-11-14T08:30:00+01:00",
 "rationale": "Pourquoi, en clair : tendance, niveaux, marqueurs utilisés, risque.",
 "actions": [
  {"type": "market_buy", "pair": "BTC/USDC", "quote_amount": 1000, "stop_loss": 63000},
  {"type": "place_limit", "pair": "ETH/USDC", "side": "buy", "quote_amount": 800, "price": 1850, "stop_loss": 1700, "take_profit": 2100},
  {"type": "place_limit", "pair": "XBTUSDC", "side": "sell", "qty": 0.005, "price": 74000, "stop_loss": 64000},
  {"type": "cancel", "order_id": "O0003"},
  {"type": "note", "text": "Leçon à vérifier : ..."}]}
```

| Action | Champs |
| --- | --- |
| `place_limit` | `pair`, `side` (`buy`/`sell`), `qty` **ou** `quote_amount` (USDC), `price`, option `stop_loss`, option `take_profit` (achat seulement) |
| `market_buy` | `pair`, `qty` ou `quote_amount`, option `stop_loss`, `take_profit` |
| `market_sell` | `pair`, `qty` ou `quote_amount` |
| `cancel` | `order_id` |
| `note` | `text` |

- `id` **unique et jamais réutilisé** (convention `AAAA-MM-JJ-HHhMM`). Un fichier peut contenir une liste.
- Une action refusée est journalisée (`rejected`) sans bloquer les autres.
- `quote_amount` d'un achat inclut les frais : quantité = montant / (prix × (1 + frais)).

## 7. Comment se passe une session de Grok Bot

Environ toutes les 5 heures (routine de Grok Bot) :
1. Lire `state/` sur `main` (positions, ordres, dernier cycle, erreurs).
2. Analyser le marché avec l'API publique Kraken : tendance (MA20/MA50 en 4 h et 1 j), niveaux, RSI, ATR, volume, force vs BTC.
3. Écrire `decisions/<id>.json` avec une justification claire, commit `decision: <id>`, push sur `main`
   (déclenche un cycle immédiat).
4. Vérifier dans Actions puis `state/journal.jsonl` que la décision est appliquée (ou lire la raison des refus).
5. Envoyer un court récapitulatif en français à Cyril.

Chaque semaine : bilan des leçons (quels styles et quels marqueurs ont fonctionné, frais payés, écart vs BTC conservé).

## 8. Environnements et cycle de livraison

`feature/<nom>` → PR vers `preprod` → déploiement préprod (alias) → **Cyril teste** → `scripts/release.sh X.Y.Z` (preprod → `main`, code seulement) →
déploiement prod **après l'accord de Cyril** → tag `vX.Y.Z`. Détails : [RUNBOOK](RUNBOOK.md), [CONTRIBUTING](CONTRIBUTING.md).

## 9. Ce qu'il ne faut jamais faire

- Passer un ordre réel, utiliser un endpoint privé Kraken, mettre une clé Kraken dans le dépôt ou dans les secrets.
- Retirer ou transférer des fonds (interdit en toutes circonstances).
- Modifier `state/` à la main, sauf la procédure de récupération du RUNBOOK.
- Écrire dans `decisions/` si on n'est pas Grok Bot (ou sans l'accord explicite de Cyril).
- Déployer la prod sans l'accord de Cyril.
- Toucher un autre dépôt ou site (en particulier `planning-com-cascie`), ou le dossier `/workspace/kraken-jeu`.

## 10. Où en est le projet

Voir [CHANGELOG](../CHANGELOG.md). Idées en attente : stop suiveur, page de bilan hebdo, alertes ntfy plus fines,
backtest de la leçon du 14/11 (entrées fractionnées en survendu).

Budget API GitHub du dash (60 requêtes/h par visiteur, sans clé) : état = `commits/main` en sha + ETag (304 gratuit)
puis 3 fichiers seulement quand le sha change ; décisions = liste `contents/decisions` avec ETag (304 gratuit),
chaque nouveau fichier lu une seule fois par son sha (`git/blobs`) puis gardé en `localStorage` ; leçons =
`contents/docs/LESSONS.md` avec ETag, lu sur la branche déployée (`preprod` en préprod, `main` en prod). Sur 403/429
le dash attend 10 min et affiche les décisions depuis le journal.

## 11. Chantier contrôle qualité (14/11/2026)

**Branche** : `feature/quality-gates-handoff`, issue de `preprod`. **Objet** : sécuriser les futures PR avant les fonctionnalités v0.3.0. Aucun changement du moteur, des stratégies, de `state/`, de `decisions/`, du site Netlify ou de la production.

**Audit initial** : `main` était 11 commits devant `preprod` au moment du contrôle, avec les derniers commits `55284ec`, `7c79bd7`, `6d5c9c6` correspondant aux cycles horaires (fichiers `state/`). Ne jamais recopier l'état de préprod sur main. La synchronisation des branches doit préserver les fichiers d'état de main et être validée par les protections existantes.

**Ajout** : `.github/workflows/quality.yml`, job `quality`, vérifie les PR vers `preprod`/`main` et les branches de développement : aucun changement de `state/` ou `decisions/`, CHANGELOG et HANDOFF modifiés sur chaque PR, tests `python -m unittest -v`, `node --test tests/site/*.test.js`, `node --test tests/functions/*.test.mjs`, `node --check` des JS, `bash -n` des scripts, invariants statiques de livraison. **Aucun cycle moteur ni déploiement** dans ce workflow. ADR-15 et RUNBOOK détaillent la décision et l'exploitation.

**Pour Grok Bot** : lire la PR de cette branche vers `preprod`, inspecter les checks GitHub, vérifier les chemins protégés et confirmer que les tests passent. Ne pas confondre tests verts et blocage des merges : configuration cible : PR et checks obligatoires uniquement sur `preprod` ; sur `main`, ni PR ni checks obligatoires, car le moteur et Grok Bot poussent directement. Sur `main`, interdire force-push/suppression et, si techniquement réalisable, restreindre les pushes à `github-actions[bot]` et `cyrillaferrere` ; ne pas activer de règle sans accord explicite de Cyril. Une fois les checks et la revue validés, intégrer dans `preprod` et tester. Aucune release `main` ni prod sans validation de Cyril.

**Reste à faire** : vérifier les checks CI à nouveau après ces corrections documentaires, passer la PR Ready et fusionner en squash dans `preprod` après validation ; ne configurer les règles GitHub qu'après accord explicite de Cyril, et uniquement selon la matrice `preprod`/`main` documentée dans le RUNBOOK. Puis lancer les développements UX v0.3.0. Les tests navigateur/visuels restent manuels à ce stade.

## 12. Déploiement préprod autonome par GPT (ADR-16, 14/11/2026)

**Pourquoi** : la préprod v0.2.0 commit `7f58759` a été déployée et vérifiée par Grok Bot ; l'objectif est de permettre à GPT de déployer les prochains changements sans consommer le forfait Grok Bot.

**Implémentation** : branche `feature/preprod-deploy-actions`, PR vers `preprod` ; nouveau workflow `.github/workflows/deploy-preprod.yml`, déclenchement automatique sur push vers `preprod` uniquement, environnement GitHub `preprod`, secret `NETLIFY_AUTH_TOKEN`, script existant `scripts/deploy.sh preprod`, vérification du commit via `version.json`. Pas de déclencheur sur `main`, pas de `--prod`, pas d'écriture dans `state/` ou `decisions/`, pas de changement de logique de trading.

**Reprise Grok Bot / GPT** : après revue et CI vertes, fusionner la PR dans `preprod` ; Cyril configure une seule fois le secret GitHub de l'environnement `preprod` sans jamais le partager en chat. La fusion dans `preprod` déclenche le workflow automatiquement ; vérifier que le SHA du dashboard correspond au commit de `preprod`. Si aucun run ne démarre, vérifier le push vers `preprod` et la présence du workflow ; si le run échoue, consulter les logs sans afficher le secret. Le jeton Netlify n'est pas intrinsèquement restreint à la préprod : la sécurité repose aussi sur le workflow et les permissions du compte Netlify. **Aucun déploiement prod sans accord de Cyril.**

**Statut** : workflow proposé, secret GitHub `preprod` configuré le 14/11/2026 ; attendre la revue Grok Bot, la fusion et le premier run réussi. Le déclencheur manuel a été remplacé par `push` sur `preprod` pour éviter l'exigence GitHub de présence sur la branche par défaut. Aucune règle GitHub changée.


## Publication production contrôlée — état v0.3.1 et préparation v0.3.2
- Production v0.3.1 en service depuis le 14/11/2026 ; publication future selon ADR-28 (GO unique), sans deuxième validation humaine GitHub. La branche `deploy/prod-request` doit recevoir le workflow à jour avant activation. Le champ JSON `approved_by` n'est pas un consentement.
- Les prochains lots passent par une PR de branche dédiée vers `preprod` ; seul le code et la documentation sont livrables. Jamais de synchronisation globale de `main` qui recopierait `state/` ou `decisions/`.
- Pour une future production : GO explicite de Cyril pour version et SHA, contrôle des droits de la branche de demande, suivi des jobs et vérification réelle du `version.json` (sans deuxième clic GitHub). Le verrou Netlify **Auto Publishing Locked** peut empêcher le nouveau déploiement de devenir la publication active : inspecter **Deploys** et faire lever ou traiter ce verrou seulement par une personne autorisée, puis re-vérifier le SHA servi.
- `NETLIFY_AUTH_TOKEN` reste un secret de l'environnement GitHub `production`, jamais un fichier commité ni un jeton partagé par chat.
- PR v0.3.2 : affichage descriptif du stop remonté après TP1 sur les lignes du graphique ; pas de changement du moteur ni des règles de trading. Le bandeau des sorties différées affiche déjà nouveau stop et objectifs via `pendingExitText`, avec test de régression dédié.
- Recherche PR #42 (plateaux 2020–09/2026) : conserver pour référence ; espérance nette négative sur chaque scénario testé, aucune modification moteur. Mise à jour de `docs/LESSONS.md` réservée à une session distincte sur la branche de vérité `main`.

## Transition ADR-28 — publication GO unique (15/11/2026)
- `production` : Required reviewers désactivé et secret NETLIFY_AUTH_TOKEN conservé, branche autorisée deploy/prod-request.
- La PR d'intégration combine les changements UX v0.3.2 de #52 et le workflow sans workflow_dispatch de #53.
- Avant activation : revue Grok Bot, CI, recette préprod, synchronisation du workflow sur deploy/prod-request, puis GO explicite de Cyril pour version/SHA.
- Aucune publication production, aucun changement state/ ou decisions/ dans ce lot.


## Candidat release v0.3.2 — 15/11/2026
- Préprod validée par Cyril sur commit de fusion PR #54 `815eec6` ; revue Grok Bot favorable.
- Branche `release/v0.3.2-preparation` depuis `preprod` : `VERSION=0.3.2`, CHANGELOG préparé, build Netlify corrigé pour prendre en compte les changements de `VERSION`.
- Aucun changement de moteur, `state/`, `decisions/` ni de production. CI, revue PR et recette du nouveau bandeau de version à effectuer.
- Avant toute publication : vérifier droits de modification de `deploy/prod-request`, synchroniser le workflow de publication sans toucher au JSON de demande, puis obtenir un GO explicite de Cyril sur le SHA définitif de la release. La synchronisation du workflow ne constitue pas une autorisation de publication.
