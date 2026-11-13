# Kraken Paper : runbook (opérations)

Heures en heure de Paris. Commandes à lancer depuis la racine du dépôt.

## Déployer

Le site n'est **pas** relié à GitHub sur Netlify : on déploie à la main avec `scripts/deploy.sh`, qui exporte le commit
**poussé** sur `origin` (`git archive`, donc aucun fichier local ou ignoré, ni `.ntfy_topic`), écrit
`site/version.json` (version, environnement, commit, branche, heure) et envoie le dossier.

| Environnement | Branche | Site Netlify | Commande |
| --- | --- | --- | --- |
| préprod | `preprod` | kraken-paper-preprod (`0944cc97-d70c-43cd-ab59-eeebead34718`) | `scripts/deploy.sh preprod` |
| feature | `feature/<nom>` | kraken-paper-preprod (badge FEATURE) | `scripts/deploy.sh feature feature/<nom>` |
| **prod** | `main` | kraken-paper (`01cb62cb-bc97-4b2c-be7e-21960b44bfd5`) | `CONFIRM_PROD=oui scripts/deploy.sh prod` **après l'accord de Cyril** |

Moyen d'envoi (un des deux) :
- **Grok Bot** : appeler l'outil `deploy-site` du connecteur Netlify avec le site id ; il renvoie une commande
  `npx @netlify/mcp ... --proxy-path "<chemin>"`. Lancer `NETLIFY_MCP_PROXY="<chemin>" scripts/deploy.sh <env>`.
  Le chemin est à usage court, ne pas le commiter.
- **Netlify CLI** : `NETLIFY_AUTH_TOKEN=<jeton personnel> scripts/deploy.sh <env>` (jeton jamais commité).

Après déploiement : ouvrir le site, vérifier le badge d'environnement, la version et le commit dans l'en-tête,
et que la console du navigateur est sans erreur.

Mise en prod complète :
```bash
git checkout main && git pull --rebase
git merge --no-ff preprod -m "release: vX.Y.Z"
python -m unittest -v && node --test tests/site/*.test.js
git push origin main
git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z
CONFIRM_PROD=oui scripts/deploy.sh prod
```
Toujours `git pull --rebase` avant de pousser sur `main` : le moteur y commite l'état toutes les heures.

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
| Un ordre affiche « Niveau atteint en direct » | Le prix live a touché le niveau, mais le moteur n'exécute qu'à la clôture de la bougie 1 h | Attendre le cycle suivant. |
