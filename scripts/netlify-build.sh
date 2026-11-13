#!/bin/sh
# Commande de build Netlify (netlify.toml). Ne fait qu'écrire site/version.json s'il n'existe pas déjà
# (scripts/deploy.sh l'écrit lui-même). Sert si le dépôt est un jour relié à Netlify (déploiements de branche).
set -eu
[ -f site/version.json ] && exit 0
case "${CONTEXT:-}" in
  production) ENVNAME=prod ;;
  branch-deploy) [ "${BRANCH:-}" = "preprod" ] && ENVNAME=preprod || ENVNAME=feature ;;
  deploy-preview) ENVNAME=feature ;;
  *) ENVNAME=local ;;
esac
printf '{"version":"%s","env":"%s","commit":"%s","branch":"%s","built":"%s"}\n' \
  "$(tr -d '[:space:]' < VERSION)" "$ENVNAME" "${COMMIT_REF:-inconnu}" "${BRANCH:-inconnue}" \
  "$(TZ=Europe/Paris date '+%Y-%m-%dT%H:%M:%S%z')" > site/version.json
