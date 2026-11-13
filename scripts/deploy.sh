#!/usr/bin/env bash
# Déploiement du tableau de bord Kraken Paper sur Netlify (site statique, sans build).
#
#   scripts/deploy.sh preprod            # branche preprod  -> kraken-paper-preprod.netlify.app
#   scripts/deploy.sh feature <branche>  # une branche feature -> site préprod (badge FEATURE)
#   CONFIRM_PROD=oui scripts/deploy.sh prod   # main -> kraken-paper.netlify.app, APRÈS l'accord de Cyril
#
# Méthode « propre » : on exporte le commit poussé sur origin avec `git archive` (jamais le dossier
# de travail), donc aucun fichier ignoré ou local (.ntfy_topic, .env...) ne part. On écrit
# site/version.json (version, env, commit, branche, heure), puis on envoie le dossier à Netlify.
#
# Envoi, au choix :
#   - NETLIFY_MCP_PROXY="<proxy-path>" : chemin donné par l'outil deploy-site du connecteur Netlify (Grok Bot) ;
#   - NETLIFY_AUTH_TOKEN="<jeton>"      : Netlify CLI (jeton personnel, jamais commité) ;
#   - sinon le script s'arrête après la préparation et affiche le dossier prêt.
set -euo pipefail

SITE_PROD="01cb62cb-bc97-4b2c-be7e-21960b44bfd5"      # kraken-paper
SITE_PREPROD="0944cc97-d70c-43cd-ab59-eeebead34718"   # kraken-paper-preprod

ENVNAME="${1:-}"
case "$ENVNAME" in
  prod)    BRANCH="main";    SITE="$SITE_PROD"
           [ "${CONFIRM_PROD:-}" = "oui" ] || { echo "Prod : relancer avec CONFIRM_PROD=oui, seulement après l'accord de Cyril." >&2; exit 1; } ;;
  preprod) BRANCH="preprod"; SITE="$SITE_PREPROD" ;;
  feature) BRANCH="${2:?usage: deploy.sh feature <branche>}"; SITE="$SITE_PREPROD" ;;
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
if [ -f .ntfy_topic ] && grep -rqF "$(tr -d '[:space:]' < .ntfy_topic)" "$OUT"; then
  echo "Refus : le canal ntfy apparaît dans l'export" >&2; exit 1
fi

VERSION="$(tr -d '[:space:]' < "$OUT/VERSION")"
BUILT="$(TZ=Europe/Paris date '+%Y-%m-%dT%H:%M:%S%:z')"
cat > "$OUT/site/version.json" <<JSON
{"version":"$VERSION","env":"$ENVNAME","commit":"$SHA","branch":"$BRANCH","built":"$BUILT"}
JSON
echo "Prêt : $OUT (v$VERSION, $ENVNAME, $BRANCH @ ${SHA:0:7})"

cd "$OUT"
if [ -n "${NETLIFY_MCP_PROXY:-}" ]; then
  npx -y @netlify/mcp@latest --site-id "$SITE" --proxy-path "$NETLIFY_MCP_PROXY"
elif [ -n "${NETLIFY_AUTH_TOKEN:-}" ]; then
  npx -y netlify-cli deploy --dir site --site "$SITE" --prod --no-build --message "v$VERSION $ENVNAME ${SHA:0:7}"
else
  echo "Aucun moyen d'envoi configuré (NETLIFY_MCP_PROXY ou NETLIFY_AUTH_TOKEN). Dossier prêt : $OUT"
  exit 2
fi
