## Addendum revue Grok Bot — 18/11/2026 (bloquant)
- Une erreur OHLC 5 min (limitation Kraken, indisponibilite du reseau, serveur)
  **interdit** le repli 1 h pour cette paire pendant le cycle. Le moteur
  n'avance ni `last_m5` ni `last_candle` et reessaie au cycle suivant.
- Un retour incomplet OHLC 5 min dans la fenetre des ~60 h de retention
  entraine l'attente, jamais un repli. Le repli 1 h n'est autorise qu'une
  fois le segment entier strictement plus ancien que 60 h ; il est journalise.
- Si le curseur 5 min a deja progresse a l'interieur d'une heure, cette heure
  est definitivement exclue du repli 1 h (anti-double-execution). Il faut
  recuperer les 5 min manquantes ; au-dela de la retention, une intervention
  documentee sera necessaire, sans inventer de fills.
- Aucun changement de `state/` ou `decisions/` par cette PR.

# ADR-35 — Fidelite des executions PAPER, moteur 0.2.0 (18/11/2026)

Statut : propose / implante en feature, non valide en production.

## Contexte
La v0.1 traite uniquement les bougies horaires cloturees, avec datation auxiliaire
5 minutes, prise au simple contact et glissement forfaitaire. Cela surestime
la certitude de remplissage et peut faire reagir trop tard les protections.

## Decisions
1. Source publique Kraken OHLC (intervalle 5). Seules les bougies
   **cloturees** sont rejouees, dans l'ordre. Le curseur `last_m5` est
   independant du dernier curseur horaire existant. Ordres actifs a la
   premiere ouverture de bougie 5 minutes **strictement suivante**.
2. Pour une heure cloturee dont les 12 barres 5 minutes manquent, traiter
   la bougie 1 h si elle existe; consigner `execution_fallback` dans le
   journal. Si aucune bougie n'existe, arreter le rejeu de la paire.
   Si l'heure courante a une lacune 5 min, attendre sa cloture pour le repli.
   Les donnees publiques OHLC sont bornees (~720 barres par granularite).
3. Limites : un achat maker suppose `low < limite*(1-0.0005)`;
   une vente maker / objectif suppose `high > limite*(1+0.0005)`.
   Hypothese conservatrice, **pas** une regle du carnet Kraken.
   Ni file d'attente ni remplissage partiel modelises.
4. Stop : un seuil franchi devient une vente au marche taker.
   Prix de reference `min(stop, ouverture_bougie)`.
   `glissement = min(2%, 0.10% + 5%*max(0, amplitude_rel-1%)
                 + 0.10%*min(1, quantite/(volume_5min*1%)))`.
   La participation vaut 0 si le volume 5 minutes n'est pas renseigne.
   `amplitude_rel=(high-low)/ouverture`. Exemple 17/11 :
   stop BTC 63 700, ouverture 63 700, high 63 700, low 63 298,
   volume inconnu => glissement 0,10%, execution arrondie a
   63 636 USDC (prix entier), contre 63 298 pour le creux.
   Cette estimation n'est **pas** une cotation executable garantie.
5. Kraken Pro : selecteur du palier spot selon le volume notionnel
   des trades PAPER executes au cours des 30 derniers jours **avant**
   le fill. Recalcul a chaque fill; aucune conversion historique
   et aucun volume externe a ce portefeuille. Les paires USDC/crypto
   retenues sont supposees relever des paliers spot crypto; verifier
   toute exception de frais par paire avant le passage en prod.
   Source : https://support.kraken.com/articles/cross-platform-fee-tier-changes
   et https://support.kraken.com/articles/201893638-how-trading-fees-work-on-kraken
   Barème : 0: 0.40/0.80, 2.5k: 0.30/0.60, 10k: 0.22/0.38,
   25k: 0.20/0.35, 50k: 0.15/0.30, 100k: 0.12/0.25,
   250k: 0.10/0.22, 500k: 0.08/0.20, 1M: 0.06/0.18,
   2.5M: 0.04/0.15, 5M: 0.02/0.12, 10M: 0/0.10,
   50M: 0/0.09, 100M: 0/0.08, 250M: 0/0.07,
   400M: 0/0.06, 500M: 0/0.05 (maker/taker %, USD).
6. Sorties : le groupe `open_orders` contient la quantite reservee
   *une seule fois* pour un stop et les TP d'une meme position.
   Il represente un bracket OCO/reduce-quantity, pas deux ventes
   independantes couvrant le meme solde. Les TP reduisent le
   reliquat; le stop vend et annule le groupe. Les autres ventes
   independantes restent soumises a `available_qty`.
   Ce choix represente un bracket Kraken Pro spot, pas des ordres
   independants possedant chacun la meme quantite.
   Source : https://support.kraken.com/articles/bracket-orders-on-kraken-pro

## Migration & contraintes
- Aucun `state/` ni `decisions/` n'est commite par la PR.
- Les ordres O0017/O0024/O0022/O0025/O0026 conservent leurs
  champs et quantites; leurs prochaines evaluations utilisent
  la nouvelle logique seulement apres activation.
- Les trades/journaux existants ne sont pas modifies. Pour equity.csv,
  seul l'en-tete est ajoute par le moteur au premier cycle de v0.2 :
  les lignes anciennes ne sont ni recalculees ni completees.
- L'absence de version sur les donnees historiques signifie 0.1.0.
- Heartbeat toujours ignore avant toute mutation.
- Production : approbation explicite de Cyril, puis workflow de demande
  controlee; build Git automatique depuis main ignore (ADR-34).
- La simulation ne garantit ni carnet d'ordres historique, ni matching,
  ni volume d'autres comptes, ni executions partielles, ni latence exacte.
