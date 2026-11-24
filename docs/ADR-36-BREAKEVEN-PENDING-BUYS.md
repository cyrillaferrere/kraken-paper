# ADR-36 — Point mort conditionnel

Statut : proposé, cahier des charges validé.

Point mort TP1 : conserver le stop si un achat ouvert de la même paire est sous le PRU courant ; motif et IDs journalisés dans le fill. La suspension est persistée dans breakeven_deferred. Le risque résiduel jusqu'au stop commun est accepté après TP1 pour éviter une vente suivie d'un rachat plus bas. Réarmement après disparition des achats sous le PRU courant et clôture au moins 0,5 % au-dessus du point mort net (PRU majoré du taker et de 0,2 % de glissement estimé). Le stop ne baisse jamais. Un gap peut encore produire une perte.

Test isolé sans réseau. Aucun état vivant modifié.
