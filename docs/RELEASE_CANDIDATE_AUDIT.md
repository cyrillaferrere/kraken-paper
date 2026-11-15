# Compte rendu de préparation du candidat v0.3.1 — 14/11/2026

**Statut : candidat techniquement validé, GO Grok Bot sous réserves P1/P2 ; production NON autorisée.**

## Intégration et tests
- Candidat construit sur une branche isolée depuis main `a91a1575dbd1aaa8cfebf25824ce62c31fb5178e`. Les 27 chemins code, documentation et tests issus de preprod ont été reportés sur cette base, sans écraser les données vivantes.
- Première tentative de fusion directe sur PR #49 : conflits signalés par GitHub ; PR fermée sans fusion. Grok Bot a ensuite simulé localement une fusion de la PR #51 sans conflit.
- CI sur le candidat combiné : 51/51 Python, 84/84 site, 6/6 functions, contrôle des fichiers protégés et vérification syntaxique des scripts : succès.
- Les blobs `state/` et `decisions/` ont été comparés avec le snapshot main et sont identiques. Vérifier de nouveau immédiatement avant la publication, car main évolue.
- Le snapshot main est référencé par `backup/pre-v0.3.1-main-snapshot`. La restauration sur copie temporaire a vérifié les empreintes et relu JSON, JSONL et CSV. Cette sauvegarde GitHub n'est pas indépendante.

## Réserves et actions
- **P1 sécurité** : le champ JSON `approved_by: Cyril` ne prouve pas le consentement. Le workflow du candidat utilise `environment: production`, mais Cyril doit créer et protéger cet environnement, restreindre `deploy/prod-request`, migrer `NETLIFY_AUTH_TOKEN` vers les secrets d'environnement puis supprimer le secret du dépôt. Ne pas déclencher de production tant que ces réglages ne sont pas vérifiés.
- **P2 documentation** : renumérotation de la décision de publication en ADR-27 (ADR-21 réservé à Nocturne Signal), CHANGELOG `[0.3.1]`, procédure RUNBOOK mise à jour, réconciliation de la documentation main/preprod.
- **Revue finale Grok Bot** : attendue après corrections P1/P2.
- **Sauvegarde indépendante** : proposition Grok Bot de copie quotidienne locale et hebdomadaire Drive, non encore mise en place ni vérifiée. À valider avec Cyril et Grok Bot.

## Règles de publication et retour arrière
- La PR #51 reste en brouillon jusqu'à validation des conditions ci-dessus et autorisation explicite de Cyril. Aucun rebase ni force-push sur main ; intégration par commit de fusion ou squash après autorisation.
- Préserver `state/`, `decisions/`, `LESSONS.md` depuis main. Le code et la documentation de développement viennent de preprod, avec les documents d'exploitation de main réconciliés.
- Pour revenir en arrière, redéployer le code sain sans réécrire l'état ou les décisions. Contrôler le SHA et la version réellement publiés.

**Ce compte rendu n'est pas un ordre de déploiement.**

## Note historique après publication v0.3.1 (15/11/2026)
Ce document décrit le candidat **avant sa publication** et conserve volontairement son statut de l'époque. La v0.3.1 est maintenant en production ; les réserves et validations mentionnées plus haut ne doivent pas être interprétées comme l'état actuel du site. Voir le RUNBOOK et le HANDOFF pour le circuit opérationnel. Cette note ne déclenche aucune publication.
