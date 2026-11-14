# Checklist UX/UI — Kraken Paper v0.2.2

Référentiels : `.agents/skills/kraken-motion-ux/SKILL.md` et `.agents/skills/modern-web-guidance/SKILL.md`.

## Navigation
- [ ] Menu desktop réduit/déployé sans saut destructeur du graphique.
- [ ] Menu mobile fermé inaccessible au clavier (`inert`), `aria-expanded` correct.
- [ ] Escape et clic extérieur ferment le menu ; focus conservé.
- [ ] Lien actif et `:focus-visible` visibles.
- [ ] Animations supprimées si `prefers-reduced-motion`.

## Graphiques
- [ ] BTC/USDC en 1 h par défaut.
- [ ] Survol OHLC stable pendant les rafraîchissements.
- [ ] Changement de période/paire sans affichage de bougies de l'ancienne requête.
- [ ] Axes, heures de Paris, états de chargement/erreur et sources compréhensibles.
- [ ] Aucun point de prix artificiel.

## Tables et mobile
- [ ] Largeurs 320 / 375 / 390 / 430 / 680 / 768 / 1280 px sans débordement.
- [ ] Positions, ordres, trades, marqueurs : libellés lisibles et détails utilisables.
- [ ] Contrôles tactiles et filtres accessibles ; focus non perdu.
- [ ] Safari iOS réel et Android Chrome contrôlés.

## Données et performance
- [ ] Prix partiels/périmés identifiables.
- [ ] Pas d'animation d'entrée au polling.
- [ ] Alerte moteur ou risque affichée sans délai.
- [ ] Mesurer INP/CLS et charge de rendu avant/après sur navigateur.

## Livraison
- [ ] Tests Node/Python pertinents réussis.
- [ ] CHANGELOG, RUNBOOK et HANDOFF actualisés.
- [ ] Relecture Grok Bot, PR vers `preprod` uniquement.
- [ ] Aucun changement `main`, `state/`, `decisions/`, moteur.
