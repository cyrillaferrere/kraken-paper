# Audit candidat v0.3.1 (simulation)

Branche isolée créée depuis le SHA main `a91a1575dbd1aaa8cfebf25824ce62c31fb5178e`.
Les 27 chemins code/tests/docs de preprod ont été reportés sur ce snapshot, sans modifier les blobs `state/`, `decisions/` ou le workflow de déploiement production.
Le résultat n'est pas une fusion Git automatique : la PR #49 a révélé des conflits. Les sections de documentation de main ont été conservées en annexe pour réconciliation ; ne pas publier cet arbre en l'état.
La PR #50 sert uniquement à exécuter les tests sur l'arbre candidat. Aucun push sur main, aucun tag, aucune production.

Test complémentaire : restauration du snapshot Git dans un répertoire temporaire avec vérification des hashes et lecture des fichiers. Cette sauvegarde est dans GitHub, pas une copie externe indépendante.
