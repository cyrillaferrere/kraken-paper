## Quoi et pourquoi

<!-- Ce que change la PR, en deux ou trois phrases, et le besoin derrière. -->

## Type
- [ ] feat (nouvelle fonction) · [ ] fix (correction) · [ ] docs · [ ] chore / refactor
- Version visée : `X.Y.Z` (mettre à jour `VERSION` et `CHANGELOG.md`)

## Vérifications
- [ ] `python -m unittest -v` passe
- [ ] `node --test tests/site/*.test.js` passe (si le site change)
- [ ] Testé sur la préprod (https://kraken-paper-preprod.netlify.app), bureau et mobile, console sans erreur
- [ ] Animations conformes au skill kraken-motion-ux (opacity/transform, pas de rejouage au polling, prefers-reduced-motion)

## Règles (à cocher toutes)
- [ ] Aucun ordre réel, aucun endpoint privé Kraken, aucune clé dans le dépôt ni dans les secrets
- [ ] `state/` non modifié à la main (sauf procédure de récupération du RUNBOOK, expliquée ici)
- [ ] `decisions/` non modifié (réservé à Grok Bot)
- [ ] Aucun autre dépôt ni site touché

## Relecture
- Relecture technique : Grok Bot
- Validation et mise en prod : Cyril
