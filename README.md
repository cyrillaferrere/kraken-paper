# 🐙 Kraken Paper

Simulateur de trading crypto **PAPER** (argent fictif) avec de **vrais prix Kraken**, et un tableau de bord en direct.

- 💰 Capital de départ : **6 606,42 USDC** (fictifs).
- 🧠 Les décisions sont prises par Grok Bot aux sessions du matin et du soir.
- ⚙️ Un petit moteur Python tourne **toutes les heures** sur GitHub Actions et exécute ce qui a été décidé.
- 📱 Une notification arrive sur le téléphone (ntfy) à chaque exécution d'ordre.
- 📊 Tableau de bord : site statique sur Netlify, prix en direct depuis l'API publique Kraken.

## ⚠️ PAPER uniquement

- **Aucun ordre réel n'est jamais passé.** Le moteur n'utilise que l'API **publique** de Kraken (`https://api.kraken.com/0/public/...`) : AssetPairs, OHLC, Ticker.
- Aucune clé API Kraken n'est utilisée, ni dans le dépôt ni dans les secrets GitHub.
- Le seul secret est `NTFY_TOPIC` (le nom du canal de notifications).

## Comment ça marche

| Dossier / fichier | Rôle |
| --- | --- |
| `decisions/*.json` | Les décisions de Grok Bot (une par session). |
| `engine/run.py` | Le moteur (Python, bibliothèque standard uniquement). |
| `state/portfolio.json` | **Source de vérité** : cash, positions, ordres ouverts, trades, frais. |
| `state/journal.jsonl` | Journal en ajout seul : décisions, ordres, exécutions, annulations, refus, notes. |
| `state/equity.csv` | Un point par cycle : valeur du portefeuille et valeur de « BTC conservé ». |
| `site/` | Le tableau de bord (HTML/CSS/JS, sans framework). |
| `tests/test_engine.py` | Tests rapides, sans réseau : `python -m unittest -v` |

À chaque cycle (minute 7 de chaque heure, et à chaque push dans `decisions/`), le moteur :

1. charge l'état ;
2. applique les nouvelles décisions (chacune une seule fois, grâce à son `id`) ;
3. récupère les bougies 1 h Kraken depuis la dernière bougie traitée ;
4. rejoue les bougies **clôturées** dans l'ordre :
   - achat limite exécuté si `plus bas <= prix`, vente limite si `plus haut >= prix`, au prix limite, en **maker** ;
   - stop loss exécuté au prix du stop **moins 0,1 %**, en **taker** ;
   - si le stop et le take profit sont touchés dans la même bougie, on retient le **stop** (cas prudent) ;
   - un ordre ne regarde que les bougies qui commencent après sa pose ;
5. applique les frais Kraken Pro palier 1 : **maker 0,40 %**, **taker 0,80 %**, payés en USDC ;
6. refuse tout ordre sans le cash ou la quantité nécessaires (ni levier, ni vente à découvert) ;
7. arrondit aux décimales et minimums de la paire (AssetPairs) ;
8. n'autorise que les paires **cotées en USDC**, en ligne et disponibles en France (`country_code=FR`) ;
9. enregistre un point de valeur, sauvegarde l'état et complète le journal ;
10. envoie une notification ntfy pour chaque exécution.

Si l'API Kraken ne répond pas, l'étape est sautée sans abîmer l'état ; une décision qui n'a pas pu être appliquée est retentée au cycle suivant.

**Référence « BTC conservé »** : le même capital de départ, investi entièrement en BTC au premier cycle (frais maker 0,40 % déduits), puis gardé.

## Format des décisions

Un fichier par session dans `decisions/`, par exemple `decisions/2026-11-14-matin.json` :

```json
{
  "id": "2026-11-14-matin",
  "timestamp": "2026-11-14T08:30:00+01:00",
  "rationale": "BTC rebondit sur 68 000. J'achète un tiers au marché et je place un achat plus bas, avec stop et objectif.",
  "actions": [
    { "type": "market_buy", "pair": "BTC/USDC", "quote_amount": 1000, "stop_loss": 63000 },
    { "type": "place_limit", "pair": "ETH/USDC", "side": "buy", "quote_amount": 800,
      "price": 1850, "stop_loss": 1700, "take_profit": 2100 },
    { "type": "place_limit", "pair": "XBTUSDC", "side": "sell", "qty": 0.005,
      "price": 74000, "stop_loss": 64000 },
    { "type": "cancel", "order_id": "O0003" },
    { "type": "note", "text": "Marché nerveux, je reste à 70 % en USDC." }
  ]
}
```

| Action | Champs |
| --- | --- |
| `place_limit` | `pair`, `side` (`buy`/`sell`), `qty` **ou** `quote_amount` (USDC), `price`, option `stop_loss`, option `take_profit` |
| `market_buy` | `pair`, `qty` ou `quote_amount`, option `stop_loss`, `take_profit` |
| `market_sell` | `pair`, `qty` ou `quote_amount` |
| `cancel` | `order_id` (ex. `O0003`) |
| `note` | `text` |

Précisions :
- Paires : `BTC/USDC`, `XBTUSDC`, `ETH/USDC`… (USDC uniquement).
- Un **achat** limite avec `stop_loss` / `take_profit` : une fois exécuté, le moteur crée automatiquement l'ordre de sortie (vente au take profit **ou** au stop, le premier touché).
- Une **vente** limite avec `stop_loss` = ordre « OCO » : vente au prix limite (objectif) ou au stop.
- Un ordre limite déjà exécutable au cours actuel est refusé : utiliser `market_buy` / `market_sell`.
- Un fichier peut aussi contenir une **liste** de décisions. Chaque `id` doit être unique.

## Notifications sur le téléphone (ntfy)

1. Installer l'app gratuite **ntfy** (iOS / Android).
2. Appuyer sur **+**, garder le serveur `ntfy.sh`, et s'abonner au canal donné par Grok Bot (de la forme `kraken-paper-xxxxxxxxxxxx`).
3. C'est tout : chaque exécution d'ordre envoie un message du type
   « Kraken Paper : achat BTC 0,0072 à 65 000 USDC exécuté (limite) ».

Le nom du canal est secret (quiconque le connaît peut lire les notifications) : ne pas le publier.

## Lancer en local

```bash
python -m unittest -v      # tests sans réseau
python engine/run.py       # un cycle (modifie state/)
```
