#!/usr/bin/env bash
# Déploiement du tableau de bord Kraken Paper. UN SEUL site Netlify : kraken-paper.
#
#   scripts/deploy.sh preprod                 # branche preprod -> https://preprod--kraken-paper.netlify.app (alias, non production)
#   scripts/deploy.sh feature feature/<nom>   # une branche     -> https://feature-<nom>--kraken-paper.netlify.app (alias)
#   CONFIRM_PROD=oui scripts/deploy.sh prod   # main            -> https://kraken-paper.netlify.app, APRÈS l'accord de Cyril
#
# Méthode : on exporte le commit POUSSÉ sur origin avec `git archive` (jamais le dossier de travail), donc aucun
# fichier local ou ignoré (.ntfy_topic, .env...) ne part. On écrit site/version.json, puis on envoie.
#
# Envoi :
#   - préprod / feature : Netlify CLI, `deploy --alias <alias>` SANS --prod. Il faut NETLIFY_AUTH_TOKEN (jeton personnel
#     Netlify, jamais commité). Le connecteur Netlify de Grok Bot ne sait faire que des déploiements de production :
#     il est refusé ici pour la préprod, pour ne jamais écraser la prod par erreur.
#   - prod : NETLIFY_AUTH_TOKEN (CLI, --prod) ou NETLIFY_MCP_PROXY="<proxy-path>" (outil deploy-site du connecteur).
#   - si netlify/functions/ est présent, il est envoyé avec `--functions` (fonction planifiée engine-trigger).
#     Netlify n'exécute les crons que sur le déploiement de production.
#
# L'état (state/) et les décisions (decisions/) ne sont jamais déployés ni modifiés : le site les lit sur main.
set -euo pipefail

SITE="01cb62cb-bc97-4b2c-be7e-21960b44bfd5"   # kraken-paper (le seul site)
SITE_NAME="kraken-paper"

ENVNAME="${1:-}"
ALIAS=""
case "$ENVNAME" in
  prod)    BRANCH="main"
           [ "${CONFIRM_PROD:-}" = "oui" ] || { echo "Prod : relancer avec CONFIRM_PROD=oui, seulement après l'accord de Cyril." >&2; exit 1; } ;;
  preprod) BRANCH="preprod"; ALIAS="preprod" ;;
  feature) BRANCH="${2:?usage: deploy.sh feature <branche>}"
           SLUG="$(printf '%s' "${BRANCH#feature/}" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' | sed 's/--*/-/g; s/^-//; s/-$//' | cut -c1-40)"
           [ -n "$SLUG" ] || { echo "Nom de branche invalide" >&2; exit 1; }
           ALIAS="feature-$SLUG" ;;
  *) echo "usage: deploy.sh prod|preprod|feature <branche>" >&2; exit 1 ;;
esac

cd "$(git rev-parse --show-toplevel)"
git fetch -q origin "$BRANCH"
SHA="$(git rev-parse "origin/$BRANCH")"
OUT="$(mktemp -d)/kraken-paper"
mkdir -p "$OUT"
git archive "$SHA" | tar -x -C "$OUT"

# Garde-fous : aucun secret ne doit partir.
for f in .ntfy_topic .env; do
  [ ! -e "$OUT/$f" ] || { echo "Refus : $f présent dans l'export" >&2; exit 1; }
done
if grep -rIlE "KRAKEN_API_(KEY|SECRET)\s*[=:]\s*['\"]?[A-Za-z0-9+/]{20,}" "$OUT" >/dev/null 2>&1; then
  echo "Refus : ce qui ressemble à une clé Kraken a été trouvé dans l'export" >&2; exit 1
fi
if [ -s .ntfy_topic ] && grep -rqF "$(tr -d '[:space:]' < .ntfy_topic)" "$OUT"; then
  echo "Refus : le canal ntfy apparaît dans l'export" >&2; exit 1
fi
# Motif assemblé pour que ce script ne se fasse pas refuser lui-même.
_GH_PAT="git""hub""_pat_"
if grep -rIlE "${_GH_PAT}[A-Za-z0-9_]+|ghp_[A-Za-z0-9]{20,}" "$OUT" >/dev/null 2>&1; then
  echo "Refus : ce qui ressemble à un jeton GitHub a été trouvé dans l'export" >&2; exit 1
fi

VERSION="$(tr -d '[:space:]' < "$OUT/VERSION")"
BUILT="$(TZ=Europe/Paris date '+%Y-%m-%dT%H:%M:%S%:z')"
cat > "$OUT/site/version.json" <<JSON
{"version":"$VERSION","env":"$ENVNAME","commit":"$SHA","branch":"$BRANCH","built":"$BUILT"}
JSON
URL="https://${ALIAS:+$ALIAS--}$SITE_NAME.netlify.app"
echo "Prêt : $OUT (v$VERSION, $ENVNAME, $BRANCH @ ${SHA:0:7}) -> $URL"

cd "$OUT"
FUNCS=()
if [ -d netlify/functions ]; then
  FUNCS=(--functions netlify/functions)
fi
if [ -n "$ALIAS" ]; then
  [ -n "${NETLIFY_AUTH_TOKEN:-}" ] || { echo "Préprod / feature : NETLIFY_AUTH_TOKEN requis (déploiement --alias sans --prod). Dossier prêt : $OUT" >&2; exit 2; }
  npx -y netlify-cli deploy --dir site "${FUNCS[@]}" --site "$SITE" --alias "$ALIAS" --message "v$VERSION $ENVNAME ${SHA:0:7}"
elif [ -n "${NETLIFY_AUTH_TOKEN:-}" ]; then
  npx -y netlify-cli deploy --dir site "${FUNCS[@]}" --site "$SITE" --prod --message "v$VERSION prod ${SHA:0:7}"
elif [ -n "${NETLIFY_MCP_PROXY:-}" ]; then
  npx -y @netlify/mcp@latest --site-id "$SITE" --proxy-path "$NETLIFY_MCP_PROXY"
else
  echo "Aucun moyen d'envoi configuré (NETLIFY_AUTH_TOKEN ou NETLIFY_MCP_PROXY). Dossier prêt : $OUT" >&2
  exit 2
fi
echo "Déployé : $URL"
