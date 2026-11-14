# Kraken Paper : document de reprise

> À lire en premier si tu reprends le projet (GPT, un autre agent, ou un humain).
> Dernière mise à jour : 14/11/2026, version 0.2.0.

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
 Grok Bot (session)                    GitHub (dépôt public)                       Netlify (site unique)
 ───────────────────                   ─────────────────────                       ──────────────────
 lit l'état, analyse le      push      decisions/<id>.json                         site/ (HTML/CSS/JS)
 marché (API publique) ────────────▶   │                                           │ lit l'état sur main
                                       ▼                                           │ via l'API GitHub (repli raw)
                              GitHub Actions « engine »   ── commit ──▶ state/ ◀───┘
                              déclenché par :                                      │
                               • fonction Netlify, min. 9 UTC (principal, prod)    │ engine-trigger
                               • cron GitHub, min. 7 UTC (secours)                 │ (schedule, prod seulement)
                               • push dans decisions/     ◀── workflow_dispatch ───┘
                               • lancement manuel
                                       │
                                       ▼
                              ntfy.sh ──▶ téléphone de Cyril
 Le dash lit aussi les prix et bougies sur l'API publique Kraken.
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
- Le moteur ne tourne **que depuis `main`** (garde-fou `if:` dans le workflow ; les déclencheurs, y compris la fonction
  Netlify, demandent toujours `ref: main`). Déclencheur principal : fonction planifiée Netlify `engine-trigger`
  (minute 9 UTC), qui n'est exécutée que sur le déploiement de production. Secours : cron GitHub (minute 7 UTC).

## 4. Fichiers

| Chemin | Rôle |
| --- | --- |
| `engine/run.py` | Moteur, Python stdlib. Un appel = un cycle. |
| `tests/test_engine.py` | Tests du moteur, sans réseau : `python -m unittest -v`. |
| `tests/test_reservations.py` | Tests de réservation du cash et des quantités. |
| `tests/site/*.test.js` | Tests du calcul des ordres du dash : `node --test tests/site/*.test.js`. |
| `tests/functions/*.test.mjs` | Tests de la fonction planifiée (fetch mocké) : `node --test tests/functions/*.test.mjs`. |
| `.github/workflows/engine.yml` | Cycle : fonction Netlify + cron GitHub (secours) + push `decisions/**` + manuel. |
| `netlify/functions/engine-trigger.mjs` | Fonction planifiée Netlify (minute 9 UTC) : `workflow_dispatch` sur `main`. |
| `decisions/*.json` | Décisions de Grok Bot, une par session, appliquées une seule fois par `id`. |
| `state/portfolio.json` | **Source de vérité** : cash, positions, ordres ouverts, trades, frais, décisions traitées. |
| `state/journal.jsonl` | Journal en ajout seul (décisions, ordres, exécutions, refus, notes, alertes). |
| `state/equity.csv` | Un point par cycle : valeur du portefeuille et de « BTC conservé ». |
| `site/index.html`, `style.css` | Tableau de bord. |
| `site/app.js` | Lecture de l'état, KPI, positions, ordres (calcul perte/gain), trades, journal, courbe, version. |
| `site/markets.js` | Graphiques en bougies, indicateurs (MA, RSI, ATR), étiquettes des niveaux, bouton « Ordres », tableau des marqueurs. |
| `site/lib.js` | Fonctions pures testées : markdown sûr, résumé des actions, performance par jour, comptes à rebours, exposition, proximité. |
| `site/extras.js` | Exposition, prochains passages, calendrier, fil des décisions, leçons (API GitHub avec ETag et cache local). |
| `docs/LESSONS.md` | Leçons apprises, affichées dans le dash. Écrites par Grok Bot (bilan hebdo), une entrée par leçon, la plus récente en haut. |
| `site/version.json` | **Généré au déploiement** par `scripts/deploy.sh` (absent du dépôt). |
| `scripts/deploy.sh` | Déploiement prod / préprod / feature sur le site unique. |
| `scripts/release.sh` | Mise en prod du code (preprod → main) avec garde-fou state/decisions. |
| `scripts/netlify-build.sh` | Commande de build Netlify : écrit `version.json` s'il manque. |
| `.github/workflows/guard-state` (`guard.yml`) | Échoue si une PR ou une branche autre que main modifie `state/` ou `decisions/`. |
| `VERSION`, `CHANGELOG.md` | Version SemVer et historique. |
| `docs/` | Ce document, RUNBOOK, CONTRIBUTING, décisions techniques (ADR). |
| `.ntfy_topic` | Canal ntfy, **local uniquement** (gitignoré), copie du secret Actions `NTFY_TOPIC`. |
| `GITHUB_DISPATCH_TOKEN` | Variable d'environnement Netlify (scopes builds/functions/runtime, secret), **jamais dans le dépôt**. Voir [RUNBOOK](RUNBOOK.md). |

## 5. Règles du moteur (résumé)

À chaque cycle : charger l'état → appliquer les nouvelles décisions (une fois par `id`) → rejouer les bougies 1 h
**clôturées** depuis la dernière traitée → enregistrer un point de valeur → sauvegarder → notifier les exécutions.

