# 🐙 Kraken Paper

Simulateur de trading crypto **PAPER** (argent fictif) avec de **vrais prix Kraken**, et un tableau de bord en direct.

- 💰 Capital de départ : **6 606,42 USDC** (fictifs).
- 🧠 Les décisions sont prises par Grok Bot lors de ses sessions (environ toutes les 5 heures).
- ⚙️ Un petit moteur Python tourne **toutes les heures** sur GitHub Actions et exécute ce qui a été décidé.
- 📱 Une notification arrive sur le téléphone (ntfy) à chaque exécution d'ordre.
- 📊 Tableau de bord : site statique sur Netlify, prix en direct depuis l'API publique Kraken.

## 📚 Documentation

| Document | Pour quoi |
| --- | --- |
| [docs/HANDOFF.md](docs/HANDOFF.md) | **Reprendre le projet** : architecture, flux de données, règles du moteur, contrat des décisions, rôles |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Déployer prod / préprod, lancer un cycle, réparer un cycle, changer le canal ntfy, problèmes fréquents |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Branches, PR, versions, commits, tests, règles à ne jamais enfreindre |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Choix techniques et leurs raisons (ADR) |
| [docs/LESSONS.md](docs/LESSONS.md) | Leçons apprises (affichées dans le dash) |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions (version courante dans `VERSION`) |

Un seul site Netlify, `kraken-paper` : **prod** https://kraken-paper.netlify.app (`main`) · **préprod** https://preprod--kraken-paper.netlify.app (`preprod`, déploiement non production) · features : `https://feature-<nom>--kraken-paper.netlify.app`.

