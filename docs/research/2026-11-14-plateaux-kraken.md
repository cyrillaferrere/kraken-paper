# Recherche R-01 — plateaux pré-rebond sur Kraken spot

**Pré-enregistrement du 14 novembre 2026 — paramètres figés avant calcul.**

**Addendum après exécution :** le backtest officiel Kraken spot a été exécuté avec succès, sur BTC/USDC, ETH/USDC et SOL/USD (repli USD faute de trois ans en SOL/USDC) entre 2020/2021 et le 30 septembre 2026. Les résultats vérifiés, intervalles de confiance, coûts, fenêtres et empreintes sont dans [le rapport de résultats](2026-11-14-resultats-kraken-spot.md) et le [manifeste d'intégrité](2026-11-14-source-manifest-kraken.json). **Verdict : abandonner le plateau comme déclencheur d'achat autonome dans ces conditions** : pas d'avantage prédictif global établi, espérance nette négative sur chaque configuration. Aucune donnée de moteur modifiée.

## Objectif et provenance

Reproduire l'étude exploratoire menée sur des contrats perpétuels BTC/USDT et ETH/USDT, **sans réutiliser leurs taux de succès comme résultats Kraken**. Univers : BTC/USDC, ETH/USDC, SOL/USDC, repli explicite sur USD si la couverture USDC est inférieure à 3 ans ou à 95 % de bougies attendues. Horizons : **1 h et 4 h**, au moins 1 095 jours observés. Marché **spot Kraken**, jamais perpetual ou Binance.

Source primaire : [archives OHLCVT Kraken](https://support.kraken.com/articles/360047124832-downloadable-historical-ohlcvt-open-high-low-close-volume-trades-data). Dernier jeu complet indiqué par la page anglaise actualisée en novembre : jusqu'au **30 septembre 2026**. ZIP multi-parties d'environ 2 Go, fichiers CSV sans en-tête avec `timestamp,open,high,low,close,volume,trades` et `MANIFEST.json`. Récupération publique complémentaire possible via `/0/public/OHLC` : **720 bougies maximum** ; la dernière bougie, encore ouverte, est exclue. Au 14/11/2026, l'API 1 h ne remonte pas jusqu'au 1er octobre : **ne pas inventer le trou de début octobre**. Si l'extension est discontinue, garder l'historique clôturé au 30/09 et signaler le manque.

L'environnement local n'autorisait pas le téléchargement direct des archives volumineuses Kraken. Un extracteur séparé (`scripts/fetch_kraken_ohlcvt_ranges.py`) a ensuite permis leur lecture par plages HTTP depuis GitHub Actions, sans récupérer l'intégralité du ZIP. **Le SHA-256 global de l'archive n'a pas été recalculé** ; les CSV extraits ont été vérifiés au moyen du CRC32 du ZIP et d'une empreinte SHA-256 propre. Voir les manifestes et le rapport d'exécution. Ne pas réécrire rétroactivement les paramètres de ce pré-enregistrement.

## Paramètres figés avant étude

| Élément | Règle fixée |
|---|---|
| ATR | TR moyen simple, 14 bougies, seulement à la clôture |
| Plateau 4 h | Range des 16 dernières bougies au percentile <= 35 des 180 précédentes, ATR/prix au percentile <= 50 des 180 précédentes, variation de clôture <= 2 ATR |
| Plateau 1 h | Range 24 bougies au percentile <= 35 des 360 précédentes, ATR/prix au percentile <= 50 des 360 précédentes, variation de clôture <= 2 ATR |
| Anti-doublon | Espacement d'au moins 48 h entre plateaux |
| Hypothèse ciblée | Baisse de **2 % ou plus** sur les **96 h précédant le début du plateau** |
| Étiquette de rebond | +1,5 ATR avant -1 ATR dans les 48 h suivantes ; stop prioritaire si deux niveaux atteints dans une même bougie |
| Autres résultats | Baisse d'abord = échec ; aucun niveau = indécis ; barre manquante = non évalué |
| Régime | Tendance 30 jours : hausse > +5 %, baisse < -5 %, sinon latérale |
| Volatilité appariée | Tertile causal du percentile ATR/prix, à la même date du signal |
| Référence | Point **non-plateau** apparié par actif, période de test, régime, tertile de volatilité et statut de baisse préalable, sans réutiliser un contrôle dans les 48 h |
| Validation | Windows progressives 90 jours, 365 jours d'historique initial, purge 48 h autour des frontières ; critères non recalibrés sur le test |
| Incertitude | Bootstrap déterministe 1 000 réplications par **blocs de 7 jours** sur les différences plateau / contrôle ; insuffisant si moins de 8 blocs |
| Marqueurs complémentaires | Maintien du support, décélération, clôtures fortes, volume en retrait, récupération RSI ; score d'au moins 3/5 ; **à écarter s'il n'améliore pas la validation** |

## Exécution PAPER économique séparée

Ordre d'entrée limite **maker** à `close_signal - 0,25 ATR`, actif jusqu'à 12 heures après la clôture du signal ; pas de fill si la bougie ouvre sous la limite (car le statut maker serait incertain). Pas de garantie de remplissage de file d'attente ni de simulation du carnet. Après fill : stop `entry - 1 ATR`, objectif `entry + 1,5 ATR`, liquidation à 48 heures après le signal au plus tard. Si stop + objectif dans la même bougie, stop prioritaire. Si ouverture sous le stop : prix d'ouverture défavorable. Frais de l'entrée **0,40 % maker**, sortie **0,80 % taker**, glissement de la sortie **0,10 %**. Rendement net : `(prix_sortie × 0,999 × 0,992)/(prix_entrée × 1,004) - 1`. Pas de levier ni short.

Statistiques attendues par actif, régime, horizon et fenêtre : signaux, fills, rebonds, appariements, IC 95 % par blocs, taux de faux positifs, espérance nette/trade, capital fictif cumulatif à exposition pleine sur trades non chevauchants, pire drawdown **sur trades clôturés**, et buy & hold sur la même fenêtre (entrée maker, position marquée à la clôture sans frais de liquidation). Les signaux BTC/ETH/SOL sont corrélés : **ne pas additionner** les significativités.

## Limites à ne pas masquer

L'étiquette +1,5/-1 ATR est une **question de prédiction** ; elle ne correspond pas directement au résultat d'une entrée limite décalée. Le maker fill est supposé si la limite est touchée depuis au-dessus et reste optimiste : file d'attente, spread, frais variables et impact non simulés. Le benchmark buy & hold reste fortement tributaire du régime. Le bootstrap par semaines et les six couples actif/horizon ne corrigent pas la multiplicité. Les moyennes de profit ne prouvent pas la stabilité du taux de réussite.

Les fichiers OHLCVT **ne contiennent ni CVD, ni OFI, ni carnet**, donc aucune preuve d'absorption institutionnelle ou d'intentions d'acheteurs ne peut en être tirée.

## Reproduction

1. Télécharger les archives officielles Kraken (full multipart assemblé en ZIP, plus incréments), sans les committer.
2. Vérifier leurs empreintes publiées, et conserver leurs `MANIFEST.json`. La commande analyse directement les ZIP et archive les SHA-256 dans le résultat.
3. Lancer :

```bash
python -m unittest discover -s tests -p 'test_research_plateaux.py' -v
python scripts/research_plateaux.py --archives /chemin/archives --api-recent --output /tmp/kraken-plateaux.json
```

La commande écrit `/tmp/kraken-plateaux.json` et `/tmp/kraken-plateaux.md`. Utiliser `--api-recent` seulement sur un poste ayant accès au réseau : les données anciennes proviennent toujours des ZIP, pas de l'API restreinte aux dernières bougies.

## Verdict préalable, rédigé avant acquisition des données (historique)

**À creuser — pas encore validé et non exploitable opérationnellement.** Le résultat exploratoire obtenu sur des contrats perpétuels externes n'est pas un résultat Kraken spot. **Aucun calcul Kraken 3 ans et aucune espérance nette Kraken n'ont été réalisés ici.**

Si le backtest officiel apporte un avantage robuste en walk-forward, en sous-périodes et **après frais**, proposer un ADR distinct à Grok Bot et Cyril. **Ne pas modifier `engine/`, `state/`, `decisions/` ni déployer ou fusionner sans leur décision.**
