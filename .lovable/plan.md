
# Masquer les offres expirées et corriger le compteur d'urgence

## Problemes identifies

1. **Les offres dont le creneau de retrait est passe restent visibles** : une offre avec `pickup_end = 14:00` est encore affichee a 14h20. Le filtre dans `useOffers.ts` verifie seulement `is_active` et `items_left > 0`, sans comparer l'heure actuelle avec `pickup_end`.

2. **Le compteur "Dans Xmin" est base sur l'heure de debut, pas de fin** : `getUrgencyInfo` calcule la difference entre maintenant et `pickupStart`. Ca dit "Dans 19min" pour indiquer que le retrait commence bientot, mais ca ne previent pas quand le creneau est sur le point de se fermer.

## Solution

### 1. Filtrer cote client les offres dont le creneau est passe (`useOffers.ts`)

Apres le mapping des offres, filtrer celles dont `pickup_end` est deja depasse. On ne peut pas facilement filtrer cote SQL car `pickup_end` est un `time` et la comparaison depend du fuseau horaire du client.

- Ajouter un filtre : si l'heure actuelle depasse `pickup_end`, exclure l'offre de la liste
- Cela masquera immediatement les offres dont le creneau est fini

### 2. Corriger le compteur d'urgence (`OfferCard.tsx`)

Remplacer la logique de `getUrgencyInfo` pour utiliser `pickupEnd` au lieu de `pickupStart` :

- Calculer le temps restant avant la **fin** du creneau de retrait
- Si le creneau est en cours et qu'il reste moins de 60 minutes : afficher "Encore Xmin" en rouge
- Si le creneau n'a pas encore commence et commence dans moins de 60 minutes : afficher "Dans Xmin" en orange
- Si le creneau n'a pas encore commence et commence dans plus de 60 minutes : afficher le creneau horaire normal

### 3. Rafraichir periodiquement pour masquer les offres expirees (`useOffers.ts`)

Ajouter un `setInterval` qui re-filtre les offres toutes les minutes, afin que les offres expirees disparaissent automatiquement sans recharger la page.

## Modifications techniques

### Fichier `src/hooks/useOffers.ts`
- Apres le mapping, filtrer les offres : exclure celles ou l'heure actuelle est superieure a `pickupEnd`
- Ajouter un `useEffect` avec `setInterval` toutes les 60 secondes pour re-filtrer la liste des offres brutes et mettre a jour le state

### Fichier `src/components/OfferCard.tsx`
- Modifier `getUrgencyInfo` pour accepter `pickupStart` ET `pickupEnd`
- Nouvelle logique :
  - Si maintenant est apres `pickupStart` et avant `pickupEnd` : calculer les minutes restantes avant `pickupEnd`. Si moins de 60 min, retourner un objet `{ type: "ending", minutes: X }`
  - Si maintenant est avant `pickupStart` : calculer les minutes avant `pickupStart`. Si moins de 60 min, retourner `{ type: "starting", minutes: X }`
  - Sinon retourner `null`
- Adapter l'affichage : "Encore Xmin" (rouge) pour `ending`, "Dans Xmin" (orange) pour `starting`
