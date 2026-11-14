# Kraken Paper : document de reprise

> À lire en premier si tu reprends le projet (GPT, un autre agent, ou un humain).
> Dernière mise à jour : 14/11/2026, version 0.1.0.

## 1. Le projet en bref

Kraken Paper est un **simulateur de trading crypto en argent fictif** (PAPER) qui utilise les **vrais prix Kraken**.
But : apprendre le plus possible, le plus vite possible, sur des styles de trading actifs, avec des frais réalistes,
une justification écrite pour chaque décision et un bilan hebdomadaire des leçons.

- Propriétaire : **Cyril Laferrère**.
- Capital de départ : **6 606,42 USDC** fictifs, le 13/11/2026 à 22:56 (heure de Paris).
- Aucune limite de perte : la simulation ne s'arrête jamais.
- **Aucun ordre réel n'est jamais passé.** Uniquement l'API publique Kraken.

| Lien | Rôle |
| --- | --- |
| https://github.com/cyrillaferrere/kraken-paper | Dépôt public (code, état, décisions) |
| https://kraken-paper.netlify.app | Tableau de bord **prod** (branche `main`) |
| https://preprod--kraken-paper.netlify.app | Tableau de bord **préprod** (branche `preprod`, déploiement non production du même site) |
| `https://feature-<nom>--kraken-paper.netlify.app` | Aperçu d'une branche `feature/<nom>` |
| https://github.com/cyrillaferrere/kraken-paper/actions | Cycles du moteur |

## 2. Qui fait quoi

| Qui | Rôle |
| --- | --- |
| **Grok Bot** (assistant « Kraken - Bot Crypto ») | Chef de projet technique et **seul décideur de trading** : sessions de gestion, fichiers `decisions/`, bilan hebdo. Relit toutes les PR. |
| **GPT** | Maintenance et évolutions du code (dash, moteur, tests) **par PR** vers `preprod`. Ne touche jamais `decisions/` ni `state/`. |
| **Cyril** | Teste la préprod, **valide chaque mise en prod**, valide toute évolution du moteur. |
| Dev CASCIE | Une relecture ponctuelle du projet, pas de rôle permanent. |

Si Grok Bot n'est pas disponible : les ordres déjà posés continuent d'être gérés par le moteur (stops et objectifs
compris). Personne d'autre ne prend de décision de trading sans l'accord explicite de Cyril.

## 3. Architecture

```
 Grok Bot (session)                    GitHub (dépôt public)                       Netlify (statique)
 ───────────────────                   ─────────────────────                       ──────────────────
 lit l'état, analyse le      push      decisions/<id>.json                         site/ (HTML/CSS/JS)
 marché (API publique) ────────────▶   │                                           │
                                       ▼                                           │ lit l'état sur main
                              GitHub Actions « engine »                            │ via l'API GitHub
                              (minute 7 de chaque heure,  ── commit ──▶ state/ ◀───┘ (repli raw)
                               + à chaque push decisions/)                         │
                                       │                                           │ prix en direct et bougies :
                                       ▼                                           ▼ API publique Kraken
                              ntfy.sh ──▶ téléphone de Cyril
```

- **Un seul site Netlify** (`kraken-paper`) : la prod est son déploiement de production, la préprod et les features sont
  des déploiements non production avec un alias (`preprod--`, `feature-<nom>--`). Un futur stockage ou des variables
  d'environnement seront donc au même endroit.
- **L'état vit uniquement sur `main`, et il n'est écrit que par le moteur** (workflow `engine`). Les décisions
  (`decisions/`) ne sont écrites que par Grok Bot, directement sur `main`. Prod, préprod et features lisent le même état de
  `main` via l'API GitHub : **le dash est en lecture seule**, il n'écrit jamais rien.
