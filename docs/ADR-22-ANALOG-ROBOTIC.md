# ADR-22 — Prototype alternatif « Analog / Robotic »

Date : 14 novembre 2026 · Statut : expérimentation sur branche, sans fusion

## Contexte

La direction Nocturne Signal v0.3.1 (accent jade, bordures et états très graphiques) ne correspond pas au parti pris recherché. Nouvelle intention DA : analogique robotique, vumètres, typo technique et signes Unicode, évocation du matériel de studio / instrumentation industrielle old-school, mais exécution soignée et contemporaine.

## Décisions

- Branche indépendante `feature/analog-robotic-concept` issue de `preprod`.
- Feuille `site/analog.css` séparée, chargée après `style.css` pour une comparaison et un retour arrière simples ; les tokens existants sont écrasés seulement dans le prototype.
- Palette graphite / métal / crème et cuivre patiné. Pas de vert décoratif ni de liseré lumineux ; vert doux et rouge restent réservés aux données positives/négatives.
- Typographie à chasse fixe de système pour les montants, petites légendes type face avant d'instrument et signes Unicode choisis avec fallback sans téléchargement de police.
- Le « vumètre » est **la barre d'exposition existante** (`#exp-bar`), calculée à partir du portefeuille. Graduation 0–100 % et trame de segments en CSS, sans faux signal, mouvement de prix inventé ou nouveau calcul financier.
- Graphique conservé avec ses bougies et états Kraken réels ; seule sa palette change.
- Version `0.3.1` conservée sur la branche : il s'agit d'une direction de design **alternative** et non d'une release.
- Navigation, ids DOM, sources de prix, moteur, `state/` et `decisions/` inchangés.

## Vérifications et arbitrage

1. Tests Node, Python, guard-state, quality-gates. Recette Safari / Chrome sur 375, 390, 430, 768, 1280 et 1440 px.
2. Contrôler contraste, aspect des glyphes Unicode selon OS, clavier, VoiceOver, reduced-motion et variations de nombres.
3. Vérifier la graduation du vumètre à 0/50/100 % ; ce n'est pas un signal d'achat/vente.
4. Pas de merge en `preprod` ni en `main` sans arbitrage esthétique de Cyril et recette visuelle de cette branche.

## Évolution de la direction (ADR-23)

La palette cuivre et la typographie monospace généralisée sont remplacées dans la branche expérimentale par Graphite / Signal. Voir ADR-23. La décision initiale reste documentée pour comparaison.
