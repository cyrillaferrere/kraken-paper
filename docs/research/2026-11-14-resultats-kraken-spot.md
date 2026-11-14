# Résultats officiels Kraken spot — recherche R-01

**Exécution du 14 novembre 2026** · GitHub Actions [job vérifié](https://github.com/cyrillaferrere/kraken-paper/actions/runs/43635789292) · Branche `feature/research-plateaux` · aucune action de trading.

## Verdict opérationnel

**À abandonner comme signal d'achat autonome avec les paramètres et frais retenus.** Les 12 combinaisons actifs / horizons / conditions de plateau et de baisse préalable présentent toutes une **espérance nette par trade négative**, de l'ordre de -1,28 % à -1,63 % pour les sous-hypothèses après baisse de 2 %. En outre, aucun des six résultats globaux « après baisse de 2 % » ne présente un avantage statistiquement distinguable de zéro au niveau de confiance 95 % par blocs hebdomadaires. Il reste éventuellement intéressant d'étudier les marqueurs de plateau comme **descripteurs de marché**, sans les transformer en recommandations ni en ordres.

## Points de vigilance

- Les taux de rebond et la simulation de fills concernent des populations différentes : les taux de rebond comparent les seuls événements appariés ; le P&L porte sur tous les signaux éligibles. Ne pas les combiner en espérance naïve.
- Le sous-groupe **ETH/USDC 1 h en régime baissier**, plateaux sans filtre de baisse préalable supplémentaire, montre un écart positif sur **20 paires appariées** ; ce résultat exploratoire est très fragile face à la multiplicité des sous-groupes, et son espérance économique est négative.
- Le calcul d'un fill maker sur OHLC reste une hypothèse favorable (pas de file d'attente ou de carnet). Les ambiguïtés intrabougie sont résolues de façon défavorable ; une ouverture sous une limite invalide le fill maker.
- Le rapport complet contient les fenêtres de test, les scores et les empreintes de chaque CSV. Le ZIP officiel a été lu à distance par requêtes HTTP Range ; **son SHA-256 global n'a pas été recalculé**. Intégrité de chaque CSV vérifiée avec CRC32 du ZIP puis SHA-256 local ; ETags et tailles des cinq parties conservés dans le manifeste.
- La PR reste en brouillon ; pas de décision Grok Bot, pas de modification du moteur, aucun déploiement.

---

# Kraken Paper — backtest Kraken spot hors-échantillon

Exécution sur les archives déclarées ci-dessous. Aucun ordre réel.

Plateau : compression range (35e percentile), ATR (50e), pente <=2 ATR.
Rebond : +1,5 ATR avant -1 ATR sous 48 h ; ambiguïtés = échec.
Sous-hypothèse : baisse de 2 % dans les 96 h précédant le plateau.
Appariement régime 30 jours et volatilité ; fenêtres 90 jours purgées 48 h.
Entrée limite maker 0,4 %, sortie taker 0,8 % + 0,1 % glissement.