- **Une release ne livre que du code.** Les branches `preprod` et `feature/*` ne modifient jamais `state/` ni
  `decisions/` : le contrôle CI `guard-state` bloque toute PR ou tout push qui le ferait, et `scripts/release.sh` refuse
  une fusion vers `main` qui toucherait ces dossiers. Passer la préprod en prod ne peut donc pas écraser le portefeuille
  ni les ordres.
- Le moteur ne tourne **que depuis `main`** (cron GitHub = branche par défaut ; garde-fou `if:` dans le workflow).

## 4. Fichiers

| Chemin | Rôle |
| --- | --- |
| `engine/run.py` | Moteur, Python stdlib. Un appel = un cycle. |
| `tests/test_engine.py` | Tests du moteur, sans réseau : `python -m unittest -v`. |
| `tests/site/*.test.js` | Tests du calcul des ordres du dash : `node --test tests/site/*.test.js`. |
| `.github/workflows/engine.yml` | Cycle horaire + sur push `decisions/**` + manuel. |
| `decisions/*.json` | Décisions de Grok Bot, une par session, appliquées une seule fois par `id`. |
| `state/portfolio.json` | **Source de vérité** : cash, positions, ordres ouverts, trades, frais, décisions traitées. |
| `state/journal.jsonl` | Journal en ajout seul (décisions, ordres, exécutions, refus, notes, alertes). |
| `state/equity.csv` | Un point par cycle : valeur du portefeuille et de « BTC conservé ». |
| `site/index.html`, `style.css` | Tableau de bord. |
| `site/app.js` | Lecture de l'état, KPI, positions, ordres (calcul perte/gain), trades, journal, courbe, version. |
| `site/markets.js` | Graphiques en bougies, indicateurs (MA, RSI, ATR), tableau des marqueurs. |
| `site/version.json` | **Généré au déploiement** par `scripts/deploy.sh` (absent du dépôt). |
| `scripts/deploy.sh` | Déploiement prod / préprod / feature sur le site unique. |
| `scripts/release.sh` | Mise en prod du code (preprod → main) avec garde-fou state/decisions. |
| `scripts/netlify-build.sh` | Commande de build Netlify : écrit `version.json` s'il manque. |
| `.github/workflows/guard-state` (`guard.yml`) | Échoue si une PR ou une branche autre que main modifie `state/` ou `decisions/`. |
| `VERSION`, `CHANGELOG.md` | Version SemVer et historique. |
| `docs/` | Ce document, RUNBOOK, CONTRIBUTING, décisions techniques (ADR). |
| `.ntfy_topic` | Canal ntfy, **local uniquement** (gitignoré), copie du secret Actions `NTFY_TOPIC`. |

## 5. Règles du moteur (résumé)

À chaque cycle : charger l'état → appliquer les nouvelles décisions (une fois par `id`) → rejouer les bougies 1 h
**clôturées** depuis la dernière traitée → enregistrer un point de valeur → sauvegarder → notifier les exécutions.

- **Achat limite** exécuté si le plus bas de la bougie ≤ prix limite, au prix limite, **maker 0,40 %**.
- **Vente limite / objectif** exécutée si le plus haut ≥ prix, au prix, **maker 0,40 %**.
- **Stop** exécuté si le plus bas ≤ stop, au **stop − 0,1 %**, **taker 0,80 %**.
- **Stop et objectif dans la même bougie : le stop gagne** (cas prudent).
- **Ordre au marché** : dernier prix ± 0,1 %, taker 0,80 %.
- Un ordre ne regarde que les bougies qui **commencent après sa pose** (`active_from`).
- Un achat limite avec `stop_loss` / `take_profit` crée, une fois exécuté, l'ordre de sortie (OCO).
- Refus si cash ou quantité insuffisants (ni levier ni vente à découvert), si l'ordre limite est déjà exécutable
  (utiliser un ordre au marché), si la paire n'est pas en USDC ou pas disponible en France (`country_code=FR`).
- Frais arrondis à 6 décimales, quantités aux décimales de la paire (AssetPairs).
- Si l'API Kraken ne répond pas : étape sautée, état intact, décision retentée au cycle suivant.
- Référence « BTC conservé » : tout le capital en BTC au premier cycle (maker 0,40 %), puis gardé.

