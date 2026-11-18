# Transmission a Grok Bot — moteur 0.2.0 / site 0.3.7

**A relire avant GO de Cyril. Aucune modification de strategie ni decision de trading realisee ici.**

## Ce qui change pour les sessions
- **Achat limite et TP** : un simple contact ne declenche plus une execution simulee.
  Hypothese PAPER : low strictement sous 99,95 % de la limite d'achat ;
  high strictement au-dessus de 100,05 % du prix d'objectif.
- **Stops** : le franchissement produit une vente au marche taker simulee.
  Le prix peut etre inferieur au seuil selon gap et volatilite 5 minutes
  et volume; minimum de 0,1 % de glissement.
- **Temps** : le moteur ne tourne pas davantage, mais a chaque cycle horaire
  il rejoue toutes les 5 minutes cloturees non traitees. Les ordres poses
  deviennent eligibles des la bougie 5 min suivante.
  Il peut donc horodater une execution a l'interieur de l'heure ecoulee.
- **Repli** : si les 5 minutes d'une heure cloturee manquent, il utilise
  la bougie 1 h et inscrit `execution_fallback` dans le journal.
  Attention, une mèche 1 h ne donne pas la sequence exacte stop/TP.
- **Frais** : les paliers maker/taker Kraken Pro evoluent selon les fills du
  portefeuille PAPER dans la fenetre 30 jours glissants; sans volume externe.
- **Bracket** : stop et TP d'une meme sortie ne bloquent qu'une fois la
  quantite sous-jacente; apres TP partiel, le stop ne couvre que le reliquat.

## Avant activation
Grok doit verifier si ses consignes d'ordres limites/TP tiennent compte du
seuil de 0,05 %, des frais variables et d'un stop potentiellement plus
defavorable, sans laisser croire que le remplissage est garanti. Conserver
toutes les decisions hors du moteur. Confirmer l'absence d'incompatibilite
des ordres ouverts O0017, O0022, O0024, O0025, O0026.

La simulation ne reproduit pas la file d'attente du carnet, les executions
partielles, les volumes d'autres comptes, ni la liquidite exacte du moment.
Le numero de version moteur 1.0 reste reserve a une validation longue.
