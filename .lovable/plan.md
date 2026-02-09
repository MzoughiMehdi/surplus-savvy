

# Accelerer le chargement de la carte

## Probleme

Meme avec le geocodage en parallele, l'API Nominatim impose un rate-limit (~1 requete/seconde). Avec 7 restaurants, le chargement prend toujours 5-7 secondes. Ce probleme se reproduit a **chaque ouverture** de la carte.

## Solution : stocker les coordonnees GPS en base de donnees

Au lieu de geocoder les adresses a chaque visite, on stocke les coordonnees directement dans la table `restaurants`. Le geocodage ne se fait qu'une seule fois (a la creation/modification du restaurant).

### 1. Migration de base de donnees

Ajouter deux colonnes `latitude` et `longitude` (type `double precision`) a la table `restaurants`.

Puis remplir automatiquement les coordonnees des restaurants existants via une fonction edge qui appelle Nominatim une seule fois pour chaque restaurant sans coordonnees.

### 2. Modifier `src/hooks/useOffers.ts`

Inclure `latitude` et `longitude` dans le `select` de la requete Supabase, et les ajouter a l'interface `Offer`.

### 3. Modifier `src/components/MapView.tsx`

- Supprimer tout le systeme de geocodage (fonction `geocodeAddress`, cache, `useEffect` de geocodage)
- Utiliser directement `offer.lat` et `offer.lng` depuis les donnees de la base
- Les marqueurs s'affichent **instantanement** a l'ouverture de la carte

### 4. Modifier `src/components/OfferDetail.tsx`

- Supprimer l'appel a Nominatim pour la mini-carte
- Utiliser directement les coordonnees de l'offre

### 5. Fonction edge `geocode-restaurants`

Creer une fonction backend qui :
- Recupere tous les restaurants sans coordonnees
- Appelle Nominatim pour chacun (avec delai de 1s entre chaque pour respecter le rate-limit)
- Met a jour les coordonnees en base

Cette fonction sera appelee une seule fois pour migrer les restaurants existants, puis les coordonnees seront renseignees lors de la creation de nouveaux restaurants.

## Resultat

- Ouverture de la carte : **instantanee** (0 appel API externe)
- Les coordonnees sont calculees une seule fois par restaurant
- Meilleure fiabilite (pas de dependance a Nominatim a chaque visite)

## Fichiers concernes

- **Migration SQL** : ajout colonnes `latitude` / `longitude`
- **`supabase/functions/geocode-restaurants/index.ts`** : nouvelle fonction backend
- **`src/hooks/useOffers.ts`** : ajout lat/lng au select et a l'interface
- **`src/components/MapView.tsx`** : suppression geocodage, utilisation directe des coordonnees
- **`src/components/OfferDetail.tsx`** : suppression geocodage, utilisation directe des coordonnees

