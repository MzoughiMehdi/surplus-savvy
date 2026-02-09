
# Afficher l'adresse complete avec code postal et ville

## Probleme

Le hook `useOffers.ts` ne recupere que le champ `address` de la table `restaurants`. Les champs `postal_code` et `city` existent en base mais ne sont pas inclus dans la requete.

## Solution

### Fichier modifie : `src/hooks/useOffers.ts`

1. **Elargir le `select`** (ligne 32) pour inclure `postal_code` et `city` :
   - Avant : `restaurants(name, image_url, address)`
   - Apres : `restaurants(name, image_url, address, postal_code, city)`

2. **Composer l'adresse complete** (ligne 49) en concatenant les trois champs :
   - Format : `address, postal_code city` (ex: "12 rue de la Paix, 75002 Paris")
   - Gerer les valeurs nulles pour eviter des virgules ou espaces en trop

### Aucun autre fichier a modifier
Le composant `OfferDetail.tsx` et `MapView.tsx` utilisent deja `offer.restaurantAddress` tel quel — l'adresse complete ameliorera aussi le geocodage Nominatim.