| Instrument | Fenêtre test | Hypothèse | Régime | N apparié | Plateau ↑ % | Référence ↑ % | IC95 écart pts | Fills | Espérance nette % | DD réalisé % | Stratégie % | HODL % |
|---|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | all | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 10 | -1.516 | -16.383 | -14.289 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 10 | -1.516 | -16.383 | -14.289 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 4 | -1.571 | -7.495 | -6.195 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | bull | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 4 | -1.571 | -7.495 | -6.195 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.392 |
| BTC/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.392 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | all | 3 | 0.0 | 0.0 | n/d (<8 semaines) | 16 | -1.456 | -21.041 | -21.041 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 12 | -1.412 | -15.806 | -15.806 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | sideways | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 4 | -1.588 | -6.232 | -6.218 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | all | 6 | 33.33 | 16.67 | n/d (<8 semaines) | 8 | -1.577 | -12.583 | -12.033 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | bear | 4 | 25.0 | 0.0 | n/d (<8 semaines) | 7 | -1.478 | -10.547 | -9.985 | -39.296 |
| BTC/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 1 | -2.276 | -2.276 | -2.276 | -39.296 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | all | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 13 | -1.031 | -12.645 | -12.645 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 5 | -0.985 | -4.842 | -4.842 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -0.934 | -4.602 | -4.602 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -1.27 | -3.772 | -3.772 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | all | 5 | 60.0 | 60.0 | n/d (<8 semaines) | 5 | -0.534 | -2.655 | -2.655 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | bear | 3 | 66.67 | 66.67 | n/d (<8 semaines) | 3 | -0.255 | -0.764 | -0.764 | 45.686 |
| BTC/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -0.953 | -1.906 | -1.906 | 45.686 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | all | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 25 | -1.872 | -37.671 | -37.671 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 12 | -1.696 | -18.577 | -18.577 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 13 | -2.034 | -23.45 | -23.45 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | all | 8 | 25.0 | 50.0 | n/d (<8 semaines) | 9 | -2.031 | -16.866 | -16.866 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | bull | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 3 | -1.942 | -5.714 | -5.714 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | bear | 5 | 0.0 | 60.0 | n/d (<8 semaines) | 6 | -2.076 | -11.828 | -11.828 | -12.966 |
| BTC/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -12.966 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | all | 4 | 0.0 | 25.0 | n/d (<8 semaines) | 25 | -1.251 | -27.069 | -27.069 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -0.888 | -3.513 | -3.513 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | bear | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 13 | -1.545 | -18.356 | -18.356 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 8 | -0.956 | -7.419 | -7.419 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | all | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 7 | -1.51 | -10.119 | -10.119 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.551 | -0.551 | -0.551 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | bear | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 3 | -1.404 | -4.162 | -4.162 | -0.615 |
| BTC/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -1.936 | -5.696 | -5.696 | -0.615 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 15 | -1.624 | -21.821 | -21.799 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.342 | -2.669 | -2.669 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 11 | -1.66 | -16.869 | -16.845 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.704 | -3.379 | -3.379 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | all | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 4 | -1.586 | -6.199 | -6.199 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.342 | -2.669 | -2.669 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -1.789 | -1.789 | -1.789 | -56.091 |
| BTC/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -1.871 | -1.871 | -1.871 | -56.091 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | all | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 29 | -1.172 | -29.018 | -29.018 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 8 | -0.559 | -4.463 | -4.4 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 15 | -1.411 | -19.229 | -19.229 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 6 | -1.39 | -8.075 | -8.075 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | all | 4 | 75.0 | 25.0 | n/d (<8 semaines) | 13 | -1.322 | -15.916 | -15.916 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | bull | 2 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.246 | -0.246 | -0.246 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | bear | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 9 | -1.633 | -13.779 | -13.779 | 5.775 |
| BTC/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -0.749 | -2.238 | -2.238 | 5.775 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | all | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 24 | -1.418 | -29.039 | -29.039 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 4 | -1.387 | -5.439 | -5.439 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 9 | -1.606 | -13.568 | -13.568 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 11 | -1.275 | -13.178 | -13.178 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | all | 5 | 40.0 | 60.0 | n/d (<8 semaines) | 5 | -1.557 | -7.554 | -7.554 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | bear | 4 | 25.0 | 75.0 | n/d (<8 semaines) | 3 | -1.858 | -5.472 | -5.472 | -13.27 |
| BTC/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -1.106 | -2.202 | -2.202 | -13.27 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | all | 7 | 42.86 | 14.29 | n/d (<8 semaines) | 19 | -1.406 | -23.609 | -23.609 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | bull | 6 | 50.0 | 0.0 | n/d (<8 semaines) | 10 | -1.6 | -14.904 | -14.904 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.666 | -0.666 | -0.666 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 8 | -1.256 | -9.628 | -9.628 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 6 | -1.174 | -6.85 | -6.85 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | bull | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 3 | -1.706 | -5.03 | -5.03 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.666 | -0.666 | -0.666 | 67.13 |
| BTC/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | sideways | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 2 | -0.631 | -1.259 | -1.259 | 67.13 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 15 | -1.256 | -17.293 | -17.293 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 7 | -1.41 | -9.47 | -9.47 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 8 | -1.122 | -8.642 | -8.642 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | all | 3 | 100.0 | 33.33 | n/d (<8 semaines) | 5 | -1.094 | -5.356 | -5.356 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 8.136 |
| BTC/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | sideways | 3 | 100.0 | 33.33 | n/d (<8 semaines) | 5 | -1.094 | -5.356 | -5.356 | 8.136 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | all | 7 | 14.29 | 71.43 | n/d (<8 semaines) | 19 | -1.418 | -23.765 | -23.765 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 6 | -1.404 | -8.135 | -8.135 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | bear | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 7 | -1.362 | -9.151 | -9.151 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | sideways | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -1.497 | -8.655 | -8.655 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | all | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 3 | -1.344 | -3.978 | -3.978 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -1.484 | -1.484 | -1.484 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | bear | 2 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -1.274 | -2.532 | -2.532 | -12.664 |
| BTC/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -12.664 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | all | 6 | 16.67 | 33.33 | n/d (<8 semaines) | 19 | -1.331 | -22.487 | -22.487 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | bull | 6 | 16.67 | 33.33 | n/d (<8 semaines) | 14 | -1.375 | -17.631 | -17.631 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -1.207 | -5.896 | -5.896 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.102 | -2.193 | -2.193 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 65.974 |
| BTC/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.102 | -2.193 | -2.193 | 65.974 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | all | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 9 | -1.491 | -12.657 | -12.657 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | bull | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 8 | -1.475 | -11.222 | -11.222 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.616 | -1.616 | -1.616 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | all | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -1.99 | -3.941 | -3.941 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -1.99 | -3.941 | -3.941 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 46.581 |
| BTC/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 46.581 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 16 | -1.368 | -19.796 | -19.796 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 9 | -1.373 | -11.706 | -11.706 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.576 | -0.576 | -0.576 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 6 | -1.493 | -8.637 | -8.637 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | all | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 3 | -1.485 | -4.392 | -4.392 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -2.087 |
| BTC/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | sideways | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -1.485 | -4.392 | -4.392 | -2.087 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | all | 3 | 100.0 | 33.33 | n/d (<8 semaines) | 12 | -1.398 | -15.567 | -15.567 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 8 | -1.185 | -9.109 | -9.109 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 4 | -1.825 | -7.105 | -7.105 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | all | 6 | 33.33 | 16.67 | n/d (<8 semaines) | 4 | -1.514 | -5.923 | -5.923 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | bear | 4 | 25.0 | 25.0 | n/d (<8 semaines) | 2 | -1.227 | -2.441 | -2.441 | -10.695 |
| BTC/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 2 | -1.801 | -3.569 | -3.569 | -10.695 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | all | 5 | 0.0 | 40.0 | n/d (<8 semaines) | 22 | -1.541 | -28.953 | -28.953 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | bull | 5 | 0.0 | 40.0 | n/d (<8 semaines) | 20 | -1.529 | -26.539 | -26.539 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.657 | -3.287 | -3.287 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -1.889 | -1.889 | -1.889 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -1.889 | -1.889 | -1.889 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 62.234 |
| BTC/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 62.234 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | all | 5 | 60.0 | 40.0 | n/d (<8 semaines) | 12 | -1.204 | -13.786 | -13.553 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 3 | -1.391 | -4.123 | -4.123 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | bear | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 4 | -1.199 | -4.982 | -4.726 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -1.095 | -5.364 | -5.364 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 4 | -0.962 | -4.065 | -3.806 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 2 | -0.649 | -1.568 | -1.302 | -16.629 |
| BTC/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -1.274 | -2.537 | -2.537 | -16.629 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 24 | -1.296 | -26.915 | -26.915 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 15 | -1.429 | -19.424 | -19.424 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.292 | -3.831 | -3.831 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 6 | -0.968 | -5.684 | -5.684 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | all | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 5 | -1.442 | -7.011 | -7.011 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | bull | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 3 | -1.281 | -3.798 | -3.798 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 23.378 |
| BTC/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.684 | -3.34 | -3.34 | 23.378 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | all | 7 | 28.57 | 42.86 | n/d (<8 semaines) | 20 | -1.463 | -25.529 | -25.529 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | bull | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 8 | -1.592 | -12.051 | -12.051 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -1.508 | -1.508 | -1.508 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | sideways | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 11 | -1.364 | -14.028 | -14.028 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -1.602 | -4.729 | -4.729 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -1.612 | -1.612 | -1.612 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -1.508 | -1.508 | -1.508 | 9.406 |
| BTC/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 1 | -1.685 | -1.685 | -1.685 | 9.406 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 10 | -1.213 | -11.5 | -11.5 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 2 | -1.309 | -2.603 | -2.603 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -1.176 | -5.753 | -5.753 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -1.21 | -3.589 | -3.589 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | all | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 2 | -1.353 | -2.689 | -2.689 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | bear | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 1 | -1.663 | -1.663 | -1.663 | -20.446 |
| BTC/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -1.043 | -1.043 | -1.043 | -20.446 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | all | 10 | 30.0 | 50.0 | n/d (<8 semaines) | 21 | -1.13 | -21.271 | -21.271 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.368 | -5.364 | -5.364 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | bear | 5 | 40.0 | 60.0 | n/d (<8 semaines) | 8 | -0.887 | -6.916 | -6.916 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | sideways | 5 | 20.0 | 40.0 | n/d (<8 semaines) | 9 | -1.239 | -10.628 | -10.628 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | all | 8 | 37.5 | 12.5 | n/d (<8 semaines) | 8 | -1.025 | -7.932 | -7.932 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | bear | 4 | 25.0 | 0.0 | n/d (<8 semaines) | 4 | -0.692 | -2.752 | -2.752 | -20.049 |
| BTC/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | sideways | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 4 | -1.358 | -5.326 | -5.326 | -20.049 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | all | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 26 | -1.415 | -30.996 | -30.996 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 12 | -1.326 | -14.813 | -14.813 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.543 | -1.543 | -1.543 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | sideways | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 13 | -1.488 | -17.727 | -17.727 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 8 | -1.468 | -11.168 | -11.168 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.538 | -0.538 | -0.538 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -9.809 |
| BTC/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | sideways | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 7 | -1.601 | -10.687 | -10.687 | -9.809 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 22 | -1.224 | -23.745 | -23.745 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -0.665 | -1.983 | -1.983 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 6 | -1.485 | -8.591 | -8.591 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 13 | -1.232 | -14.891 | -14.891 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | all | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 4 | -1.559 | -6.091 | -6.091 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -1.623 | -3.22 | -3.22 | 24.697 |
| BTC/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.495 | -2.967 | -2.967 | 24.697 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | all | 9 | 55.56 | 44.44 | n/d (<8 semaines) | 16 | -1.839 | -26.184 | -26.184 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | bull | 9 | 55.56 | 44.44 | n/d (<8 semaines) | 13 | -1.481 | -18.136 | -18.136 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -3.39 | -9.831 | -9.831 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | all | 4 | 25.0 | 75.0 | n/d (<8 semaines) | 2 | -4.159 | -8.149 | -8.149 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | bull | 4 | 25.0 | 75.0 | n/d (<8 semaines) | 2 | -4.159 | -8.149 | -8.149 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 41.109 |
| BTC/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 41.109 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 12 | -0.966 | -15.079 | -11.556 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 2 | -1.021 | -3.059 | -2.074 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 8 | -0.432 | -15.079 | -3.908 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -3.051 | -6.01 | -6.01 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | all | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 3 | 1.08 | -4.411 | 3.04 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | bear | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 3 | 1.08 | -4.411 | 3.04 | -39.18 |
| BTC/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -39.18 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | all | 6 | 50.0 | 66.67 | n/d (<8 semaines) | 14 | -2.04 | -26.339 | -25.217 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | bull | 5 | 40.0 | 60.0 | n/d (<8 semaines) | 7 | -1.89 | -12.609 | -12.609 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -2.858 | -10.951 | -10.951 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 3 | -1.298 | -5.346 | -3.904 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | all | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 3 | -2.876 | -8.383 | -8.383 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -2.874 | -5.666 | -5.666 | 44.657 |
| BTC/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.881 | -2.881 | -2.881 | 44.657 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | all | 9 | 44.44 | 55.56 | n/d (<8 semaines) | 19 | -1.707 | -29.071 | -28.151 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | bull | 6 | 33.33 | 66.67 | n/d (<8 semaines) | 10 | -1.268 | -13.274 | -12.149 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | bear | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 8 | -2.12 | -16.832 | -15.858 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.801 | -2.801 | -2.801 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | all | 6 | 33.33 | 33.33 | n/d (<8 semaines) | 7 | -2.422 | -15.836 | -15.836 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -2.654 | -5.238 | -5.238 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | bear | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 5 | -2.329 | -12.212 | -11.184 | -13.147 |
| BTC/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -13.147 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | all | 5 | 40.0 | 60.0 | n/d (<8 semaines) | 16 | -1.385 | -20.226 | -20.226 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.116 | -4.44 | -4.44 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | bear | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 9 | -1.067 | -11.772 | -9.379 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -2.698 | -7.879 | -7.879 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | all | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 4 | -2.898 | -11.099 | -11.099 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.775 | -2.775 | -2.775 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -3.043 | -5.994 | -5.994 | 0.191 |
| BTC/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.731 | -2.731 | -2.731 | 0.191 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | all | 10 | 40.0 | 40.0 | n/d (<8 semaines) | 10 | -1.873 | -17.32 | -17.32 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -0.915 | -2.528 | -1.847 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | bear | 8 | 50.0 | 37.5 | n/d (<8 semaines) | 5 | -2.131 | -10.266 | -10.266 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 3 | -2.081 | -6.127 | -6.127 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 6 | -1.832 | -10.551 | -10.551 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -0.915 | -2.528 | -1.847 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | bear | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 2 | -3.05 | -6.006 | -6.006 | -56.177 |
| BTC/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.532 | -3.044 | -3.044 | -56.177 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | all | 6 | 50.0 | 50.0 | n/d (<8 semaines) | 17 | -1.671 | -25.095 | -25.095 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 7 | -1.599 | -10.762 | -10.762 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | bear | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 8 | -1.769 | -13.421 | -13.421 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 2 | -1.533 | -3.05 | -3.05 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 8 | -1.429 | -11.0 | -11.0 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.047 | -2.883 | -2.118 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 5 | -1.742 | -8.503 | -8.503 | 5.848 |
| BTC/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 1 | -0.624 | -0.624 | -0.624 | 5.848 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | all | 6 | 0.0 | 33.33 | n/d (<8 semaines) | 20 | -1.663 | -28.542 | -28.542 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | bull | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -2.22 | -4.391 | -4.391 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | bear | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 8 | -1.553 | -11.792 | -11.792 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 10 | -1.639 | -15.269 | -15.269 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -1.1 | -3.273 | -3.273 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -1.525 | -3.03 | -3.03 | -13.113 |
| BTC/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | -0.251 | -0.251 | -0.251 | -13.113 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | all | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 13 | -1.565 | -18.588 | -18.588 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 6 | -1.897 | -10.88 | -10.88 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | sideways | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 7 | -1.28 | -8.649 | -8.649 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 6 | -1.389 | -8.076 | -8.076 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.417 | -4.236 | -4.208 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.988 |
| BTC/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.36 | -4.052 | -4.038 | 67.988 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | all | 8 | 25.0 | 50.0 | n/d (<8 semaines) | 15 | -1.628 | -21.881 | -21.881 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 4 | -1.749 | -6.831 | -6.831 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 4 | -1.968 | -7.644 | -7.644 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | sideways | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 7 | -1.365 | -9.214 | -9.214 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | all | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 4 | -2.207 | -8.54 | -8.54 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | bear | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 2 | -2.044 | -4.047 | -4.047 | 8.172 |
| BTC/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -2.369 | -4.682 | -4.682 | 8.172 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 16 | -1.2 | -17.596 | -17.596 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 6 | -1.094 | -6.409 | -6.409 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 5 | -1.415 | -6.881 | -6.881 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -1.112 | -5.447 | -5.447 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -1.097 | -4.33 | -4.33 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.135 | -0.135 | -0.135 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -1.877 | -1.877 | -1.877 | -12.767 |
| BTC/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.189 | -2.369 | -2.369 | -12.767 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | all | 7 | 57.14 | 71.43 | n/d (<8 semaines) | 13 | -1.354 | -16.291 | -16.291 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | bull | 6 | 50.0 | 83.33 | n/d (<8 semaines) | 11 | -1.531 | -15.651 | -15.651 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -0.38 | -0.758 | -0.758 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | all | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.044 | -0.044 | -0.044 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.044 | -0.044 | -0.044 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.44 |
| BTC/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.44 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | all | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 5 | -1.702 | -8.255 | -8.255 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | bull | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 3 | -1.246 | -3.714 | -3.714 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.386 | -4.715 | -4.715 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -2.458 | -4.855 | -4.855 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.417 | -2.417 | -2.417 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 44.602 |
| BTC/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.498 | -2.498 | -2.498 | 44.602 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | all | 4 | 50.0 | 75.0 | n/d (<8 semaines) | 13 | -1.496 | -19.186 | -17.906 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | bull | 2 | 100.0 | 100.0 | n/d (<8 semaines) | 8 | -1.188 | -10.603 | -9.187 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 5 | -1.988 | -9.6 | -9.6 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | all | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -1.021 | -2.897 | -2.066 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -0.885 |
| BTC/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.021 | -2.897 | -2.066 | -0.885 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | all | 8 | 50.0 | 50.0 | n/d (<8 semaines) | 15 | -1.426 | -19.496 | -19.496 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -2.554 | -5.043 | -5.043 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | bear | 4 | 75.0 | 75.0 | n/d (<8 semaines) | 7 | -1.618 | -10.848 | -10.848 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | sideways | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 6 | -0.825 | -4.905 | -4.905 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 6 | -1.471 | -8.561 | -8.561 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | bear | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 5 | -1.395 | -6.837 | -6.837 | -9.035 |
| BTC/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.851 | -1.851 | -1.851 | -9.035 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | all | 10 | 40.0 | 40.0 | [-40.0; 36.36] | 15 | -1.004 | -14.767 | -14.158 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | bull | 9 | 44.44 | 33.33 | [-25.0; 44.44] | 12 | -0.881 | -10.677 | -10.168 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -1.496 | -4.579 | -4.442 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 1 | 0.279 | 0.0 | 0.279 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 1 | 0.279 | 0.0 | 0.279 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 61.732 |
| BTC/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 61.732 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | all | 6 | 50.0 | 33.33 | n/d (<8 semaines) | 11 | -1.617 | -16.489 | -16.489 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -2.426 | -4.794 | -4.794 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | bear | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -1.358 | -4.042 | -4.042 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | sideways | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 6 | -1.477 | -9.215 | -8.589 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -2.311 | -6.774 | -6.774 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.154 | -2.154 | -2.154 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.588 | -2.588 | -2.588 | -16.67 |
| BTC/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | sideways | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 1 | -2.19 | -2.19 | -2.19 | -16.67 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | all | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 23 | -1.458 | -28.763 | -28.763 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 14 | -1.481 | -18.913 | -18.913 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.834 | -5.417 | -5.417 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 6 | -1.216 | -7.115 | -7.115 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | all | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | 0.19 | -0.032 | 0.38 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.032 | -0.032 | -0.032 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 23.508 |
| BTC/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | 0.413 | 0.0 | 0.413 | 23.508 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | all | 5 | 80.0 | 0.0 | n/d (<8 semaines) | 14 | -1.124 | -14.735 | -14.678 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 6 | -0.88 | -5.186 | -5.186 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | sideways | 2 | 100.0 | 0.0 | n/d (<8 semaines) | 8 | -1.307 | -10.072 | -10.011 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | all | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 4 | -1.101 | -4.35 | -4.35 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 2 | -0.184 | -0.368 | -0.368 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 8.959 |
| BTC/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -2.019 | -3.997 | -3.997 | 8.959 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 7 | -1.737 | -11.565 | -11.565 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.531 | -4.999 | -4.999 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -1.419 | -6.912 | -6.912 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.624 | -0.624 | -0.624 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -20.146 |
| BTC/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.624 | -0.624 | -0.624 | -20.146 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | all | 8 | 37.5 | 37.5 | n/d (<8 semaines) | 17 | -1.566 | -24.06 | -23.624 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.126 | -2.126 | -2.126 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | bear | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 7 | -2.067 | -14.13 | -13.637 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | sideways | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 9 | -1.114 | -10.274 | -9.643 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | all | 5 | 60.0 | 40.0 | n/d (<8 semaines) | 5 | -1.433 | -7.006 | -7.006 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | bear | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 2 | -2.638 | -5.206 | -5.206 | -21.01 |
| BTC/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | sideways | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 3 | -0.63 | -2.585 | -1.9 | -21.01 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | all | 5 | 60.0 | 20.0 | n/d (<8 semaines) | 20 | -1.046 | -19.534 | -19.105 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 11 | -0.953 | -10.559 | -10.082 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | sideways | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 9 | -1.159 | -11.057 | -10.035 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | all | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 6 | -0.935 | -6.613 | -5.54 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | 0.333 | 0.0 | 0.333 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -10.487 |
| BTC/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | sideways | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 5 | -1.188 | -6.923 | -5.853 | -10.487 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | all | 6 | 50.0 | 50.0 | n/d (<8 semaines) | 15 | -1.446 | -19.691 | -19.691 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.336 | -0.336 | -0.336 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | bear | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 5 | -1.833 | -8.865 | -8.865 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | sideways | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 9 | -1.354 | -11.582 | -11.582 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -2.478 | -7.252 | -7.252 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -2.478 | -7.252 | -7.252 | 25.267 |
| BTC/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 25.267 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -2.044 | -9.84 | -9.84 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -2.604 | -7.612 | -7.612 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.203 | -2.623 | -2.412 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.569 | -2.569 | -2.569 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.569 | -2.569 | -2.569 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 71.821 |
| ETH/USDC 60m | 2021-01-09 / 2021-04-05 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 71.821 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 11 | -2.277 | -22.53 | -22.53 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -3.635 | -10.522 | -10.522 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 8 | -1.768 | -13.42 | -13.42 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | all | 4 | 25.0 | 0.0 | n/d (<8 semaines) | 5 | -1.666 | -8.214 | -8.214 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -4.735 | -4.735 | -4.735 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | bear | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 4 | -0.899 | -3.652 | -3.652 | 12.157 |
| ETH/USDC 60m | 2021-04-09 / 2021-07-04 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 12.157 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | all | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 12 | -1.201 | -13.595 | -13.563 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 7 | -1.435 | -9.656 | -9.654 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.144 | -2.324 | -2.289 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -0.691 | -2.556 | -2.085 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 5 | -0.724 | -3.601 | -3.599 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -0.57 | -1.821 | -1.711 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.324 | -2.324 | -2.324 | 53.998 |
| ETH/USDC 60m | 2021-07-08 / 2021-10-02 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 0.412 | 0.0 | 0.412 | 53.998 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | all | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 16 | -1.83 | -25.95 | -25.624 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 8 | -2.111 | -15.692 | -15.692 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.367 | -4.488 | -4.068 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -1.658 | -8.039 | -8.039 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | all | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 4 | -2.183 | -8.45 | -8.45 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.27 | -4.488 | -4.488 | 4.759 |
| ETH/USDC 60m | 2021-10-06 / 2021-12-31 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -2.096 | -4.149 | -4.149 | 4.759 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | all | 6 | 33.33 | 16.67 | n/d (<8 semaines) | 14 | -1.596 | -20.712 | -20.236 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 4 | -1.402 | -5.518 | -5.518 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 8 | -1.598 | -12.661 | -12.137 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | plateau | sideways | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -1.977 | -3.916 | -3.916 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | all | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 3 | -2.239 | -6.567 | -6.567 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | bear | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 3 | -2.239 | -6.567 | -6.567 | -12.309 |
| ETH/USDC 60m | 2022-01-04 / 2022-03-31 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -12.309 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.564 | -4.627 | -4.627 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.564 | -4.627 | -4.627 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.564 | -4.627 | -4.627 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.564 | -4.627 | -4.627 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -67.579 |
| ETH/USDC 60m | 2022-04-04 / 2022-06-29 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -67.579 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-07-03 / 2022-09-27 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 31.515 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 6 | -1.606 | -9.263 | -9.263 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.808 | -1.808 | -1.808 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -1.566 | -7.592 | -7.592 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | all | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | bear | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.388 |
| ETH/USDC 60m | 2022-10-01 / 2022-12-26 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.388 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | all | 4 | 25.0 | 50.0 | n/d (<8 semaines) | 8 | -1.628 | -12.315 | -12.315 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | bull | 4 | 25.0 | 50.0 | n/d (<8 semaines) | 7 | -1.573 | -10.515 | -10.515 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.012 | -2.012 | -2.012 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 1 | -1.54 | -1.54 | -1.54 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 1 | -1.54 | -1.54 | -1.54 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 46.985 |
| ETH/USDC 60m | 2022-12-30 / 2023-03-26 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 46.985 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-03-30 / 2023-06-24 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 5.423 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-06-28 / 2023-09-22 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.576 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -1.563 | -6.11 | -6.11 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | bull | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -1.563 | -6.11 | -6.11 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | all | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 39.973 |
| ETH/USDC 60m | 2023-09-26 / 2023-12-21 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 39.973 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -1.338 | -6.524 | -6.524 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.554 | -6.077 | -6.077 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.476 | -0.476 | -0.476 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -0.598 | -1.192 | -1.192 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -0.72 | -0.72 | -0.72 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 47.418 |
| ETH/USDC 60m | 2023-12-25 / 2024-03-20 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.476 | -0.476 | -0.476 | 47.418 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.744 | -5.14 | -5.14 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.736 | -3.441 | -3.441 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.76 | -1.76 | -1.76 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | all | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 0.279 |
| ETH/USDC 60m | 2024-03-24 / 2024-06-18 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 0.279 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-06-22 / 2024-09-16 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -35.176 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 6 | -1.053 | -6.17 | -6.17 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -0.91 | -4.485 | -4.485 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.764 | -1.764 | -1.764 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | all | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.908 |
| ETH/USDC 60m | 2024-09-20 / 2024-12-15 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.908 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | all | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 11 | -1.036 | -11.858 | -10.881 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | bear | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 7 | -0.732 | -6.088 | -5.046 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.57 | -6.145 | -6.145 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | all | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 6 | -0.357 | -3.222 | -2.149 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 4 | 0.059 | -0.87 | 0.23 | -46.87 |
| ETH/USDC 60m | 2024-12-19 / 2025-03-15 | post -2 % | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 2 | -1.188 | -2.373 | -2.373 | -46.87 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | all | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 21 | -1.417 | -25.957 | -25.957 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 8 | -1.35 | -10.533 | -10.339 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 10 | -1.345 | -12.703 | -12.703 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.834 | -5.402 | -5.402 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | all | 7 | 57.14 | 14.29 | n/d (<8 semaines) | 5 | -0.718 | -3.691 | -3.56 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | bull | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 3 | -0.636 | -2.118 | -1.906 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | bear | 2 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 0.136 | 0.0 | 0.136 | 23.624 |
| ETH/USDC 60m | 2025-03-19 / 2025-06-13 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -1.819 | -1.819 | -1.819 | 23.624 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | all | 6 | 0.0 | 83.33 | n/d (<8 semaines) | 18 | -1.562 | -24.728 | -24.728 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | bull | 4 | 0.0 | 100.0 | n/d (<8 semaines) | 11 | -1.42 | -14.6 | -14.6 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.819 | -5.358 | -5.358 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | plateau | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 4 | -1.762 | -6.869 | -6.869 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | all | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -2.05 | -6.026 | -6.026 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.153 | -2.153 | -2.153 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.773 | -1.773 | -1.773 | 76.546 |
| ETH/USDC 60m | 2025-06-17 / 2025-09-11 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.225 | -2.225 | -2.225 | 76.546 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | all | 4 | 50.0 | 0.0 | n/d (<8 semaines) | 10 | -1.104 | -10.56 | -10.543 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 6 | -0.934 | -5.519 | -5.5 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 4 | -1.359 | -5.336 | -5.336 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | all | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 3 | -0.929 | -2.767 | -2.767 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.043 | -2.08 | -2.08 | -26.565 |
| ETH/USDC 60m | 2025-09-15 / 2025-12-10 | post -2 % | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | -0.702 | -0.702 | -0.702 | -26.565 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | all | 5 | 60.0 | 20.0 | n/d (<8 semaines) | 23 | -1.408 | -27.892 | -27.892 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 4 | -1.24 | -4.874 | -4.874 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 10 | -1.658 | -15.434 | -15.434 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 9 | -1.206 | -10.362 | -10.362 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | all | 7 | 28.57 | 28.57 | n/d (<8 semaines) | 10 | -1.365 | -12.879 | -12.879 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 5 | -1.24 | -6.152 | -6.08 | -33.059 |
| ETH/USDC 60m | 2025-12-14 / 2026-03-10 | post -2 % | sideways | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 5 | -1.49 | -7.239 | -7.239 | -33.059 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | all | 5 | 80.0 | 80.0 | n/d (<8 semaines) | 24 | -1.097 | -23.309 | -23.309 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | bull | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 14 | -1.226 | -15.895 | -15.895 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 5 | -1.089 | -5.333 | -5.333 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 5 | -0.746 | -3.679 | -3.679 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | all | 4 | 100.0 | 50.0 | n/d (<8 semaines) | 5 | -1.112 | -5.446 | -5.446 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 4 | -1.204 | -4.734 | -4.734 | -18.838 |
| ETH/USDC 60m | 2026-03-14 / 2026-06-08 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.747 | -0.747 | -0.747 | -18.838 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 26 | -1.265 | -28.224 | -28.224 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 12 | -1.249 | -14.022 | -14.022 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 7 | -1.593 | -10.642 | -10.642 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 7 | -0.965 | -6.576 | -6.576 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | all | 4 | 25.0 | 25.0 | n/d (<8 semaines) | 6 | -1.32 | -7.676 | -7.676 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 2 | -1.088 | -2.17 | -2.17 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | bear | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -1.757 | -5.18 | -5.18 | 48.775 |
| ETH/USDC 60m | 2026-06-12 / 2026-09-06 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.473 | -0.473 | -0.473 | 48.775 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | all | 10 | 40.0 | 50.0 | n/d (<8 semaines) | 12 | -2.948 | -30.72 | -30.72 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | bull | 8 | 37.5 | 50.0 | n/d (<8 semaines) | 9 | -2.63 | -21.932 | -21.932 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | plateau | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -3.901 | -11.258 | -11.258 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | all | 5 | 60.0 | 60.0 | n/d (<8 semaines) | 3 | -4.786 | -13.696 | -13.696 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | bull | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 2 | -5.41 | -10.532 | -10.532 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 67.169 |
| ETH/USDC 240m | 2021-01-09 / 2021-04-05 | post -2 % | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | -3.536 | -3.536 | -3.536 | 67.169 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | all | 6 | 50.0 | 50.0 | n/d (<8 semaines) | 10 | -2.811 | -27.882 | -25.247 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | bull | 3 | 66.67 | 66.67 | n/d (<8 semaines) | 2 | -0.047 | -3.93 | -0.246 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 8 | -3.502 | -27.882 | -25.063 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | all | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 6 | -3.112 | -20.642 | -17.54 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | bear | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 6 | -3.112 | -20.642 | -17.54 | 12.911 |
| ETH/USDC 240m | 2021-04-09 / 2021-07-04 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 12.911 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | all | 7 | 42.86 | 42.86 | n/d (<8 semaines) | 14 | -0.763 | -12.926 | -10.579 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | bull | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 10 | -0.853 | -10.041 | -8.458 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -0.541 | -6.825 | -2.317 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | all | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 6 | -0.641 | -7.601 | -3.994 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 2 | -0.841 | -2.86 | -1.716 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -0.541 | -6.825 | -2.317 | 51.132 |
| ETH/USDC 240m | 2021-07-08 / 2021-10-02 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 51.132 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | all | 8 | 37.5 | 25.0 | n/d (<8 semaines) | 14 | -0.977 | -16.081 | -13.221 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | bull | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 6 | 0.234 | -2.854 | 1.267 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | bear | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 5 | -2.272 | -10.964 | -10.964 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | plateau | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 3 | -1.238 | -3.755 | -3.755 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | all | 3 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -2.969 | -8.647 | -8.647 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.822 | -2.822 | -2.822 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -3.108 | -3.108 | -3.108 | 4.12 |
| ETH/USDC 240m | 2021-10-06 / 2021-12-31 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.978 | -2.978 | -2.978 | 4.12 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | all | 7 | 42.86 | 14.29 | n/d (<8 semaines) | 13 | -2.539 | -29.169 | -28.552 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -2.893 | -13.683 | -13.683 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | bear | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 6 | -1.989 | -13.113 | -11.473 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -3.303 | -6.498 | -6.498 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | all | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -3.529 | -10.219 | -10.219 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -3.71 | -3.71 | -3.71 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | bear | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -3.438 | -6.76 | -6.76 | -11.777 |
| ETH/USDC 240m | 2022-01-04 / 2022-03-31 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -11.777 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | all | 7 | 57.14 | 14.29 | n/d (<8 semaines) | 8 | -1.764 | -13.422 | -13.422 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -2.616 | -5.164 | -5.164 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | bear | 6 | 50.0 | 16.67 | n/d (<8 semaines) | 6 | -1.48 | -8.708 | -8.708 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | all | 4 | 75.0 | 25.0 | n/d (<8 semaines) | 4 | -1.636 | -8.374 | -6.477 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -2.616 | -5.164 | -5.164 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | bear | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 2 | -0.657 | -3.384 | -1.384 | -67.76 |
| ETH/USDC 240m | 2022-04-04 / 2022-06-29 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -67.76 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | all | 6 | 50.0 | 33.33 | n/d (<8 semaines) | 13 | -1.329 | -20.336 | -16.424 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | bull | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 6 | -1.726 | -10.108 | -10.108 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | bear | 3 | 66.67 | 66.67 | n/d (<8 semaines) | 6 | -1.575 | -13.562 | -9.317 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 2.526 | 0.0 | 2.526 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | all | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 8 | -1.318 | -14.584 | -10.389 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -3.493 | -6.865 | -6.865 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | bear | 2 | 100.0 | 100.0 | n/d (<8 semaines) | 5 | -1.216 | -10.548 | -6.155 | 31.819 |
| ETH/USDC 240m | 2022-07-03 / 2022-09-27 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 2.526 | 0.0 | 2.526 | 31.819 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | all | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 16 | -1.234 | -18.169 | -18.169 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | bear | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 12 | -1.091 | -13.471 | -12.483 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.661 | -6.497 | -6.497 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | all | 3 | 33.33 | 100.0 | n/d (<8 semaines) | 4 | -0.902 | -4.705 | -3.607 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | bear | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 4 | -0.902 | -4.705 | -3.607 | -8.039 |
| ETH/USDC 240m | 2022-10-01 / 2022-12-26 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -8.039 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | all | 7 | 14.29 | 85.71 | n/d (<8 semaines) | 15 | -1.74 | -23.252 | -23.252 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | bull | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 7 | -2.102 | -14.673 | -13.865 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.005 | -3.97 | -3.97 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | plateau | sideways | 4 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -1.23 | -7.722 | -7.214 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | all | 3 | 0.0 | 100.0 | n/d (<8 semaines) | 8 | -1.731 | -13.088 | -13.088 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -2.629 | -5.189 | -5.189 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.005 | -3.97 | -3.97 | 48.648 |
| ETH/USDC 240m | 2022-12-30 / 2023-03-26 | post -2 % | sideways | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 4 | -1.145 | -5.137 | -4.542 | 48.648 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | all | 5 | 20.0 | 20.0 | n/d (<8 semaines) | 16 | -1.528 | -22.571 | -21.933 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 9 | -1.058 | -10.671 | -9.213 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | -2.167 | -4.286 | -4.286 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | plateau | sideways | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 5 | -2.12 | -10.161 | -10.161 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | all | 5 | 60.0 | 40.0 | n/d (<8 semaines) | 3 | -1.376 | -4.476 | -4.096 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | 0.398 | 0.0 | 0.398 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -2.133 | -2.133 | -2.133 | 5.286 |
| ETH/USDC 240m | 2023-03-30 / 2023-06-24 | post -2 % | sideways | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 1 | -2.394 | -2.394 | -2.394 | 5.286 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | all | 4 | 25.0 | 0.0 | n/d (<8 semaines) | 16 | -1.348 | -19.548 | -19.548 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -0.914 | -2.73 | -2.73 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | bear | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -1.688 | -8.161 | -8.161 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | plateau | sideways | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 8 | -1.298 | -9.941 | -9.941 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | all | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.066 | -2.129 | -2.129 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.173 | -0.173 | -0.173 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -1.959 | -1.959 | -1.959 | -14.454 |
| ETH/USDC 240m | 2023-06-28 / 2023-09-22 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -14.454 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | all | 9 | 66.67 | 55.56 | [-20.0; 50.0] | 10 | -1.61 | -15.039 | -15.039 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | bull | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 6 | -1.933 | -11.558 | -11.085 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | plateau | sideways | 5 | 60.0 | 60.0 | n/d (<8 semaines) | 4 | -1.125 | -4.447 | -4.447 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | all | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 1 | 0.534 | 0.0 | 0.534 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | 0.534 | 0.0 | 0.534 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 42.004 |
| ETH/USDC 240m | 2023-09-26 / 2023-12-21 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 42.004 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | all | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 4 | -1.771 | -7.377 | -6.929 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | bull | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 4 | -1.771 | -7.377 | -6.929 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.526 | -2.526 | -2.526 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.526 | -2.526 | -2.526 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 43.075 |
| ETH/USDC 240m | 2023-12-25 / 2024-03-20 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 43.075 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 11 | -1.091 | -14.454 | -11.525 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | bull | 3 | 66.67 | 66.67 | n/d (<8 semaines) | 7 | -0.48 | -7.024 | -3.412 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.884 | -2.884 | -2.884 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.921 | -5.68 | -5.68 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | all | 2 | 100.0 | 100.0 | n/d (<8 semaines) | 4 | -0.991 | -5.615 | -3.976 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | bull | 2 | 100.0 | 100.0 | n/d (<8 semaines) | 2 | 0.866 | 0.0 | 1.737 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 0.113 |
| ETH/USDC 240m | 2024-03-24 / 2024-06-18 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.848 | -5.615 | -5.615 | 0.113 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | all | 9 | 44.44 | 11.11 | n/d (<8 semaines) | 13 | -1.509 | -18.058 | -18.058 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | bear | 7 | 42.86 | 14.29 | n/d (<8 semaines) | 10 | -1.51 | -14.214 | -14.214 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | plateau | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 3 | -1.506 | -4.481 | -4.481 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | all | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 4 | -1.076 | -4.882 | -4.287 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | bear | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 3 | -1.594 | -5.335 | -4.743 | -34.335 |
| ETH/USDC 240m | 2024-06-22 / 2024-09-16 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | 0.479 | 0.0 | 0.479 | -34.335 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | all | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 16 | -1.351 | -19.755 | -19.755 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 11 | -1.389 | -14.413 | -14.413 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.482 | -2.482 | -2.482 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | plateau | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 4 | -0.966 | -4.963 | -3.856 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | all | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.826 | -7.697 | -7.145 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -2.754 | -5.432 | -5.432 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 50.793 |
| ETH/USDC 240m | 2024-09-20 / 2024-12-15 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -0.899 | -2.395 | -1.812 | 50.793 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | all | 6 | 16.67 | 16.67 | n/d (<8 semaines) | 15 | -1.7 | -22.855 | -22.855 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | bear | 4 | 0.0 | 25.0 | n/d (<8 semaines) | 12 | -1.93 | -21.899 | -20.984 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | plateau | sideways | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 3 | -0.782 | -2.452 | -2.368 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | all | 6 | 16.67 | 16.67 | n/d (<8 semaines) | 6 | -2.756 | -15.449 | -15.449 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | bear | 5 | 0.0 | 20.0 | n/d (<8 semaines) | 6 | -2.756 | -15.449 | -15.449 | -46.811 |
| ETH/USDC 240m | 2024-12-19 / 2025-03-15 | post -2 % | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -46.811 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | all | 5 | 20.0 | 20.0 | n/d (<8 semaines) | 17 | -1.815 | -28.391 | -26.948 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 5 | -2.27 | -11.315 | -10.892 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | bear | 3 | 33.33 | 0.0 | n/d (<8 semaines) | 8 | -1.105 | -11.37 | -8.667 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -2.664 | -10.24 | -10.24 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 2 | -2.932 | -5.777 | -5.777 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.897 | -2.897 | -2.897 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | bear | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 1 | -2.967 | -2.967 | -2.967 | 23.767 |
| ETH/USDC 240m | 2025-03-19 / 2025-06-13 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 23.767 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | all | 5 | 20.0 | 40.0 | n/d (<8 semaines) | 16 | -1.11 | -17.081 | -16.572 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | bull | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 11 | -1.258 | -14.565 | -13.189 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | 0.082 | -0.532 | 0.161 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | plateau | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -1.361 | -4.483 | -4.052 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 5 | 0.502 | -0.694 | 2.514 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 4 | 0.761 | -0.694 | 3.062 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.532 | -0.532 | -0.532 | 76.689 |
| ETH/USDC 240m | 2025-06-17 / 2025-09-11 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 76.689 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | all | 3 | 33.33 | 66.67 | n/d (<8 semaines) | 8 | -1.791 | -14.695 | -13.558 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.729 | -2.729 | -2.729 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | bear | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 4 | -1.92 | -8.745 | -7.528 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -1.307 | -4.493 | -3.898 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | all | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 2 | -2.798 | -5.518 | -5.518 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | bear | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 2 | -2.798 | -5.518 | -5.518 | -26.572 |
| ETH/USDC 240m | 2025-09-15 / 2025-12-10 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -26.572 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | all | 7 | 42.86 | 42.86 | n/d (<8 semaines) | 14 | -0.582 | -11.011 | -8.057 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -0.496 | -2.661 | -1.515 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | 0.366 | -3.326 | 1.377 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | plateau | sideways | 3 | 66.67 | 66.67 | n/d (<8 semaines) | 7 | -1.161 | -7.911 | -7.911 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | all | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -0.99 | -6.629 | -4.913 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | 0.715 | 0.0 | 0.715 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | 1.115 | 0.0 | 1.115 | -33.431 |
| ETH/USDC 240m | 2025-12-14 / 2026-03-10 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -2.261 | -6.629 | -6.629 | -33.431 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | all | 6 | 33.33 | 0.0 | n/d (<8 semaines) | 23 | -1.138 | -25.651 | -23.394 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | bull | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 12 | -0.418 | -8.201 | -5.078 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | bear | 3 | 0.0 | 0.0 | n/d (<8 semaines) | 4 | -2.416 | -9.318 | -9.318 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 7 | -1.641 | -11.003 | -11.003 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | all | 5 | 40.0 | 0.0 | n/d (<8 semaines) | 6 | -0.544 | -7.139 | -3.326 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | bull | 2 | 100.0 | 0.0 | n/d (<8 semaines) | 2 | 1.347 | 0.0 | 2.71 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | bear | 3 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -2.439 | -7.139 | -7.139 | -19.234 |
| ETH/USDC 240m | 2026-03-14 / 2026-06-08 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | 1.359 | 0.0 | 1.359 | -19.234 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | all | 7 | 42.86 | 57.14 | n/d (<8 semaines) | 16 | -1.053 | -16.921 | -15.737 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | bull | 5 | 40.0 | 80.0 | n/d (<8 semaines) | 9 | -1.216 | -10.84 | -10.514 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | bear | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -0.553 | -4.176 | -2.811 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.567 | -3.113 | -3.113 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | -1.21 | -6.424 | -5.976 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 2 | -0.933 | -2.346 | -1.878 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.394 | -4.176 | -4.176 | 50.157 |
| ETH/USDC 240m | 2026-06-12 / 2026-09-06 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 50.157 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | plateau | all | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 30 | -1.111 | -29.246 | -28.867 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | plateau | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 10 | -1.62 | -16.429 | -15.184 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 14 | -0.513 | -7.691 | -7.196 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 6 | -1.658 | -9.629 | -9.629 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | post -2 % | all | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 13 | -0.985 | -13.504 | -12.266 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -2.69 | -5.308 | -5.308 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | post -2 % | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 8 | -0.833 | -6.612 | -6.612 | 3.979 |
| SOL/USD 60m | 2022-06-19 / 2022-09-13 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -0.254 | -2.255 | -0.789 | 3.979 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | plateau | all | 6 | 33.33 | 33.33 | n/d (<8 semaines) | 26 | -1.683 | -35.828 | -35.828 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | plateau | bear | 5 | 20.0 | 40.0 | n/d (<8 semaines) | 19 | -1.74 | -28.499 | -28.499 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 7 | -1.528 | -10.25 | -10.25 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | post -2 % | all | 6 | 0.0 | 66.67 | n/d (<8 semaines) | 13 | -1.969 | -22.87 | -22.87 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | post -2 % | bear | 6 | 0.0 | 66.67 | n/d (<8 semaines) | 13 | -1.969 | -22.87 | -22.87 | -60.691 |
| SOL/USD 60m | 2022-09-17 / 2022-12-12 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -60.691 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | plateau | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 25 | -1.871 | -37.735 | -37.735 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 14 | -1.679 | -21.231 | -21.231 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | plateau | bear | 4 | 25.0 | 50.0 | n/d (<8 semaines) | 7 | -2.049 | -13.492 | -13.492 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | plateau | sideways | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 4 | -2.229 | -8.624 | -8.624 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | post -2 % | all | 7 | 28.57 | 57.14 | n/d (<8 semaines) | 13 | -1.82 | -21.299 | -21.299 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 5 | -1.42 | -7.928 | -6.958 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | post -2 % | bear | 5 | 20.0 | 60.0 | n/d (<8 semaines) | 6 | -2.039 | -11.629 | -11.629 | 37.851 |
| SOL/USD 60m | 2022-12-16 / 2023-03-12 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -2.164 | -4.282 | -4.282 | 37.851 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | plateau | all | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 17 | -1.132 | -18.887 | -17.704 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | plateau | bull | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 5 | -0.887 | -4.382 | -4.382 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -1.435 | -7.686 | -7.022 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 7 | -1.09 | -8.107 | -7.433 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | post -2 % | all | 6 | 50.0 | 16.67 | n/d (<8 semaines) | 6 | -1.189 | -6.956 | -6.956 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -0.531 | -0.531 | -0.531 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | post -2 % | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 1 | -2.039 | -2.039 | -2.039 | -24.944 |
| SOL/USD 60m | 2023-03-16 / 2023-06-10 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 4 | -1.141 | -4.512 | -4.512 | -24.944 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | plateau | all | 6 | 50.0 | 66.67 | n/d (<8 semaines) | 26 | -1.036 | -23.849 | -23.849 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | plateau | bull | 2 | 100.0 | 100.0 | n/d (<8 semaines) | 12 | -0.826 | -11.224 | -9.563 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | plateau | bear | 4 | 25.0 | 50.0 | n/d (<8 semaines) | 14 | -1.216 | -15.797 | -15.797 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | post -2 % | all | 4 | 75.0 | 25.0 | n/d (<8 semaines) | 11 | -0.875 | -10.103 | -9.286 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 7 | -1.249 | -9.298 | -8.473 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | post -2 % | bear | 4 | 75.0 | 25.0 | n/d (<8 semaines) | 4 | -0.223 | -0.887 | -0.887 | 29.429 |
| SOL/USD 60m | 2023-06-14 / 2023-09-08 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 29.429 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | plateau | all | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 24 | -1.367 | -28.381 | -28.284 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | plateau | bull | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 17 | -1.188 | -18.663 | -18.553 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.694 | -6.612 | -6.612 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.942 | -5.714 | -5.714 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | post -2 % | all | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 7 | -0.956 | -8.556 | -6.583 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -0.815 | -6.877 | -4.867 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 255.633 |
| SOL/USD 60m | 2023-09-12 / 2023-12-07 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.803 | -1.803 | -1.803 | 255.633 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | plateau | all | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 8 | -1.004 | -8.273 | -7.878 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | plateau | bull | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 8 | -1.004 | -8.273 | -7.878 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | post -2 % | all | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 5 | -1.39 | -6.83 | -6.83 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | post -2 % | bull | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 5 | -1.39 | -6.83 | -6.83 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 83.236 |
| SOL/USD 60m | 2023-12-11 / 2024-03-06 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 83.236 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | plateau | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 18 | -1.239 | -20.228 | -20.228 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | plateau | bull | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 17 | -1.331 | -20.49 | -20.49 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | 0.33 | 0.0 | 0.33 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | post -2 % | all | 3 | 33.33 | 100.0 | n/d (<8 semaines) | 9 | -1.141 | -9.891 | -9.891 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | post -2 % | bull | 3 | 33.33 | 100.0 | n/d (<8 semaines) | 9 | -1.141 | -9.891 | -9.891 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 15.337 |
| SOL/USD 60m | 2024-03-10 / 2024-06-04 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 15.337 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | plateau | all | 4 | 0.0 | 75.0 | n/d (<8 semaines) | 21 | -1.493 | -27.192 | -27.192 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | plateau | bull | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -1.866 | -10.718 | -10.718 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | plateau | bear | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 14 | -1.243 | -16.13 | -16.13 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.768 | -2.768 | -2.768 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | post -2 % | all | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 7 | -1.714 | -11.425 | -11.425 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.035 | -2.035 | -2.035 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | post -2 % | bear | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 5 | -1.439 | -7.011 | -7.011 | -17.235 |
| SOL/USD 60m | 2024-06-08 / 2024-09-02 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -2.768 | -2.768 | -2.768 | -17.235 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | plateau | all | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 25 | -1.351 | -28.937 | -28.937 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | plateau | bull | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 19 | -1.342 | -22.747 | -22.747 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -1.61 | -7.813 | -7.813 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -0.217 | -0.217 | -0.217 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | post -2 % | all | 5 | 40.0 | 80.0 | n/d (<8 semaines) | 5 | -1.809 | -8.736 | -8.736 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | post -2 % | bull | 4 | 25.0 | 100.0 | n/d (<8 semaines) | 5 | -1.809 | -8.736 | -8.736 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | post -2 % | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 85.485 |
| SOL/USD 60m | 2024-09-06 / 2024-12-01 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 85.485 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | plateau | all | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 10 | -1.035 | -9.952 | -9.934 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.511 | -4.481 | -4.481 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | plateau | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 6 | -0.665 | -4.234 | -3.955 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.827 | -1.827 | -1.827 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | post -2 % | all | 4 | 100.0 | 25.0 | n/d (<8 semaines) | 3 | -0.812 | -2.452 | -2.433 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | -2.263 | -2.263 | -2.263 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | post -2 % | bear | 3 | 100.0 | 33.33 | n/d (<8 semaines) | 2 | -0.087 | -0.193 | -0.174 | -41.602 |
| SOL/USD 60m | 2024-12-05 / 2025-03-01 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -41.602 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | plateau | all | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 25 | -1.191 | -28.519 | -26.055 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 11 | -1.862 | -19.241 | -18.708 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | plateau | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 11 | -0.479 | -8.4 | -5.242 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.342 | -4.005 | -4.005 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | post -2 % | all | 7 | 57.14 | 42.86 | n/d (<8 semaines) | 7 | -0.452 | -6.228 | -3.206 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | post -2 % | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -2.136 | -4.226 | -4.226 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | post -2 % | bear | 4 | 100.0 | 25.0 | n/d (<8 semaines) | 4 | 0.847 | 0.0 | 3.425 | 13.354 |
| SOL/USD 60m | 2025-03-05 / 2025-05-30 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.281 | -2.281 | -2.281 | 13.354 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | plateau | all | 6 | 50.0 | 83.33 | n/d (<8 semaines) | 17 | -1.658 | -25.037 | -24.8 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | plateau | bull | 2 | 100.0 | 100.0 | n/d (<8 semaines) | 6 | -1.48 | -8.874 | -8.586 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | plateau | bear | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 6 | -1.737 | -10.006 | -10.006 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 5 | -1.778 | -8.591 | -8.591 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | post -2 % | all | 5 | 20.0 | 20.0 | n/d (<8 semaines) | 8 | -1.957 | -14.64 | -14.64 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 4 | -1.741 | -6.796 | -6.796 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | post -2 % | bear | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -2.134 | -6.266 | -6.266 | 32.448 |
| SOL/USD 60m | 2025-06-03 / 2025-08-28 | post -2 % | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 1 | -2.294 | -2.294 | -2.294 | 32.448 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | plateau | all | 5 | 20.0 | 20.0 | n/d (<8 semaines) | 9 | -1.657 | -13.999 | -13.999 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | plateau | bull | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -2.217 | -4.386 | -4.386 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | plateau | bear | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 4 | -2.182 | -8.445 | -8.445 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -0.585 | -1.933 | -1.757 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | post -2 % | all | 3 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -1.727 | -8.358 | -8.358 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | post -2 % | bear | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 3 | -2.234 | -6.552 | -6.552 | -31.604 |
| SOL/USD 60m | 2025-09-01 / 2025-11-26 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -0.967 | -1.933 | -1.933 | -31.604 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | plateau | all | 6 | 66.67 | 33.33 | n/d (<8 semaines) | 25 | -1.287 | -28.092 | -27.754 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -1.534 | -4.539 | -4.539 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | plateau | bear | 5 | 80.0 | 20.0 | n/d (<8 semaines) | 17 | -1.289 | -20.252 | -19.878 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 5 | -1.131 | -5.543 | -5.543 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | post -2 % | all | 8 | 50.0 | 37.5 | n/d (<8 semaines) | 13 | -0.938 | -13.212 | -11.604 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.851 | -1.851 | -1.851 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | post -2 % | bear | 7 | 42.86 | 28.57 | n/d (<8 semaines) | 8 | -0.789 | -7.911 | -6.204 | -44.663 |
| SOL/USD 60m | 2025-11-30 / 2026-02-24 | post -2 % | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 4 | -1.006 | -3.979 | -3.979 | -44.663 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | plateau | all | 5 | 40.0 | 40.0 | n/d (<8 semaines) | 26 | -1.419 | -31.089 | -31.089 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 6 | -1.642 | -9.472 | -9.472 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | plateau | bear | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 6 | -1.178 | -6.888 | -6.888 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | plateau | sideways | 2 | 0.0 | 0.0 | n/d (<8 semaines) | 14 | -1.426 | -18.248 | -18.248 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | post -2 % | all | 6 | 50.0 | 50.0 | n/d (<8 semaines) | 9 | -1.084 | -9.372 | -9.372 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -0.535 | -0.535 | -0.535 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | post -2 % | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 3 | -0.782 | -2.336 | -2.336 | 6.174 |
| SOL/USD 60m | 2026-02-28 / 2026-05-25 | post -2 % | sideways | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 5 | -1.375 | -6.706 | -6.706 | 6.174 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | plateau | all | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 23 | -1.407 | -27.855 | -27.855 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 7 | -0.798 | -5.468 | -5.468 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | plateau | bear | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 8 | -1.732 | -13.063 | -13.063 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 8 | -1.614 | -12.213 | -12.213 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | post -2 % | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 5 | -1.264 | -6.177 | -6.177 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | post -2 % | bull | 3 | 66.67 | 66.67 | n/d (<8 semaines) | 3 | -0.824 | -2.525 | -2.46 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | post -2 % | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.135 | -2.135 | -2.135 | 14.773 |
| SOL/USD 60m | 2026-05-29 / 2026-08-23 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -1.713 | -1.713 | -1.713 | 14.773 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | plateau | all | 8 | 50.0 | 62.5 | n/d (<8 semaines) | 19 | -1.152 | -30.441 | -20.841 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | plateau | bull | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 6 | -0.845 | -12.0 | -5.296 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | plateau | bear | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 8 | -0.183 | -13.533 | -2.045 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | plateau | sideways | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 5 | -3.07 | -14.67 | -14.67 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | post -2 % | all | 5 | 40.0 | 80.0 | n/d (<8 semaines) | 9 | -1.452 | -18.507 | -12.732 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | post -2 % | bull | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 1 | -1.364 | -1.364 | -1.364 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | post -2 % | bear | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 6 | -0.479 | -9.573 | -3.165 | 14.43 |
| SOL/USD 240m | 2022-06-19 / 2022-09-13 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -4.414 | -8.634 | -8.634 | 14.43 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | plateau | all | 5 | 20.0 | 20.0 | n/d (<8 semaines) | 19 | -1.446 | -25.699 | -24.598 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -3.737 | -3.737 | -3.737 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | plateau | bear | 4 | 25.0 | 25.0 | n/d (<8 semaines) | 14 | -1.202 | -17.042 | -15.938 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.725 | -8.796 | -6.82 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | post -2 % | all | 8 | 25.0 | 25.0 | n/d (<8 semaines) | 9 | -1.71 | -14.592 | -14.592 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | post -2 % | bear | 6 | 33.33 | 16.67 | n/d (<8 semaines) | 7 | -1.374 | -10.38 | -9.439 | -60.632 |
| SOL/USD 240m | 2022-09-17 / 2022-12-12 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -2.886 | -5.69 | -5.69 | -60.632 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | plateau | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 16 | -2.002 | -28.104 | -28.104 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 7 | -0.982 | -10.624 | -7.088 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | plateau | bear | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -2.223 | -10.726 | -10.726 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | plateau | sideways | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 4 | -3.51 | -13.323 | -13.323 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | post -2 % | all | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 10 | -1.613 | -15.334 | -15.334 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | post -2 % | bull | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 3 | 0.565 | -3.87 | 1.544 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -1.98 | -9.472 | -7.782 | 39.611 |
| SOL/USD 240m | 2022-12-16 / 2023-03-12 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -3.303 | -9.586 | -9.586 | 39.611 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | plateau | all | 6 | 16.67 | 50.0 | n/d (<8 semaines) | 21 | -1.444 | -28.67 | -26.704 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 4 | -0.877 | -5.125 | -3.547 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | plateau | bear | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 11 | -1.472 | -17.016 | -15.292 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -1.77 | -10.882 | -10.29 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | post -2 % | all | 6 | 33.33 | 50.0 | n/d (<8 semaines) | 8 | -1.323 | -11.054 | -10.301 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | 1.664 | 0.0 | 1.664 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | post -2 % | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 5 | -1.114 | -6.362 | -5.569 | -24.234 |
| SOL/USD 240m | 2023-03-16 / 2023-06-10 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 2 | -3.338 | -6.565 | -6.565 | -24.234 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | plateau | all | 4 | 25.0 | 50.0 | n/d (<8 semaines) | 15 | -0.972 | -15.169 | -13.976 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | plateau | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -0.984 | -9.458 | -5.912 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | plateau | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 8 | -1.345 | -11.456 | -10.431 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 1 | 2.076 | 0.0 | 2.076 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | post -2 % | all | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 5 | -0.455 | -3.24 | -2.37 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | post -2 % | bull | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -0.069 | -3.222 | -0.283 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -1.033 | -2.966 | -2.093 | 29.297 |
| SOL/USD 240m | 2023-06-14 / 2023-09-08 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 29.297 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | plateau | all | 7 | 28.57 | 71.43 | n/d (<8 semaines) | 15 | -0.772 | -19.635 | -11.435 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | plateau | bull | 5 | 40.0 | 60.0 | n/d (<8 semaines) | 10 | -0.6 | -13.695 | -6.231 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | plateau | bear | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -0.033 | -2.502 | -0.144 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -2.743 | -5.412 | -5.412 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | post -2 % | all | 3 | 0.0 | 100.0 | n/d (<8 semaines) | 6 | -0.495 | -6.867 | -3.07 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | post -2 % | bull | 3 | 0.0 | 100.0 | n/d (<8 semaines) | 5 | -0.789 | -6.867 | -4.003 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | 0.972 | 0.0 | 0.972 | 255.135 |
| SOL/USD 240m | 2023-09-12 / 2023-12-07 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 255.135 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | plateau | all | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 8 | -2.043 | -15.652 | -15.652 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | plateau | bull | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 8 | -2.043 | -15.652 | -15.652 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | post -2 % | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 3 | -1.284 | -7.0 | -3.961 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | post -2 % | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 3 | -1.284 | -7.0 | -3.961 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 89.896 |
| SOL/USD 240m | 2023-12-11 / 2024-03-06 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 89.896 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | plateau | all | 4 | 25.0 | 75.0 | n/d (<8 semaines) | 12 | -2.178 | -23.979 | -23.481 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | plateau | bull | 4 | 25.0 | 75.0 | n/d (<8 semaines) | 12 | -2.178 | -23.979 | -23.481 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | post -2 % | all | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -2.433 | -9.473 | -9.473 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | post -2 % | bull | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 4 | -2.433 | -9.473 | -9.473 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 14.934 |
| SOL/USD 240m | 2024-03-10 / 2024-06-04 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 14.934 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | plateau | all | 11 | 45.45 | 36.36 | [-20.0; 40.0] | 13 | -1.052 | -15.21 | -13.25 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | plateau | bull | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 5 | -0.339 | -7.089 | -1.869 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | plateau | bear | 7 | 42.86 | 28.57 | n/d (<8 semaines) | 8 | -1.497 | -11.598 | -11.598 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | post -2 % | all | 6 | 50.0 | 33.33 | n/d (<8 semaines) | 4 | -2.057 | -8.089 | -8.089 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | post -2 % | bull | 1 | 100.0 | 100.0 | n/d (<8 semaines) | 1 | 2.131 | 0.0 | 2.131 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | post -2 % | bear | 5 | 40.0 | 20.0 | n/d (<8 semaines) | 3 | -3.453 | -10.007 | -10.007 | -17.939 |
| SOL/USD 240m | 2024-06-08 / 2024-09-02 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -17.939 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | plateau | all | 5 | 60.0 | 60.0 | n/d (<8 semaines) | 13 | -1.477 | -19.057 | -17.826 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | plateau | bull | 4 | 75.0 | 50.0 | n/d (<8 semaines) | 7 | -0.798 | -9.565 | -5.612 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 3 | -1.37 | -5.552 | -4.116 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 3 | -3.167 | -9.204 | -9.204 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | post -2 % | all | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.201 | -3.206 | -2.428 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | post -2 % | bull | 2 | 0.0 | 100.0 | n/d (<8 semaines) | 2 | -1.201 | -3.206 | -2.428 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 84.613 |
| SOL/USD 240m | 2024-09-06 / 2024-12-01 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 84.613 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | plateau | all | 6 | 33.33 | 33.33 | n/d (<8 semaines) | 18 | -2.707 | -39.231 | -39.231 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 4 | -3.824 | -14.442 | -14.442 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | plateau | bear | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 9 | -2.336 | -19.345 | -19.345 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 5 | -2.48 | -13.994 | -11.939 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | post -2 % | all | 6 | 16.67 | 16.67 | n/d (<8 semaines) | 9 | -2.992 | -24.058 | -24.058 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -3.803 | -7.461 | -7.461 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | post -2 % | bear | 4 | 25.0 | 25.0 | n/d (<8 semaines) | 5 | -2.443 | -13.852 | -11.77 | -41.627 |
| SOL/USD 240m | 2024-12-05 / 2025-03-01 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -3.555 | -6.988 | -6.988 | -41.627 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | plateau | all | 4 | 75.0 | 0.0 | n/d (<8 semaines) | 16 | -1.391 | -20.975 | -20.473 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | plateau | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 10 | -1.768 | -17.919 | -16.512 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | plateau | bear | 3 | 66.67 | 0.0 | n/d (<8 semaines) | 6 | -0.763 | -5.346 | -4.744 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | plateau | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | post -2 % | all | 5 | 60.0 | 20.0 | n/d (<8 semaines) | 5 | -0.21 | -6.806 | -1.226 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | -0.947 | -3.299 | -1.94 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | post -2 % | bear | 4 | 75.0 | 25.0 | n/d (<8 semaines) | 3 | 0.281 | -3.627 | 0.728 | 15.296 |
| SOL/USD 240m | 2025-03-05 / 2025-05-30 | post -2 % | sideways | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 15.296 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | plateau | all | 7 | 57.14 | 57.14 | n/d (<8 semaines) | 15 | -1.14 | -16.118 | -16.118 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | plateau | bull | 4 | 75.0 | 25.0 | n/d (<8 semaines) | 6 | -0.992 | -6.674 | -5.974 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | plateau | bear | 2 | 50.0 | 100.0 | n/d (<8 semaines) | 4 | -1.051 | -6.424 | -4.235 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | plateau | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 5 | -1.389 | -7.591 | -6.843 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | post -2 % | all | 4 | 50.0 | 50.0 | n/d (<8 semaines) | 3 | -1.728 | -5.144 | -5.144 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | post -2 % | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -3.454 | -3.454 | -3.454 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | post -2 % | bear | 2 | 100.0 | 50.0 | n/d (<8 semaines) | 1 | 0.767 | 0.0 | 0.767 | 30.919 |
| SOL/USD 240m | 2025-06-03 / 2025-08-28 | post -2 % | sideways | 1 | 0.0 | 100.0 | n/d (<8 semaines) | 1 | -2.498 | -2.498 | -2.498 | 30.919 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | plateau | all | 4 | 50.0 | 25.0 | n/d (<8 semaines) | 7 | -0.44 | -5.738 | -3.209 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | plateau | bull | 3 | 66.67 | 33.33 | n/d (<8 semaines) | 4 | -0.614 | -4.102 | -2.538 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | plateau | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -3.16 | -3.16 | -3.16 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | plateau | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 2 | 1.268 | 0.0 | 2.552 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | post -2 % | all | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 3 | -0.009 | -3.16 | -0.103 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 1.631 | 0.0 | 1.631 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 1 | -3.16 | -3.16 | -3.16 | -31.278 |
| SOL/USD 240m | 2025-09-01 / 2025-11-26 | post -2 % | sideways | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | 1.502 | 0.0 | 1.502 | -31.278 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | plateau | all | 9 | 11.11 | 33.33 | n/d (<8 semaines) | 17 | -2.181 | -31.437 | -31.437 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | plateau | bull | 1 | 0.0 | 0.0 | n/d (<8 semaines) | 1 | -2.87 | -2.87 | -2.87 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | plateau | bear | 5 | 0.0 | 40.0 | n/d (<8 semaines) | 11 | -2.464 | -24.134 | -24.134 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | plateau | sideways | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 5 | -1.419 | -7.947 | -6.955 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | post -2 % | all | 5 | 0.0 | 60.0 | n/d (<8 semaines) | 8 | -2.678 | -19.571 | -19.571 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | post -2 % | bull | 0 | n/d | n/d | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | post -2 % | bear | 3 | 0.0 | 66.67 | n/d (<8 semaines) | 5 | -3.3 | -15.447 | -15.447 | -44.743 |
| SOL/USD 240m | 2025-11-30 / 2026-02-24 | post -2 % | sideways | 2 | 0.0 | 50.0 | n/d (<8 semaines) | 3 | -1.641 | -5.421 | -4.878 | -44.743 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | plateau | all | 7 | 71.43 | 14.29 | n/d (<8 semaines) | 20 | -0.5 | -13.504 | -9.86 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | plateau | bull | 2 | 50.0 | 50.0 | n/d (<8 semaines) | 6 | -1.645 | -9.552 | -9.552 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | plateau | bear | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 5 | 0.133 | -2.672 | 0.615 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | plateau | sideways | 3 | 100.0 | 0.0 | n/d (<8 semaines) | 9 | -0.088 | -7.009 | -0.95 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | post -2 % | all | 4 | 100.0 | 25.0 | n/d (<8 semaines) | 9 | 0.267 | -5.317 | 2.301 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | post -2 % | bull | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 0.187 | 0.0 | 0.187 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | post -2 % | bear | 0 | n/d | n/d | n/d (<8 semaines) | 2 | -0.713 | -2.672 | -1.458 | 5.423 |
| SOL/USD 240m | 2026-02-28 / 2026-05-25 | post -2 % | sideways | 3 | 100.0 | 33.33 | n/d (<8 semaines) | 6 | 0.607 | -2.718 | 3.621 | 5.423 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | plateau | all | 7 | 14.29 | 42.86 | n/d (<8 semaines) | 16 | -1.817 | -27.395 | -25.592 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | plateau | bull | 0 | n/d | n/d | n/d (<8 semaines) | 4 | -2.776 | -10.652 | -10.652 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | plateau | bear | 3 | 33.33 | 33.33 | n/d (<8 semaines) | 6 | -0.621 | -6.131 | -3.8 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | plateau | sideways | 4 | 0.0 | 50.0 | n/d (<8 semaines) | 6 | -2.375 | -13.432 | -13.432 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | post -2 % | all | 6 | 33.33 | 16.67 | n/d (<8 semaines) | 3 | -1.155 | -5.341 | -3.496 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | post -2 % | bull | 2 | 50.0 | 0.0 | n/d (<8 semaines) | 0 | n/d | 0.0 | 0.0 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | post -2 % | bear | 1 | 100.0 | 0.0 | n/d (<8 semaines) | 1 | 1.949 | 0.0 | 1.949 | 14.265 |
| SOL/USD 240m | 2026-05-29 / 2026-08-23 | post -2 % | sideways | 3 | 0.0 | 33.33 | n/d (<8 semaines) | 2 | -2.707 | -5.341 | -5.341 | 14.265 |

