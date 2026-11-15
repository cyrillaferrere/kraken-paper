# ADR-28 — Publication production avec un seul GO explicite (15/11/2026)

## Contexte
Kraken Paper est PAPER uniquement. Le workflow ADR-27 demandait deux validations humaines : l'accord explicite de Cyril, puis « Approve and deploy » dans GitHub. Cette seconde confirmation ralentit inutilement la livraison.

## Décision
- L'accord explicite de Cyril dans la conversation pour une version et un commit donnés constitue l'unique autorisation humaine. Grok Bot ou GPT prépare la demande uniquement après cet accord, jamais sur simple approbation d'une PR ou validation de préproduction.
- La demande de publication est un push ciblé de `.github/prod-release-request.json` sur `deploy/prod-request`. Le workflow GitHub ne se déclenche pas sur les cycles `main` ou `preprod` ; le déclenchement manuel `workflow_dispatch` est retiré.
- L'environnement GitHub `production` **reste utilisé pour son secret NETLIFY_AUTH_TOKEN**, mais **Required reviewers doit être désactivé** dans les réglages GitHub par Cyril. Ne pas supprimer l'environnement ni déplacer le secret au niveau dépôt.
- Le workflow vérifie version, SHA approuvé, identité de la branche, absence de changement de code sur `main` depuis ce SHA (hors `state/` et `decisions/`), exécute les tests, déploie et vérifie `version.json`.
- La valeur `approved_by: Cyril` dans le JSON est **une trace déclarative, pas une preuve d'autorisation**. La garantie d'autorisation repose sur l'assistant qui ne soumet la demande qu'après un GO explicite. Les personnes ayant les droits d'écriture sur la branche de demande restent techniquement capables de déclencher le workflow : contrôler ces droits et les changements du workflow lui-même.
- Aucune modification de `state/`, `decisions/`, du moteur ou des décisions de trading. Aucune publication automatique sans GO.

## Conséquences et limites
- Une seule validation humaine, pas de second clic « Approve and deploy ».
- Le retrait de Required reviewers diminue la protection technique contre une demande malveillante ou erronée ; il ne faut pas présenter le champ JSON comme un contrôle d'accès.
- Si Netlify conserve « Auto Publishing Locked », la commande CLI de production peut nécessiter une adaptation distincte : vérifier le comportement réel avant de déclarer la procédure opérationnelle.
- Le changement d'environnement GitHub est manuel et **ne prend effet qu'après la mise à jour du workflow sur la branche de demande**, la revue et la recette en préproduction.
