# ADR-34 — Un seul chemin de publication en production (18/11/2026)

## Contexte
Le workflow `deploy-production-controlled` rejetait `0.3.6.1` car il n'acceptait que `X.Y.Z`. Le site Netlify connecté à `main` pouvait néanmoins publier un build Git automatique, sans passer par la demande de release ni le contrôle du commit approuvé. Le moteur continue de commiter régulièrement l'état sur `main`.

## Décision
- Accepter `X.Y.Z` et `X.Y.Z.W` dans la validation du workflow contrôlé, sans changer les autres contrôles (SHA, VERSION, tests, environnement).
- Ignorer systématiquement les builds Netlify déclenchés par Git en contexte production ou sur la branche `main` au moyen de `[build].ignore` / `scripts/netlify-ignore-build.sh`. Valeur de retour 0 = build ignoré, 1 = build exécuté.
- Préserver les deploy-previews et les builds non-production pertinents.
- Publier la production uniquement par la Netlify CLI (`deploy --prod`) appelée par le workflow `deploy-production-controlled`, après le GO explicite de Cyril. Ce chemin CLI déploie directement le répertoire construit et ne dépend pas de la commande de build Git.

## Conséquences et limites
- Les push horaires du moteur et les décisions sur `main` ne publient plus le site via le pipeline Git standard, sans empêcher le moteur PAPER de fonctionner.
- Le garde-fou du dépôt ne contrôle **pas** les déploiements manuels depuis l'interface Netlify, les deploy hooks, d'autres détenteurs du jeton Netlify ni un réglage Netlify situé hors du dépôt. Vérifier et restreindre ces chemins séparément dans Netlify. En cas de changement du dépôt lié, tester que le filtre d'ignore est toujours actif.
- La CI et la validation de l'identité restent nécessaires ; un champ `approved_by` dans un JSON n'est pas une authentification.
- Aucun changement de `engine/`, `state/`, `decisions/`, `docs/LESSONS.md` ou de stratégie.