## 6. Contrat des décisions (`decisions/<id>.json`)

```json
{"id": "2026-11-14-matin", "timestamp": "2026-11-14T08:30:00+01:00",
 "rationale": "Pourquoi, en clair : tendance, niveaux, marqueurs utilisés, risque.",
 "actions": [
  {"type": "market_buy", "pair": "BTC/USDC", "quote_amount": 1000, "stop_loss": 63000},
  {"type": "place_limit", "pair": "ETH/USDC", "side": "buy", "quote_amount": 800, "price": 1850, "stop_loss": 1700, "take_profit": 2100},
  {"type": "place_limit", "pair": "XBTUSDC", "side": "sell", "qty": 0.005, "price": 74000, "stop_loss": 64000},
  {"type": "cancel", "order_id": "O0003"},
  {"type": "note", "text": "Leçon à vérifier : ..."}]}
```

| Action | Champs |
| --- | --- |
| `place_limit` | `pair`, `side` (`buy`/`sell`), `qty` **ou** `quote_amount` (USDC), `price`, option `stop_loss`, option `take_profit` (achat seulement) |
| `market_buy` | `pair`, `qty` ou `quote_amount`, option `stop_loss`, `take_profit` |
| `market_sell` | `pair`, `qty` ou `quote_amount` |
| `cancel` | `order_id` |
| `note` | `text` |

- `id` **unique et jamais réutilisé** (convention `AAAA-MM-JJ-HHhMM`). Un fichier peut contenir une liste.
- Une action refusée est journalisée (`rejected`) sans bloquer les autres.
- `quote_amount` d'un achat inclut les frais : quantité = montant / (prix × (1 + frais)).

## 7. Comment se passe une session de Grok Bot

Environ toutes les 5 heures (routine de Grok Bot) :
1. Lire `state/` sur `main` (positions, ordres, dernier cycle, erreurs).
2. Analyser le marché avec l'API publique Kraken : tendance (MA20/MA50 en 4 h et 1 j), niveaux, RSI, ATR, volume, force vs BTC.
3. Écrire `decisions/<id>.json` avec une justification claire, commit `decision: <id>`, push sur `main`
   (déclenche un cycle immédiat).
4. Vérifier dans Actions puis `state/journal.jsonl` que la décision est appliquée (ou lire la raison des refus).
5. Envoyer un court récapitulatif en français à Cyril.

Chaque semaine : bilan des leçons (quels styles et quels marqueurs ont fonctionné, frais payés, écart vs BTC conservé).

## 8. Environnements et cycle de livraison

`feature/<nom>` → PR vers `preprod` → déploiement préprod (alias) → **Cyril teste** → `scripts/release.sh X.Y.Z` (preprod → `main`, code seulement) →
déploiement prod **après l'accord de Cyril** → tag `vX.Y.Z`. Détails : [RUNBOOK](RUNBOOK.md), [CONTRIBUTING](CONTRIBUTING.md).

## 9. Ce qu'il ne faut jamais faire

- Passer un ordre réel, utiliser un endpoint privé Kraken, mettre une clé Kraken dans le dépôt ou dans les secrets.
- Retirer ou transférer des fonds (interdit en toutes circonstances).
- Modifier `state/` à la main, sauf la procédure de récupération du RUNBOOK.
- Écrire dans `decisions/` si on n'est pas Grok Bot (ou sans l'accord explicite de Cyril).
- Déployer la prod sans l'accord de Cyril.
- Toucher un autre dépôt ou site (en particulier `planning-com-cascie`), ou le dossier `/workspace/kraken-jeu`.

## 10. Où en est le projet

Voir [CHANGELOG](../CHANGELOG.md). Idées en attente : stop suiveur, page de bilan hebdo, historique des décisions
dans le dash, alertes ntfy plus fines.