**L'état vit uniquement sur `main` et n'est écrit que par le moteur ; le dash est en lecture seule ; une release ne livre que du code** (voir [RUNBOOK](docs/RUNBOOK.md#mettre-en-prod-une-release)).

## ⚠️ PAPER uniquement

- **Aucun ordre réel n'est jamais passé.** Le moteur n'utilise que l'API **publique** de Kraken (`https://api.kraken.com/0/public/...`) : AssetPairs, OHLC, Ticker.
- Aucune clé API Kraken n'est utilisée, ni dans le dépôt ni dans les secrets GitHub.
- Les seuls secrets sont `NTFY_TOPIC` (canal de notifications, secret GitHub Actions) et `GITHUB_DISPATCH_TOKEN` (jeton GitHub pour la fonction planifiée Netlify). Aucun des deux n'est dans le dépôt.

## Comment ça marche

| Dossier / fichier | Rôle |
| --- | --- |
| `decisions/*.json` | Les décisions de Grok Bot (une par session). |
| `engine/run.py` | Le moteur (Python, bibliothèque standard uniquement). |
| `state/portfolio.json` | **Source de vérité** : cash, positions, ordres ouverts, trades, frais. |
| `state/journal.jsonl` | Journal en ajout seul : décisions, ordres, exécutions, annulations, refus, notes. |
| `state/equity.csv` | Un point par cycle : valeur du portefeuille et valeur de « BTC conservé ». |
| `site/` | Le tableau de bord (HTML/CSS/JS, sans framework). |
| `tests/test_engine.py`, `tests/test_reservations.py` | Tests rapides, sans réseau : `python -m unittest -v` |

À chaque cycle (fonction planifiée Netlify à la minute 9 UTC une fois la v0.2.0 en prod, cron GitHub à la minute 7 UTC en secours, et à chaque push dans `decisions/`), le moteur :

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
python -m unittest -v                    # moteur, sans réseau
node --test tests/site/*.test.js         # fonctions du dash (ordres, exposition, calendrier, markdown…)
node --test tests/functions/*.test.mjs   # fonction planifiée Netlify (fetch mocké)
python engine/run.py       # un cycle (modifie state/)
```

## Tableau de bord : graphiques et marqueurs

- **Marchés** : bougies 5 min / 15 min / 30 min / 1 h / 4 h / 1 j (graphique rafraîchi toutes les 30 s en 5 min, 60 s en 15 min et 1 h, 90 s en 30 min, 2 min en 4 h, 5 min en 1 j ; cache de 1 à 15 min), moyennes mobiles 20 et 50, volume et RSI 14, pour les cryptos détenues, celles qui ont un ordre et une liste de suivi de 14 paires USDC ouvertes en France, choisies par volume 24 h (hors stablecoins et memecoins) : BTC, ETH, SOL, XRP, LINK, AVAX, ADA, XDC, LTC, BNB, DOGE, TON, DOT, BCH. Le site revérifie chaque paire avec `AssetPairs?country_code=FR` et écarte celles qui ne sont plus disponibles. Sur le graphique : ordres limites, stops et objectifs en lignes pointillées avec leur nom posé à gauche (petite étiquette de prix seule sur l'échelle), prix de revient (PRU), et flèches ▲ / ▼ des exécutions lues dans `journal.jsonl`. Le bouton « Ordres » masque ou affiche ces lignes (choix gardé dans le navigateur).
- **Suivi** : exposition (investi, réservé, cash libre, perte si tous les stops sont touchés), prochains passages (cycle du moteur, session estimée), performance par jour vs BTC conservé, alertes de proximité sous 1 % dans les ordres, fil des décisions et leçons (`docs/LESSONS.md`).
- **Marqueurs** : prix, variation 24 h, tendance (prix vs MA20 et MA50 en 4 h et en 1 j), RSI 14 en 4 h, volatilité (ATR 14 journalier en % du prix), force relative vs BTC (performance 7 jours moins celle du BTC). Chaque couleur est doublée d'un texte ou d'une flèche.
- Tout est calculé dans le navigateur (`site/markets.js`) avec l'**API publique** Kraken (`OHLC`, `AssetPairs?country_code=FR`, `Ticker`) : aucune clé, aucun coût. Les requêtes passent en file (une toutes les 450 ms) avec un cache de 3 à 15 min, pour rester sous la limite publique. Le tableau se remplit au fil des réponses (environ 20 s pour 14 cryptos au premier chargement) ; chaque ligne n'est animée qu'à sa première apparition.
- Bibliothèque : **TradingView Lightweight Charts 5.3.0** (Apache 2.0) par CDN jsDelivr, version figée et contrôle d'intégrité SRI. Choisie car légère (~200 ko), rapide sur mobile, et gère nativement bougies, plusieurs volets (prix, volume, RSI), lignes de prix et marqueurs, sans animation ni lissage des cours. Le logo TradingView affiché sur le graphique est l'attribution demandée par la licence. Si le CDN ne répond pas, le tableau des marqueurs continue de fonctionner.

### Choix d'animation (skill kraken-motion-ux)

- Jetons communs (`--motion-fast` 140 ms, `--motion-normal` 200 ms, `--motion-panel` 240 ms, décalage 30 ms plafonné), seulement `opacity` et `transform`.
- Les panneaux entrent une seule fois au premier affichage, jamais au rafraîchissement des prix (15 s) ou de l'état (2 min).
- Une valeur réellement modifiée (KPI, prix du tableau) reçoit un bref voile violet neutre de 220 ms qui s'efface ; la vraie valeur est affichée immédiatement, sans interpolation, et la couleur ne suggère ni gain ni perte.
- Boutons et puces : pression `scale(.97)`. Onglets 5 min à 1 j : curseur qui glisse en 200 ms (`translateX`), navigation au clavier par flèches.
- Pendant le chargement d'une autre période ou crypto, le graphique passe à 55 % d'opacité, reflet d'une vraie requête en cours.
- Les graphiques ne sont jamais animés : les bougies sont celles de Kraken, la dernière est marquée « en cours ». Les alertes d'erreur s'affichent sans animation.
- `prefers-reduced-motion: reduce` coupe tous ces mouvements ; le tableau de bord reste entièrement utilisable.

### Lecture de l'état par le dash

Le dash lit `state/portfolio.json`, `state/equity.csv` et `state/journal.jsonl` via l'**API GitHub** (`/contents/...?ref=<sha>`, en-tête `Accept: application/vnd.github.raw`, sans jeton), pour éviter le cache d'environ 5 min de raw.githubusercontent.com. Toutes les 2 min, il demande seulement le sha du dernier commit de `main` avec `If-None-Match` : une réponse 304 ne compte pas dans la limite de 60 requêtes/h par IP, et les trois fichiers ne sont relus que si le sha a changé. Si l'API répond 403/429, si la limite est épuisée (`X-RateLimit-Remaining`) ou en cas d'erreur, le dash repasse sur raw.githubusercontent.com, affiche « Source de secours » dans la barre d'état, et réessaie l'API après la remise à zéro de la limite (au moins 10 min).
