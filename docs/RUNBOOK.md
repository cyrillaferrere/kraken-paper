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

## Lancer un cycle à la main

```bash
gh workflow run engine.yml --ref main
gh run list --workflow engine.yml -L 3
```
Ou GitHub → Actions → engine → Run workflow (branche **main** ; depuis une autre branche le job est ignoré).
Un push dans `decisions/` sur `main` lance aussi un cycle.

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

## Problèmes fréquents

| Symptôme | Cause | Action |
| --- | --- | --- |
| Le dash affiche un état en retard de quelques minutes et la pastille « Source de secours » | Limite de l'API GitHub (60 requêtes/h par IP) atteinte ou API en erreur : repli sur raw.githubusercontent.com, qui a un cache d'environ 5 min | Rien : retour automatique à l'API après la remise à zéro de la limite (au moins 10 min). Éviter d'ouvrir beaucoup d'onglets. |
| « Dernier cycle moteur : plus de 2 h » | Le cron GitHub est souvent en retard de 5 à 30 min, parfois plus, surtout sur un dépôt récent ou peu actif ; il peut aussi sauter un créneau | Lancer un cycle à la main. Un dépôt public sans activité pendant 60 jours voit ses crons désactivés : les réactiver dans Actions. |
| Graphiques vides, message « bibliothèque » | CDN jsDelivr injoignable | Le tableau des marqueurs reste utilisable ; réessayer plus tard. |
| « Bougies Kraken indisponibles » ou marqueurs « indisponible » | Limite publique Kraken ou API en panne | Nouvel essai automatique (1 à 3 min). |
| Décision non appliquée | `id` déjà utilisé, JSON invalide, ou API Kraken absente pendant le cycle | Lire le journal ; si API absente, elle sera retentée automatiquement. |
| Le contrôle CI `guard-state` échoue | La branche modifie `state/` ou `decisions/` | Retirer ces changements (`git checkout origin/main -- state/ decisions/`), ils n'ont rien à faire hors `main`. |
| Un ordre affiche « Niveau atteint en direct » | Le prix live a touché le niveau, mais le moteur n'exécute qu'à la clôture de la bougie 1 h | Attendre le cycle suivant. |