- **Achat limite** exécuté si le plus bas de la bougie ≤ prix limite, au prix limite, **maker 0,40 %**.
- **Vente limite / objectif** exécutée si le plus haut ≥ prix, au prix, **maker 0,40 %**.
- **Stop** exécuté si le plus bas ≤ stop, au **stop − 0,1 %**, **taker 0,80 %**.
- **Stop et objectif dans la même heure** : le premier touché en bougie 5 min gagne ; le stop l'emporte seulement s'ils sont dans la **même bougie 5 min** (si les 5 min manquent : stop prioritaire sur la bougie 1 h, comme avant).
- Le fill est daté à l'ouverture de la première bougie 5 min qui touche le niveau ; repli : ouverture de la bougie 1 h. Prix et frais inchangés. L'état déjà écrit n'est pas modifié (le dash ajuste l'affichage des anciens marqueurs).
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

Voir [CHANGELOG](../CHANGELOG.md). Idées en attente : stop suiveur, page de bilan hebdo, alertes ntfy plus fines,
backtest de la leçon du 14/11 (entrées fractionnées en survendu).

Budget API GitHub du dash (60 requêtes/h par visiteur, sans clé) : état = `commits/main` en sha + ETag (304 gratuit)
puis 3 fichiers seulement quand le sha change ; décisions = liste `contents/decisions` avec ETag (304 gratuit),
chaque nouveau fichier lu une seule fois par son sha (`git/blobs`) puis gardé en `localStorage` ; leçons =
`contents/docs/LESSONS.md` avec ETag, lu sur la branche déployée (`preprod` en préprod, `main` en prod). Sur 403/429
le dash attend 10 min et affiche les décisions depuis le journal.

## 11. Chantier contrôle qualité (14/11/2026)

**Branche** : `feature/quality-gates-handoff`, issue de `preprod`. **Objet** : sécuriser les futures PR avant les fonctionnalités v0.3.0. Aucun changement du moteur, des stratégies, de `state/`, de `decisions/`, du site Netlify ou de la production.

**Audit initial** : `main` était 11 commits devant `preprod` au moment du contrôle, avec les derniers commits `55284ec`, `7c79bd7`, `6d5c9c6` correspondant aux cycles horaires (fichiers `state/`). Ne jamais recopier l'état de préprod sur main. La synchronisation des branches doit préserver les fichiers d'état de main et être validée par les protections existantes.

**Ajout** : `.github/workflows/quality.yml`, job `quality`, vérifie les PR vers `preprod`/`main` et les branches de développement : aucun changement de `state/` ou `decisions/`, CHANGELOG et HANDOFF modifiés sur chaque PR, tests `python -m unittest -v`, `node --test tests/site/*.test.js`, `node --test tests/functions/*.test.mjs`, `node --check` des JS, `bash -n` des scripts, invariants statiques de livraison. **Aucun cycle moteur ni déploiement** dans ce workflow. ADR-15 et RUNBOOK détaillent la décision et l'exploitation.

**Pour Grok Bot** : lire la PR de cette branche vers `preprod`, inspecter les checks GitHub, vérifier les chemins protégés et confirmer que les tests passent. Ne pas confondre tests verts et blocage des merges : configuration cible : PR et checks obligatoires uniquement sur `preprod` ; sur `main`, ni PR ni checks obligatoires, car le moteur et Grok Bot poussent directement. Sur `main`, interdire force-push/suppression et, si techniquement réalisable, restreindre les pushes à `github-actions[bot]` et `cyrillaferrere` ; ne pas activer de règle sans accord explicite de Cyril. Une fois les checks et la revue validés, intégrer dans `preprod` et tester. Aucune release `main` ni prod sans validation de Cyril.

**Reste à faire** : vérifier les checks CI à nouveau après ces corrections documentaires, passer la PR Ready et fusionner en squash dans `preprod` après validation ; ne configurer les règles GitHub qu'après accord explicite de Cyril, et uniquement selon la matrice `preprod`/`main` documentée dans le RUNBOOK. Puis lancer les développements UX v0.3.0. Les tests navigateur/visuels restent manuels à ce stade.

## 12. Déploiement préprod autonome par GPT (ADR-16, 14/11/2026)

**Pourquoi** : la préprod v0.2.0 commit `7f58759` a été déployée et vérifiée par Grok Bot ; l'objectif est de permettre à GPT de déployer les prochains changements sans consommer le forfait Grok Bot.

**Implémentation** : branche `feature/preprod-deploy-actions`, PR vers `preprod` ; nouveau workflow `.github/workflows/deploy-preprod.yml`, déclenchement manuel seulement sur `preprod`, environnement GitHub `preprod`, secret `NETLIFY_AUTH_TOKEN`, script existant `scripts/deploy.sh preprod`, vérification du commit via `version.json`. Pas de déclencheur sur `main`, pas de `--prod`, pas d'écriture dans `state/` ou `decisions/`, pas de changement de logique de trading.

**Reprise Grok Bot / GPT** : après revue et CI vertes, fusionner la PR dans `preprod` ; Cyril configure une seule fois le secret GitHub de l'environnement `preprod` sans jamais le partager en chat. Déclencher le workflow sur la branche `preprod` via GitHub Actions et vérifier que le SHA du dashboard correspond au commit de `preprod`. Si le run est ignoré, vérifier la branche choisie ; si le run échoue, consulter les logs sans afficher le secret. Le jeton Netlify n'est pas intrinsèquement restreint à la préprod : la sécurité repose aussi sur le workflow et les permissions du compte Netlify. **Aucun déploiement prod sans accord de Cyril.**

**Statut** : workflow proposé, non activé tant que la PR n'est pas fusionnée et que le secret n'est pas configuré. Aucune règle GitHub changée.