## Synthèse de toutes les fenêtres hors échantillon

| Paire | Hypothèse | Régime | N apparié | Rebond plateau % | Référence % | IC95 écart (pts) | Fills maker | Espérance nette/trade % |
|---|---|---|---:|---:|---:|---|---:|---:|
| BTC/USDC 60m | plateau | all | 91 | 32.97 | 39.56 | [-19.1; 6.82] | 423 | -1.372 |
| BTC/USDC 60m | plateau | bear | 24 | 33.33 | 41.67 | [-33.33; 18.18] | 123 | -1.43 |
| BTC/USDC 60m | plateau | bull | 37 | 29.73 | 32.43 | [-21.21; 18.92] | 166 | -1.381 |
| BTC/USDC 60m | plateau | sideways | 30 | 36.67 | 46.67 | [-34.48; 16.67] | 134 | -1.308 |
| BTC/USDC 60m | post -2 % | all | 93 | 38.71 | 36.56 | [-12.64; 16.49] | 115 | -1.405 |
| BTC/USDC 60m | post -2 % | bear | 39 | 33.33 | 35.9 | [-23.68; 19.44] | 47 | -1.404 |
| BTC/USDC 60m | post -2 % | bull | 26 | 42.31 | 30.77 | [-19.23; 41.67] | 23 | -1.481 |
| BTC/USDC 60m | post -2 % | sideways | 28 | 42.86 | 42.86 | [-25.93; 30.0] | 45 | -1.369 |
| BTC/USDC 240m | plateau | all | 139 | 43.17 | 45.32 | [-13.85; 9.42] | 336 | -1.485 |
| BTC/USDC 240m | plateau | bear | 37 | 45.95 | 51.35 | [-27.78; 20.0] | 86 | -1.665 |
| BTC/USDC 240m | plateau | bull | 58 | 44.83 | 50.0 | [-18.97; 8.93] | 134 | -1.371 |
| BTC/USDC 240m | plateau | sideways | 44 | 38.64 | 34.09 | [-18.18; 27.91] | 116 | -1.484 |
| BTC/USDC 240m | post -2 % | all | 65 | 43.08 | 40.0 | [-13.33; 18.46] | 86 | -1.591 |
| BTC/USDC 240m | post -2 % | bear | 29 | 37.93 | 41.38 | [-26.92; 20.0] | 35 | -1.895 |
| BTC/USDC 240m | post -2 % | bull | 16 | 50.0 | 31.25 | [-14.29; 47.06] | 21 | -1.386 |
| BTC/USDC 240m | post -2 % | sideways | 20 | 45.0 | 45.0 | [-33.33; 31.58] | 30 | -1.38 |
| ETH/USDC 60m | plateau | all | 54 | 40.74 | 35.19 | [-14.0; 23.64] | 226 | -1.438 |
| ETH/USDC 60m | plateau | bear | 20 | 65.0 | 15.0 | [21.05; 73.68] | 75 | -1.41 |
| ETH/USDC 60m | plateau | bull | 26 | 30.77 | 50.0 | [-46.15; 10.71] | 100 | -1.528 |
| ETH/USDC 60m | plateau | sideways | 8 | 12.5 | 37.5 | [-62.5; 0.0] | 51 | -1.305 |
| ETH/USDC 60m | post -2 % | all | 48 | 43.75 | 31.25 | [-6.38; 31.11] | 62 | -1.277 |
| ETH/USDC 60m | post -2 % | bear | 19 | 57.89 | 26.32 | [0.0; 58.82] | 30 | -1.232 |
| ETH/USDC 60m | post -2 % | bull | 14 | 42.86 | 28.57 | [-23.08; 46.67] | 16 | -1.388 |
| ETH/USDC 60m | post -2 % | sideways | 15 | 26.67 | 40.0 | [-47.37; 21.43] | 16 | -1.253 |
| ETH/USDC 240m | plateau | all | 135 | 40.74 | 35.56 | [-4.65; 15.38] | 310 | -1.484 |
| ETH/USDC 240m | plateau | bear | 51 | 37.25 | 25.49 | [-2.04; 25.49] | 107 | -1.613 |
| ETH/USDC 240m | plateau | bull | 52 | 44.23 | 42.31 | [-14.81; 18.87] | 128 | -1.333 |
| ETH/USDC 240m | plateau | sideways | 32 | 40.62 | 40.62 | [-24.24; 27.59] | 75 | -1.559 |
| ETH/USDC 240m | post -2 % | all | 68 | 42.65 | 39.71 | [-12.68; 19.7] | 95 | -1.626 |
| ETH/USDC 240m | post -2 % | bear | 34 | 35.29 | 35.29 | [-18.92; 19.35] | 48 | -1.89 |
| ETH/USDC 240m | post -2 % | bull | 21 | 57.14 | 42.86 | [-19.05; 45.0] | 30 | -1.345 |
| ETH/USDC 240m | post -2 % | sideways | 13 | 38.46 | 46.15 | [-46.15; 30.77] | 17 | -1.377 |
| SOL/USD 60m | plateau | all | 70 | 40.0 | 47.14 | [-23.08; 9.72] | 355 | -1.36 |
| SOL/USD 60m | plateau | bear | 32 | 40.62 | 37.5 | [-22.58; 28.57] | 140 | -1.302 |
| SOL/USD 60m | plateau | bull | 32 | 37.5 | 62.5 | [-52.94; 0.0] | 146 | -1.37 |
| SOL/USD 60m | plateau | sideways | 6 | 50.0 | 16.67 | n/d | 69 | -1.459 |
| SOL/USD 60m | post -2 % | all | 76 | 42.11 | 46.05 | [-22.22; 15.28] | 139 | -1.309 |
| SOL/USD 60m | post -2 % | bear | 42 | 47.62 | 35.71 | [-20.0; 40.0] | 61 | -1.234 |
| SOL/USD 60m | post -2 % | bull | 23 | 39.13 | 60.87 | [-52.17; 4.55] | 53 | -1.383 |
| SOL/USD 60m | post -2 % | sideways | 11 | 27.27 | 54.55 | [-66.67; 20.0] | 25 | -1.334 |
| SOL/USD 240m | plateau | all | 103 | 38.83 | 41.75 | [-15.15; 10.31] | 260 | -1.464 |
| SOL/USD 240m | plateau | bear | 42 | 33.33 | 35.71 | [-20.0; 16.28] | 102 | -1.33 |
| SOL/USD 240m | plateau | bull | 42 | 47.62 | 45.24 | [-17.39; 20.51] | 101 | -1.446 |
| SOL/USD 240m | plateau | sideways | 19 | 31.58 | 47.37 | [-50.0; 22.22] | 57 | -1.733 |
| SOL/USD 240m | post -2 % | all | 71 | 36.62 | 38.03 | [-20.9; 15.58] | 100 | -1.403 |
| SOL/USD 240m | post -2 % | bear | 30 | 43.33 | 30.0 | [-14.29; 40.74] | 46 | -1.46 |
| SOL/USD 240m | post -2 % | bull | 25 | 40.0 | 44.0 | [-36.0; 26.92] | 30 | -0.905 |
| SOL/USD 240m | post -2 % | sideways | 16 | 18.75 | 43.75 | [-56.25; 6.67] | 24 | -1.916 |

