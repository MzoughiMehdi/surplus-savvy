

# Ameliorer l'affichage des cartes d'offres sur la page d'accueil

## Ameliorations prevues

### 1. Paniers restants - Affichage plus visible
Remplacer la barre de progression actuelle par un badge colore plus lisible :
- Badge avec icone panier et texte "X paniers restants"
- Couleur dynamique : vert (3+), orange (2), rouge (1) pour creer un sentiment d'urgence
- Suppression de la barre de progression peu lisible

### 2. Distance en km entre vous et le restaurant
- Creer un hook `useUserLocation` qui recupere la position GPS de l'utilisateur via `navigator.geolocation`
- Calculer la distance a vol d'oiseau (formule Haversine) entre la position de l'utilisateur et les coordonnees du restaurant (deja disponibles dans les donnees)
- Afficher un badge avec l'icone MapPin et la distance en km (ex: "1.2 km") sur chaque carte d'offre

### 3. Creneau de recuperation - Affichage ameliore
Remplacer le simple texte "14:00 - 16:00" par un affichage plus attractif :
- Badge avec fond colore et icone horloge
- Format "Recuperation : 14h00 - 16h00" plus lisible
- Si le creneau est dans moins d'1h, afficher "Dans Xmin" en surbrillance pour creer de l'urgence

## Modifications techniques

### Fichier 1 : `src/hooks/useUserLocation.ts` (nouveau)
- Hook qui utilise `navigator.geolocation.getCurrentPosition`
- Retourne `{ latitude, longitude, loading, error }`
- Fonction utilitaire `getDistanceKm(lat1, lon1, lat2, lon2)` avec la formule Haversine

### Fichier 2 : `src/components/OfferCard.tsx`
- Ajouter une prop optionnelle `distanceKm?: number`
- Remplacer la barre de progression des paniers par un badge colore avec icone
- Ameliorer l'affichage du creneau horaire avec un style de badge
- Ajouter l'affichage de la distance si disponible (badge MapPin)

### Fichier 3 : `src/pages/Index.tsx`
- Importer et utiliser `useUserLocation`
- Calculer la distance pour chaque offre et la passer en prop a `OfferCard`

### Fichier 4 : `src/pages/ExplorePage.tsx`
- Meme integration de la distance que dans Index.tsx

