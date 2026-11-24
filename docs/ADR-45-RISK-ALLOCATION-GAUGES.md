# ADR-45 — Indicateurs de risque, performance et allocation
Date : 24 novembre 2026. Statut : proposé en préproduction.

## Décisions
Trois indicateurs visuels s'appuient exclusivement sur l'état PAPER et l'historique disponible :
1. Risque global jusqu'à 8 % du portefeuille, en USDC et pourcentage. Réutiliser KPLib.exposure et orderMath, qui intègrent les frais, le glissement estimé et les achats en attente. Ne pas afficher comme exhaustif un chiffre lorsque les protections de positions ou d'achats font défaut.
2. Performance 7 jours et seuil de perte −8 %. La référence exige un point d'equity à la date de départ ou antérieur ; sinon afficher une indisponibilité. La jauge représente la perte, un bénéfice équivaut à zéro perte.
3. Allocation cible moyen terme 40 %, court terme 25 %, réserve 35 %. La classification des positions et ordres doit être explicite (champ compartment : medium ou short) ; à défaut afficher la somme inconnue et la réserve observée, sans inventer de classement.

## Limites
La réserve est le cash non engagé par les achats en attente. Les valeurs sont des estimations PAPER et ne constituent ni conseil ni décision de trading. Aucun nouveau champ du moteur n'est imposé ici ; l'absence de compartiment de stratégie est assumée. Les calculs d'exposition historiques doivent être vérifiés sur le moteur 0.2.1 pour éviter tout double comptage de brackets.

## Recette
Vérifier les bornes 8 % et −8 %, données manquantes, absence de stop, charges de frais, arrondis, une position et un achat en attente, largeur mobile, zoom, aria et mise à jour live. Ne toucher à aucun ordre ou état ; CI, revue Grok Bot et recette utilisateur avant fusion.
