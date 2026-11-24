# Historique du moteur PAPER (independant du site)

## 0.2.1 — candidat : alertes price_move
- Détection d'une variation du cours des actifs suivis depuis une référence persistante ; pas de nouvel ordre PAPER.
- Transmission des alertes après sauvegarde/push via webhook existant.

## 0.2.0 — en developpement (site 0.3.7)
- Traitement des bougies 5 minutes cloturees a chaque passage, sans attendre la fin d'heure.
- Repli explicite sur 1 h lorsque les 5 minutes manquent pour une heure cloturee : evenement execution_fallback.
- Activation des nouveaux ordres a la bougie 5 min suivante (horodatage d'ouverture, precision 5 min).
- Limites maker : marge de penetration parametree 0,05 % par defaut. Ce **n'est pas** une regle de Kraken ; aucune garantie de fill reel.
- Stop : declenchement au niveau, puis vente taker simulee au plus mauvais du seuil et de l'ouverture en cas de gap, avec glissement variable.
- Volume fictif des fills du portefeuille sur 30 jours glissants pour selection du palier maker/taker.
- Un groupe de sorties bracket reserve une fois la quantite pour son stop et ses objectifs, reduit la quantite restante apres TP, annule le reliquat lors d'un stop. Pas de vente a decouvert.
- Attribution `engine_version` aux nouveaux trades, evenements, portefeuille et lignes CSV.
- Aucune recomposition des trades passes, aucun recalcul de l'equity historique.

## 0.1.0 — historique jusqu'a v0.3.6.x du site
- Limites au simple contact (high/low), sans attente de depassement.
- Rejeu en 1 h cloturee ; 5 min seulement pour dater/departager.
- Stop taker avec glissement forfaitaire de 0,1 % ; frais forfaitaires 0,40/0,80 %.
- Ordres actifs a l'heure pleine suivante.
- Les evenements/trades anciens sans engine_version et les lignes equity sans version sont reputes issus du moteur 0.1.0 **a la lecture** ; aucun champ historique n'est reecrit.

## Reserve
Le numero 1.0.0 ne sera attribue qu'apres plusieurs semaines de comparaison et validation.
