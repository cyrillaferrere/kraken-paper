# ADR-30 — Visualisation avancée du marché et audit UX v0.3.5 (17/11/2026)

## Contexte
La v0.3.4 possède un mode Focus et des graphes fiables, mais pas de carnet, de comparaison synthétique, ni de parcours explicite entre décision, ordre et exécution.

## Décision
- Créer `feature/v0.3.5` à partir de la dernière `preprod` acceptée. `main`, `state/`, `decisions/`, moteur Python et stratégie Grok Bot restent inchangés.
- Charger `site/market-v035.js` après `focus-ux.js` et `site/v035.css` après le design system. Script de **lecture seule** sans dépendance supplémentaire.
- Carnet : requête publique Kraken `GET /0/public/Depth?pair=<paire>&count=10` (au plus une fois toutes les 18 s par paire visible, lecture non simultanée). Valider prix et volumes positifs, trier les deux côtés, calculer spread et spread %. Effacer immédiatement un carnet périmé lorsqu'on change de paire ou qu'une requête échoue. Marquer l'heure de l'instantané ; **ne jamais le présenter comme un WebSocket** ou une simulation d'exécution.
- Indicateurs : réutiliser exclusivement les calculs existants `row(pair)` du scanner (tendances 4 h/1 j, RSI 14, ATR, variation 24 h et force vs BTC). Les valeurs non calculées restent « — ».
- Graphique : ne pas reprogrammer les bougies OHLC ni les marqueurs ; garder leurs données réelles et les lignes de stops/TP existantes. Ajouter un ruban d'accès aux niveaux des ordres PAPER. Un stop/TP d'achat en attente porte explicitement « si achat exécuté ». Les puces sont des liens vers les détails des ordres ; elles ne modifient aucune position.
- Performance : n'utiliser que l'historique `equity` fourni par le moteur, sur la période de vue choisie. Afficher début, fin, P&L brut et écart de **rendement en points** vs BTC conservé, si les deux bornes BTC sont disponibles. Sans observations suffisantes : « — ». Aucun point inventé ni extrapolation de marchés.
- Audit : extraire uniquement les événements réels journalisés de type `decision`, `order_placed`, `fill`, etc. Ne lier un événement à une décision que si `decision_id` est présent. Accès au détail d'ordre uniquement si l'ordre figure encore dans le tableau ; sinon afficher sa référence informative.
- Mobile/accessibilité : surfaces et commandes compactes, texte/contraste, `aria-expanded`, sections `hidden`, cibles clavier et `prefers-reduced-motion`.

## Conséquences et limites
La profondeur REST est un **instantané de liquidité** pouvant devenir obsolète entre deux lectures : elle ne prouve pas qu'un ordre serait exécuté ni à quel prix. Le spread affiché ne comprend pas les frais ni le glissement. Les graphiques PAPER ne reproduisent pas le carnet réel ; on n'en déduit aucune décision de trading. Les événements sans identifiant explicite ne sont pas reliés. Pas de secret, aucun endpoint authentifié, aucune mutation de l'état. Les tests contrôlent notamment les carnets aberrants et les valeurs manquantes.

## Validation
Tests Node : `node --test tests/site/*.test.js`, contrôles Python et `guard-state` par CI. Recette visuelle à 390/768/1440 px, reconnexion après onglet masqué, changement de paire en plein chargement, panne de l'API et touches clavier. Fusion dans `preprod` seulement sur GO explicite de Cyril ; jamais de production sans GO distinct.
