## Quoi et pourquoi

<!-- Ce que change la PR, en deux ou trois phrases, et le besoin derrière. -->

## Type
- [ ] feat (nouvelle fonction) · [ ] fix (correction) · [ ] docs · [ ] chore / refactor
- Version visée : `X.Y.Z` (mettre à jour `VERSION` et `CHANGELOG.md`)

## Vérifications
- [ ] `python -m unittest -v` passe
- [ ] `node --test tests/site/*.test.js` passe (si le site change)
- [ ] Testé sur la préprod (https://preprod--kraken-paper.netlify.app), bureau et mobile, console sans erreur
- [ ] Animations conformes au skill kraken-motion-ux (opacity/transform, pas de rejouage au polling, prefers-reduced-motion)

## Règles (à cocher toutes)
- [ ] Aucun ordre réel, aucun endpoint privé Kraken, aucune clé dans le dépôt ni dans les secrets
- [ ] Aucun fichier sous `state/` ni `decisions/` dans la PR (le contrôle CI `guard-state` le vérifie)
- [ ] Aucun autre dépôt ni site touché

## Relecture
- Relecture technique : Grok Bot
- Validation et mise en prod : Cyril
