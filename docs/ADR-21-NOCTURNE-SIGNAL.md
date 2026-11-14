# ADR-21 — Nocturne Signal, identité UX/UI v0.3.1

Date : 14 novembre 2026 · Cible : préproduction uniquement

## Contexte
Les captures desktop et iPhone montrent un dashboard fonctionnel, mais trop proche d'un prototype : palette violette/cyan, effet lumineux, double navigation sur desktop, bordures et capsules omniprésentes. La priorité est de renforcer la crédibilité et la lecture sans modifier la simulation.

## Décision
- « Nocturne Signal » : fond graphite, surfaces pétrole, typographie nette, accent jade froid. Vert/rouge restent réservés à la performance et au risque, ambre aux alertes. Retirer le violet décoratif et le rose du chandelier.
- Monogramme K/ plutôt que logo emoji, nouvelle couleur d'interface du navigateur.
- Desktop : conserver seulement le menu latéral, masquer les onglets redondants ; mobile : conserver les quatre onglets, menu latéral secondaire disponible.
- Bandeau KPI avec valeur totale dominante ; surfaces moins arrondies, bordures discrètes, boutons compacts. Le chandelier reste le bloc prioritaire dans la synthèse.
- Les couleurs de la bibliothèque Lightweight Charts sont adaptées sans changer OHLC, prix, exécution, risques, stratégies ou marqueurs.
- Ne pas ajouter de dépendance, de télémetrie ou d'animation de données. Conserver le focus clavier et respecter reduced-motion.

## Version et livraison
- VERSION prend la valeur 0.3.1 sur preprod uniquement ; scripts/netlify-build.sh écrit site/version.json depuis VERSION à chaque déploiement du code, avec commit et branche.
- Ne jamais changer main, state/ ou decisions/ sans autorisation de publication.
- Recette : comparer desktop 1280/1440, iPhone 375/390/430, navigation active, chandelier, marqueurs et ordres, valeurs exactes, mode reduced-motion, version et commit visibles.
- Si l'apparence ou l'accessibilité régressent, revenir à la version préprod antérieure ; aucun impact sur les données PAPER.
