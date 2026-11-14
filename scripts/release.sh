#!/usr/bin/env bash
# Mise en prod du CODE : fusionne preprod dans main, SANS jamais toucher state/ ni decisions/.
#
#   scripts/release.sh 0.2.0      # après l'accord de Cyril
#
# L'état et les décisions n'existent que sur main et ne sont écrits que par le moteur (state/) et par
# Grok Bot (decisions/). Une release n'embarque que du code : si preprod modifie state/ ou decisions/,
# on s'arrête.
set -euo pipefail
NEW="${1:?usage: release.sh X.Y.Z}"
[[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Version SemVer attendue (X.Y.Z)" >&2; exit 1; }
cd "$(git rev-parse --show-toplevel)"
[ -z "$(git status --porcelain)" ] || { echo "Dossier de travail non propre" >&2; exit 1; }
git fetch -q origin main preprod

PROTECTED='^(state|decisions)/'
# 1. Ce que preprod a changé depuis son point commun avec main.
if git diff --name-only origin/main...origin/preprod | grep -E "$PROTECTED"; then
  echo "STOP : preprod modifie state/ ou decisions/ (fichiers ci-dessus). Une release ne livre que du code." >&2; exit 1
fi
[ "$(tr -d '[:space:]' < <(git show origin/preprod:VERSION))" = "$NEW" ] || { echo "VERSION sur preprod différente de $NEW : la mettre à jour (avec le CHANGELOG) sur preprod d'abord." >&2; exit 1; }

git checkout -q main
git pull -q --rebase origin main
# 2. Contrôle sur la fusion elle-même : rien sous state/ ou decisions/ ne doit changer par rapport à main.
git merge --no-ff --no-commit origin/preprod || { git merge --abort; echo "Conflit de fusion : à résoudre sur preprod" >&2; exit 1; }
if git diff --cached --name-only HEAD | grep -E "$PROTECTED"; then
  git merge --abort; echo "STOP : la fusion modifierait state/ ou decisions/. Annulé." >&2; exit 1
fi
python3 -m unittest -q
node --test tests/site/*.test.js >/dev/null
git commit -q -m "release: v$NEW"
git tag -a "v$NEW" -m "v$NEW"
git push -q origin main "v$NEW"
echo "main = v$NEW (code seulement). Déployer la prod : CONFIRM_PROD=oui scripts/deploy.sh prod"
