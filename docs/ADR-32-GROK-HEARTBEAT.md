# ADR-32 — Heartbeat Grok sans mutation PAPER (18 novembre 2026)

## Contexte
Le compteur « Session Grok · estimée » prenait uniquement `state.last_decision.timestamp`. Or Grok passe environ toutes les cinq heures, et une session sans changement ne génère pas de décision : l'estimation pouvait ainsi afficher un faux « retard » après un passage réel.

## Décision
- Conserver strictement **5 h** entre le dernier passage documenté et la prochaine session estimée.
- Accepter un fichier JSON `decisions/YYYY-MM-DD-HHMM-heartbeat.json` (date/heure **Europe/Paris**, quatre chiffres pour HHMM, par exemple `decisions/2026-11-18-0309-heartbeat.json`) avec un objet :
```json
{
  "id": "heartbeat-20261118-0309",
  "type": "heartbeat",
  "timestamp": "2026-11-18T03:09:00+01:00",
  "note": "Session vérifiée, aucune modification nécessaire.",
  "actions": []
}
```
- Le moteur charge ce fichier comme toute entrée `decisions/*.json`, exige `id`, `type="heartbeat"`, `actions=[]`, `note` non vide et `timestamp` ISO 8601 avec décalage UTC. Un fichier malformé est signalé comme **warning de lecture**, jamais comme action de trading refusée.
- Dans `apply_decisions`, filtrer les heartbeats **avant** la copie de l'état et avant toute action : pas d'ordre, pas de refus, pas d'ajout à `processed_decisions`, pas de modification de `last_decision`, pas d'événement de décision ou fill, pas de mutation `state/` due au heartbeat.
- Le frontend lit les fichiers de `decisions/` sur `main`, conserve le timestamp le plus récent parmi décisions et heartbeats, et se replie sur `state.last_decision` si les fichiers sont indisponibles. Relecture conditionnelle via ETag environ toutes les cinq minutes, même si `state/` ne change pas.
- L'heure calculée est **une estimation** et non une attestation de présence ou d'absence. Si elle est dépassée, afficher « estimation dépassée », jamais « retard » ; sans heartbeat le dashboard ne peut pas confirmer qu'une session Grok sans décision a eu lieu.
- Dans Activité & Bot, placer les heartbeats dans un groupe replié, gris, après les vraies décisions.

## Conséquences et risques
Il s'agit d'un **contrat d'entrée du moteur** documenté, pas d'un changement de stratégie ni des règles de simulation. Les fichiers heartbeat provoquent potentiellement le déclencheur GitHub sur `decisions/`, mais leur lecture ne modifie aucune position ou décision. Le cycle horaire peut naturellement écrire `last_cycle` et l'historique comme avant ; ne pas confondre avec une écriture due au heartbeat. Aucun fichier `state/` ou `decisions/` existant n'est créé ou modifié dans cette PR. Seul Grok Bot écrira de nouveaux heartbeats **après** la mise en production autorisée.

## Vérification
`python -m unittest discover -s tests -p 'test_*.py'` et `node --test tests/site/*.test.js` vérifient le fichier, les rejets de format sans refus de trading, la stricte absence de mutation de `state` par `apply_decisions`, le choix du heartbeat récent et l'horizon exact de cinq heures.
