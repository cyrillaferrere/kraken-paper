# ADR-20 — Navigation en quatre rubriques (v0.3.0)

Date : 2026-11-14 · Statut : proposé pour préproduction

## Contexte
Les captures iPhone montrent une page verticale trop longue : cartes de KPI et explications techniques repoussent le graphique, les ordres et l'historique. Le dashboard reste une interface PAPER en lecture seule.

## Décision
- Quatre rubriques : Vue d’ensemble, Marchés, Ordres, Historique.
- La vue d’ensemble présente la valeur, les performances, l'exposition, les prochains cycles et le chandelier ; Marchés expose aussi le scanner.
- Ordres regroupe positions et ordres ouverts ; Historique regroupe performance, trades, décisions, journal et leçons.
- Navigation par ancres compatibles avec les liens existants et l'historique du navigateur ; un seul ensemble de composants reste monté pour ne pas réinitialiser les données.
- Les informations techniques secondaires sont réduites visuellement sur mobile, sans modification des données ni du moteur.
- Aucune dépendance ou API privée ajoutée.

## Risques et validation
- Masquer des sections peut perturber les ancres, la navigation clavier et les mises à jour en direct. Vérifier les quatre rubriques sur Safari iPhone, Android et desktop ; tester retour arrière, liens profonds, focus et absence de débordement.
- Vérifier la lisibilité des risques, l'état des prix et la fraîcheur du moteur ; aucune valeur simulée ou interpolée.
- Les tests statiques ne remplacent pas une recette visuelle.
- Fusion vers preprod uniquement après CI. Aucun passage sur main sans accord explicite de Cyril.
