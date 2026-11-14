# ADR-26 — Sorties fractionnées par paliers (v0.3.0)
Date : 14 novembre 2026 · Statut : validé pour développement en préproduction par Cyril

## Contexte
Le moteur actuel lie un stop et un seul objectif à une quantité entière. Grok Bot demande des TP fractionnés, un stop sur le solde et une remontée facultative du stop après TP1. Aucun changement de frais ou de stratégie.

## Contrat de décision
- Pour `place_limit` d'achat et `market_buy` : `take_profits: [{price, fraction}]`, somme des fractions = 1 (tolérance numérique 1e-9), prix positifs, strictement croissants et supérieurs au prix d'entrée, fractions positives. `stop_loss` unique et `breakeven_after_tp1` booléen facultatif.
- `take_profit` historique reste valide et est converti en un palier de fraction 1. Les deux formats ne peuvent pas être combinés.
- `update_exits` cible une paire détenue et remplace uniquement les sorties encore ouvertes de cette paire. Les fractions s'appliquent à la quantité restante, sans réécrire les exécutions passées. Refuser toute modification incompatible avec les ordres de vente externes réservant cette quantité.
- La quantité du dernier palier absorbe les arrondis de lot. Un palier inférieur au minimum négociable doit être rejeté avant placement plutôt qu'ignoré.

## Exécution et sécurité
- Un groupe de sorties contient un stop unique sur la quantité résiduelle et des TP partiels. Il ne réserve pas deux fois les mêmes unités.
- Pour chaque bougie horaire close, examiner les sous-bougies 5 min dans l'ordre. Si stop et TP se croisent dans la même 5 min, exécuter le stop avant tout TP. En absence de 5 min complètes, stop prioritaire sur l'heure, comme ADR-14.
- Après TP1, `breakeven_after_tp1` remonte le stop à la valeur de référence du prix d'entrée (PRU) sans jamais le baisser ; les frais taker et le glissement impliquent un résultat net potentiellement négatif.
- Les TP paient 0,40 % maker ; le stop paie 0,80 % taker et 0,1 % de glissement. Horodatage identique à ADR-14.
- Le PRU moyen reste inchangé sur une vente partielle ; le P&L réalisé est calculé sur chaque quantité vendue, net de frais.
- Les anciens ordres de sortie et décisions restent exécutables sans migration de `state/` ou `decisions/`.

## Interfaces, recette et déploiement
- Dashboard : afficher chaque TP, stop résiduel, gain/risque global net depuis le PRU, lignes TP1/TP2 et fills partiels horodatés.
- Tests : TP1→TP2, TP1→stop remonté, stop avant TP1, collision dans une 5 min, ordres historiques, arrondis, mise à jour des sorties et rejet de fractions invalides.
- Brancher `feature/v0.3-paliers` depuis `preprod`, PR vers `preprod`, CI et revue Grok Bot avant fusion. Aucune modification de `main`, `state/` ou `decisions/`.

## Complément après revue Grok Bot — activation différée
- `update_exits` sur un groupe de sorties existant conserve ce groupe (et son stop) jusqu'à la prochaine heure d'activation ; la modification est stockée comme `pending_exits` sur cet ordre. Un second changement pendant l'attente est refusé.
- À l'activation, les nouvelles fractions sont recalculées sur la quantité réellement restante, notamment si un TP historique a été exécuté entre-temps. Le compteur `tp_filled` est préservé.
- Si l'ancien stop liquide la position avant l'activation, aucune nouvelle sortie n'est créée.
- Un stop en gap est exécuté au minimum entre le niveau du stop et le prix d'ouverture de la bougie concernée, puis glissement 0,1 %. Cette règle corrige aussi le moteur historique, mais uniquement sur cette branche avant validation.
- Les décisions `update_exits` sont contrôlées au dernier cours : stop strictement inférieur au marché, TP strictement supérieur ; break-even exige un stop.
