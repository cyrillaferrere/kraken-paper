# Contribuer à Kraken Paper

## Branches

| Branche | Rôle |
| --- | --- |
| `main` | **Prod**. Code du site en ligne sur kraken-paper.netlify.app, moteur, et **seul** emplacement de `state/` et `decisions/` vivants. |
| `preprod` | Intégration et test. Déployée sur kraken-paper-preprod.netlify.app. |
| `feature/<nom>` | Une évolution, partie de `preprod` (ex. `feature/stop-suiveur`). |
| `fix/<nom>` | Correction, même circuit qu'une feature. |

Circuit : `feature/<nom>` → PR vers `preprod` (relue par Grok Bot) → `scripts/deploy.sh preprod` → Cyril teste →
PR `preprod` → `main` → **accord de Cyril** → déploiement prod et tag. Pas de push direct sur `main`, sauf les commits
automatiques du moteur (`chore: cycle ...`) et les décisions de Grok Bot (`decision: <id>`).

Avant de créer une branche ou de fusionner : `git pull --rebase` (le moteur commite sur `main` toutes les heures).
Garder `preprod` à jour avec `main` (`git checkout preprod && git merge main`) pour récupérer l'état et les décisions.

## Versions (SemVer)

- `VERSION` contient la version courante (ex. `0.1.0`), affichée dans l'en-tête du dash.
- Tant qu'on est en `0.y.z` : `y` monte pour une fonction nouvelle, `z` pour une correction.
- Une évolution des **règles du moteur** (frais, exécution, format de décision) est toujours une version mineure
  et doit être validée par Cyril, car elle change les résultats.
- Chaque PR met à jour `CHANGELOG.md` (section `[Unreleased]`). À la mise en prod, la section devient `[X.Y.Z] - date`
  et on pose le tag `vX.Y.Z` sur `main`.

## Messages de commit

Format [Conventional Commits](https://www.conventionalcommits.org/fr/), en français, à l'impératif ou descriptif :
`feat(site): ...`, `fix(engine): ...`, `docs: ...`, `chore: ...`, `test: ...`, `refactor: ...`.
Réservés : `chore: cycle ...` (moteur), `decision: <id>` (Grok Bot), `release: vX.Y.Z` (mise en prod).

## Tests à lancer

```bash
python -m unittest -v                  # moteur, sans réseau (obligatoire, aussi lancé par chaque cycle)
node --test tests/site/*.test.js       # calcul des ordres du dash
```
Pour le site : servir `site/` (`python -m http.server -d site 8000`), vérifier bureau et mobile, console sans erreur,
puis tester sur la préprod. Les animations suivent le skill **kraken-motion-ux** : jetons CSS communs, `opacity` et
`transform` seulement, 120 à 260 ms, pas de rejouage d'animation d'entrée au rafraîchissement, `prefers-reduced-motion`
respecté, aucune donnée de prix inventée ou interpolée, aucune animation qui suggère un gain.

## Les règles à ne jamais enfreindre

1. **Aucun ordre réel.** Le moteur et le site n'utilisent que l'API **publique** Kraken (`/0/public/...`).
2. **Aucune clé Kraken** (ni privée ni en lecture seule) dans le dépôt, les secrets GitHub, Netlify ou un fichier déployé.
   Le seul secret est `NTFY_TOPIC`.
3. **Ne jamais modifier `state/` à la main**, sauf la procédure de récupération du [RUNBOOK](RUNBOOK.md), avec l'accord de Cyril.
4. **`decisions/` est réservé à Grok Bot.** Un `id` n'est jamais réutilisé, un fichier appliqué n'est jamais modifié.
5. **Pas de prod sans l'accord de Cyril.**
6. **Ne toucher aucun autre dépôt ni site** (en particulier `planning-com-cascie`).
7. Pas de dépendance lourde : le moteur reste en Python stdlib, le site sans build ni framework.
