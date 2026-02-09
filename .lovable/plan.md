
# Simplification des messages d'urgence sur les cartes d'offres

## Probleme

Actuellement, deux messages differents s'affichent :
- En rouge : "Encore 5min" (le creneau se termine bientot)
- En orange : "Dans 5min" (le creneau commence bientot)

Ces deux messages pretent a confusion car ils se ressemblent mais signifient des choses differentes. De plus, "minutes" n'a pas de "s".

## Solution

Remplacer les deux messages par un seul message unifie : **"Dernier retrait dans X minutes"**, affiche en rouge dans les deux cas (puisqu'il s'agit d'une urgence).

### Fichier modifie : `src/components/OfferCard.tsx`

1. **Supprimer la distinction "starting" / "ending"** dans la fonction `getUrgencyInfo` : retourner simplement le nombre de minutes restantes avant la fin du creneau (pas avant le debut).
2. **Unifier le badge** : un seul style (rouge) avec le texte "Dernier retrait dans X minutes".
3. **Corriger le pluriel** : "minute" au singulier si 1, "minutes" sinon.

### Changements concrets

Dans `getUrgencyInfo` :
- Quand le creneau est en cours et qu'il reste moins de 60 min : retourner les minutes restantes
- Quand le creneau n'a pas encore commence : ne plus afficher d'urgence (le creneau normal s'affiche)

Dans le JSX du badge urgence :
- Remplacer les deux blocs (rouge "Encore" et orange "Dans") par un seul bloc rouge :
```
Dernier retrait dans {minutes} minute{minutes > 1 ? "s" : ""}
```

## Resume

| Element | Avant | Apres |
|---|---|---|
| Creneau se termine bientot | Rouge "Encore 5min" | Rouge "Dernier retrait dans 5 minutes" |
| Creneau commence bientot | Orange "Dans 5min" | Supprime (affichage normal du creneau) |
| Pluriel | Absent | "minute" / "minutes" |
