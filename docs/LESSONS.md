# Leçons de Kraken Paper

Ce que la simulation et les recherches nous apprennent, entrée par entrée, la plus récente en haut. Chaque leçon dit d'où elle vient, ce qui est prouvé ou non, et ce qu'on en fait. Ce fichier est affiché dans la section « Leçons » du dashboard (rendu markdown simple, HTML échappé).

Format d'une entrée : date (Paris), titre, source, constat, conclusion, suite.

---

## 15/11/2026 · Verdict de l'étude des plateaux (close)

- **Source** : PR #42, backtest sur bougies Kraken 2020–2026.
- **Constat** : acheter sur un plateau seul a une espérance nette de frais négative, environ −1,3 à −1,6 % par trade.
- **Conclusion** : un plateau n'est pas un signal d'achat à lui seul. Il faut un plancher solide, au moins deux marqueurs de rebond et une confirmation (pic de volume ou clôture au-dessus de la MA20).
- **Suite** : étude close sur décision de Cyril (15/11), pas de recherche supplémentaire ni de changement du moteur.

## 14/11/2026 · Triple stop BTC, ETH, SOL dans la même purge

- **Source** : journal du 14/11, stops touchés entre 21h50 et 22h15 (total −145 USDC, −2,2 %, contre −7,1 % pour le BTC conservé).
- **Constat** : les trois positions étaient un seul pari crypto corrélé ; les achats limites ont été posés dans un marché qui chutait, sans confirmation de rebond ; un stop BTC a été resserré pendant la baisse.
- **Conclusion** : traiter BTC, ETH, SOL et les altcoins comme un seul risque et limiter l'exposition totale ; ne pas acheter un marché qui chute sans marqueurs de rebond ; ne jamais resserrer un stop en pleine baisse ; placer les stops sous les vrais planchers, pas juste sous le cours.
- **Suite** : règles appliquées dans les sessions de gestion (plan à trois poches du 15/11).

## 14/11/2026 · Repli de 2-3 % sous les plus bas en marché survendu

- **Source** : recherche GPT du 14/11, demandée après la note de la décision `2026-11-13-23h55` (« en marché survendu, un repli supplémentaire de 2-3 % sous les plus bas récents se produit-il avant un rebond ? »).
- **Constat** : aucune étude publiée ne montre de façon solide qu'un repli de 2-3 % sous les plus bas récents se produit régulièrement avant un rebond en crypto. Pas de preuve, ni pour ni contre.
- **RSI < 30** : c'est un modulateur d'exécution (acheter plus progressivement, plus bas, plus petit), **pas un détecteur de creux**. Un marché peut rester survendu longtemps.
- **Conclusion** : fractionner les entrées (plusieurs ordres limites étagés plutôt qu'un seul niveau), avec stop et objectif sur chaque morceau.
- **Suite** : backtest à faire sur l'historique Kraken (bougies 4 h et 1 j) avant d'en faire une règle.
