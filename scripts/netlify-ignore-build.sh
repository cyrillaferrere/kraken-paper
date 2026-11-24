#!/bin/sh
# Netlify: exit 0 = ignorer le build, exit 1 = construire.
# Aucune publication Git automatique en production : seule la CLI approuvée
# via deploy-production-controlled peut publier --prod (voir ADR-34).
# Les deploys non-production restent automatiques selon les fichiers modifiés.
set -eu

if [ "${CONTEXT:-}" = "production" ] || [ "${BRANCH:-}" = "main" ]; then
  echo "Build Git de production ignoré : utiliser le workflow contrôlé."
  exit 0
fi

if [ "${CONTEXT:-}" = "deploy-preview" ]; then
  exit 1
fi

# En l'absence de SHA vérifiable, construire plutôt que masquer une mise à jour.
if [ -z "${CACHED_COMMIT_REF:-}" ] || [ -z "${COMMIT_REF:-}" ]; then
  exit 1
fi

if git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- VERSION site/ netlify.toml netlify/ scripts/netlify-build.sh scripts/netlify-ignore-build.sh; then
  exit 0
fi
exit 1
