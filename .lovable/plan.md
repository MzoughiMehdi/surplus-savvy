

# Correction des stats profil + adresses sur la carte

## Probleme 1 : Stats "Repas sauves" et "Euros economises"

Dans `ProfilePage.tsx` (ligne 31), la requete filtre avec `.eq("status", "completed")`. Or les commandes payees ont le statut `"confirmed"` par defaut. Elles ne sont donc jamais comptees.

**Solution** : Remplacer `.eq("status", "completed")` par `.in("status", ["confirmed", "completed"])`.

## Probleme 2 : Adresses erronees sur la carte

Actuellement, `MapView.tsx` ignore completement l'adresse reelle des restaurants. Les positions sont generees avec une formule mathematique fictive (lignes 20-24) :

```text
lat: 48.8566 + Math.sin(i * 1.8) * 0.012
lng: 2.3522 + Math.cos(i * 1.5) * 0.015
```

Cela place les marqueurs a des positions aleatoires autour de Paris, sans rapport avec l'adresse reelle.

**Solution** : Utiliser l'API gratuite de geocodage OpenStreetMap (Nominatim) pour convertir l'adresse textuelle de chaque restaurant en coordonnees GPS reelles, puis placer les marqueurs aux bonnes positions.

### Fonctionnement

```text
Adresse "35 Avenue de la Grande Armee, Paris"
        |
        v
API Nominatim (gratuite, pas de cle API)
        |
        v
Coordonnees: lat 48.8748, lng 2.2860
        |
        v
Marqueur place a la bonne position sur la carte
```

### Details techniques

**`src/components/MapView.tsx`** :
- Supprimer la formule de positions fictives
- Ajouter une fonction `geocodeAddress(address: string)` qui appelle `https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1`
- Au montage du composant, geocoder toutes les adresses des restaurants
- Placer les marqueurs aux coordonnees reelles obtenues
- Ajouter un cache local (Map) pour eviter de re-geocoder les memes adresses
- Afficher l'adresse reelle dans le popup de chaque marqueur

**`src/pages/ProfilePage.tsx`** :
- Ligne 31 : remplacer `.eq("status", "completed")` par `.in("status", ["confirmed", "completed"])`

## Fichiers impactes

- **`src/components/MapView.tsx`** : geocodage reel des adresses
- **`src/pages/ProfilePage.tsx`** : correction du filtre de statut

