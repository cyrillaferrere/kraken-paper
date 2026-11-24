# ADR-42 — Fusion des groupes de sorties après achat

Date : 24 novembre 2026. Statut : proposé, préproduction uniquement.

## Contexte
Le moteur 0.2.0 crée un bracket à chaque nouvel achat, même si la paire en possède déjà un. Cela peut produire deux stops distincts, des TP redondants et une gestion difficile de la quantité réservée.

## Décision
Pour un nouveau fill d'achat (limite ou marché), conserver le groupe existant s'il est unique et identifié par un parent. Sa quantité résiduelle augmente de la nouvelle quantité achetée, sans activer de TP déjà exécuté. Répartir la quantité entre les TP restant ouverts, conserver leurs prix, le stop, le compteur tp_filled et le pending_exits de mise à jour différée. Actualiser entry_price au PRU réel pondéré du portefeuille. Les niveaux provenant du nouvel achat ne remplacent pas les protections existantes.

Si aucun bracket n'existe, les sorties du nouvel achat utilisent leur contrat existant. Les ventes indépendantes sont conservées et continuent à réserver leurs quantités. Pour les états historiques incohérents (plusieurs brackets, quantités indisponibles ou paliers non négociables), ne pas transformer brutalement les protections : conserver les groupes existants et signaler la situation en revue avant activation en production. Une deuxième phase pourra prévoir une réparation explicite de ces cas.

## Conséquences et sécurité
La quantité d'un bracket ne compte qu'une fois pour le stop et ses TP. Pas de vente à découvert ni réécriture des ordres déjà exécutés. Ne jamais fusionner automatiquement pendant l'opération update_exits elle-même : seule l'exécution d'un nouvel achat déclenche cette opération.

La demande de mise à jour différée reste en place et sera appliquée au prochain créneau ; la quantité protégée après activation est bornée par le groupe et la position disponibles. Aucune modification de state/, decisions/, ni ordre réel. Test et revue Grok Bot obligatoires avant fusion.
