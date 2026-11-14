# Kraken Paper : runbook (opérations)

Heures en heure de Paris. Commandes à lancer depuis la racine du dépôt.

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
