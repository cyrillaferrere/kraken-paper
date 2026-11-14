---
name: modern-web-guidance
description: Référentiel de sélection de bonnes pratiques web modernes pour l'UX/UI de Kraken Paper.
---

# Modern Web Guidance — adaptation Kraken Paper

Référence amont : https://github.com/GoogleChrome/modern-web-guidance (projet externe en préversion, licence Apache-2.0). **Ce fichier est une adaptation locale**, pas une copie ni une installation du package amont. Vérifier la documentation officielle et la compatibilité avant d'utiliser une nouvelle API.

## Principes applicables
- HTML sémantique et composants natifs avant des widgets JavaScript personnalisés ; conserver `details` et les contrôles de formulaire existants quand ils répondent au besoin.
- CSS moderne avec amélioration progressive, sans casser Safari iOS ; éviter les fonctionnalités expérimentales sans fallback.
- Respecter focus visible, clavier, lecteurs d'écran, tailles tactiles et `prefers-reduced-motion`.
- Préserver la réactivité (INP) en limitant les recalculs de layout et le travail DOM pendant les rafraîchissements.
- Utiliser `inert` et `aria-expanded` de manière cohérente pour le menu mobile ; ne pas masquer le contenu à la seule aide d'une animation.
- Privilégier les états explicites de chargement, erreur et données périmées, sans simuler un cours ni un ordre.
- Ne pas installer automatiquement `npx ...@latest` dans la CI : toute dépendance nouvelle nécessite revue et version épinglée.

## Parcours d'application
1. Identifier un défaut utilisateur concret.
2. Vérifier si une solution native existe et si elle est compatible avec les navigateurs cibles.
3. Choisir la solution la plus simple avec fallback.
4. Tester desktop, iOS Safari, Android, clavier, réduction des animations et données actualisées.
5. Documenter l'écart constaté, la solution et la validation dans la PR.

## Priorités Kraken Paper v0.2.2
1. Navigation latérale et états de focus/fermeture.
2. Chandelier : stabilité du survol et lisibilité des commandes.
3. Tables mobiles : débordements, hiérarchie et détails.
4. Rafraîchissement : états partiels, performance et accessibilité.

Sources : README de GoogleChrome/modern-web-guidance, documentation du dépôt Kraken Paper, skill Kraken Motion UX fourni par Cyril.
