# Préparation de publication v0.3.1 — PAS D'AUTORISATION DE PRODUCTION

Statut : préparation seulement. Cyril a validé la recette visuelle de preprod, **pas** la mise en production.

## Constat au 14 novembre 2026
- `main` : VERSION 0.2.1 ; `preprod` : VERSION 0.3.1.
- Les branches ont divergé : 10 commits propres à preprod et 32 commits propres à main au moment du contrôle (les nombres évoluent avec les cycles).
- Les changements de preprod depuis leur ancêtre commun concernent le code, les tests, la documentation et la configuration ; **aucun** fichier `state/` ou `decisions/`.
- Les changements propres à main comprennent l'état vivant, les décisions Grok Bot et le workflow de déploiement contrôlé. **Conserver main comme source de vérité**.
- La recette utilisateur et les contrôles automatisés de preprod sont validés : 51 Python, 84 site, 6 functions.

## Procédure préparatoire obligatoire (sans action sur main)
1. Rafraîchir les références `main` et `preprod` immédiatement avant la préparation ; noter leurs SHA complets. Les cycles peuvent changer main entre deux contrôles.
2. Vérifier la provenance du code et la liste des fichiers modifiés : `git diff --name-only origin/main...origin/preprod`. Refuser tout changement `state/`, `decisions/`, secret ou workflow non prévu.
3. Effectuer une **fusion de simulation dans un clone ou worktree temporaire**, à partir du SHA courant de main, sans push, sans tag, sans Netlify : `git merge --no-commit --no-ff origin/preprod`. En cas de conflit, arrêter et résoudre sur une branche de préparation, jamais sur main.
4. Comparer les contenus de `state/` et `decisions/` du résultat de la simulation aux blobs de main ; exiger l'identité exacte, y compris si un cycle est intervenu. Contrôler également le workflow `deploy-production-controlled.yml` et le fichier `VERSION`.
5. Sur le résultat simulé : `python3 -m unittest -q`, `node --test tests/site/*.test.js`, `node --test tests/functions/*.test.mjs`, `bash -n scripts/deploy.sh scripts/release.sh`. Vérifier le démarrage PAPER sur des fixtures isolées, jamais sur `state/` vivant.
6. Avant toute publication, identifier et conserver **hors du site public** une sauvegarde vérifiable de `state/`, `decisions/` et du SHA main de référence. Les commits Git sont une source d'historique, mais ne remplacent pas la vérification d'une sauvegarde restaurable. Tester la lecture/restauration sur copie isolée, jamais sur main.
7. Refaire une revue Grok Bot du diff final moteur/format de décision et de la procédure de retour arrière. Demander ensuite à Cyril son **accord explicite pour la production**.
8. Après cet accord uniquement : utiliser le circuit contrôlé de publication, surveiller le SHA de main qui peut avancer, contrôler la version et le commit réellement publiés et vérifier le cycle moteur suivant.

## Retour arrière — à préparer, pas à exécuter
- Conserver le SHA et l'artefact du dernier déploiement sain. Prévoir le redéploiement du code antérieur sans restaurer par défaut l'état vivant.
- Ne jamais remettre `state/` ou `decisions/` à une ancienne version pour annuler une modification UX ; une restauration d'état exige un incident avéré, une analyse et un nouvel accord de Cyril.
- Les décisions Grok Bot et l'état PAPER peuvent évoluer pendant la préparation : une restauration doit tenir compte des cycles et de l'idempotence.

## Points bloquants à lever avant autorisation
- Fusion simulée et tests sur l'arbre **combiné** main + preprod : non encore exécutés.
- Sauvegarde hors site et test de restauration sur copie : non encore effectués.
- Validation du workflow de publication contrôlée et de l'artefact exact : à effectuer.
- Accord explicite de Cyril pour production : non donné.

Aucune action de ce document n'autorise un push sur main, un tag de release, une modification de `state/` ou `decisions/`, ni un déploiement de production.