Les intervalles de confiance utilisent 1 000 tirages de semaines entières; ils ne corrigent pas le choix multiple des 6 couples ni l'appariement imparfait.
Les résultats de rebond sont évalués sur les signaux appariés; les fills et l'espérance économique portent sur tous les plateaux éligibles.

## Sources et empreintes

- BTC/USDC 60m : 57400 bougies, 2020-01-08T15:00:00+00:00 à 2026-09-30T23:00:00+00:00, couverture 97.3%; API not_requested.
- /tmp/kraken-history/XBTUSDC_60.csv/XBTUSDC_60.csv SHA256 archive e4b9b841bd54dc70487bd544e81f5473211f05ebdb8d77825a94d529f4fc89d6 CSV e4b9b841bd54dc70487bd544e81f5473211f05ebdb8d77825a94d529f4fc89d6
- BTC/USDC 240m : 14698 bougies, 2020-01-08T12:00:00+00:00 à 2026-09-30T20:00:00+00:00, couverture 99.7%; API not_requested.
- /tmp/kraken-history/XBTUSDC_240.csv/XBTUSDC_240.csv SHA256 archive ac74bcdfeec444f780cf5ca7fdef27139ce9df184b22867f3fa162cd31efa3b1 CSV ac74bcdfeec444f780cf5ca7fdef27139ce9df184b22867f3fa162cd31efa3b1
- ETH/USDC 60m : 56693 bougies, 2020-01-08T15:00:00+00:00 à 2026-09-30T23:00:00+00:00, couverture 96.1%; API not_requested.
- /tmp/kraken-history/ETHUSDC_60.csv/ETHUSDC_60.csv SHA256 archive 5a354b0471ff87bee7f46236992b7b8c344b323eef9eb921c4964bb3b58d5556 CSV 5a354b0471ff87bee7f46236992b7b8c344b323eef9eb921c4964bb3b58d5556
- ETH/USDC 240m : 14678 bougies, 2020-01-08T12:00:00+00:00 à 2026-09-30T20:00:00+00:00, couverture 99.5%; API not_requested.
- /tmp/kraken-history/ETHUSDC_240.csv/ETHUSDC_240.csv SHA256 archive 3b5b9bd2debb11e82fca52d0c42a967556dadaf1891a76d78c71745986f8d0d7 CSV 3b5b9bd2debb11e82fca52d0c42a967556dadaf1891a76d78c71745986f8d0d7
- SOL/USD 60m : 46321 bougies, 2021-06-17T15:00:00+00:00 à 2026-09-30T23:00:00+00:00, couverture 99.9%; API not_requested.
- /tmp/kraken-history/SOLUSD_60.csv/SOLUSD_60.csv SHA256 archive 53dd64334b8dec66103548ac02426b662f07b4fa224d4005234f8f3e66648c2a CSV 53dd64334b8dec66103548ac02426b662f07b4fa224d4005234f8f3e66648c2a
- SOL/USD 240m : 11586 bougies, 2021-06-17T12:00:00+00:00 à 2026-09-30T20:00:00+00:00, couverture 100.0%; API not_requested.
- /tmp/kraken-history/SOLUSD_240.csv/SOLUSD_240.csv SHA256 archive cf04bdd1983c98d377dcb99f8b4cfd28520e29343995f12ebbeb282a2816fd85 CSV cf04bdd1983c98d377dcb99f8b4cfd28520e29343995f12ebbeb282a2816fd85

## Conclusion

**À creuser.** Ces résultats ne démontrent pas une rentabilité générale : pas de carnet ni de simulation de file maker, données corrélées, incertitude et frais importants. La comparaison des marqueurs reste exploratoire. Le drawdown ne porte que sur les trades clôturés, pas les pertes latentes. Aucune intégration sans ADR, accord Grok Bot et validation de Cyril.
