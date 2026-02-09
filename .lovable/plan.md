

# Enrichir la page de detail et renommer "Panier surprise"

## Renommage

Le terme "Panier surprise" sera remplace par **"Lot Anti-Gaspi"** dans toute l'application :

- `OfferDetail.tsx` : titre et descriptions
- `SurpriseBagConfig.tsx` : titre du bloc config
- `MerchantOnboarding.tsx` : label dans le recapitulatif
- `generate_daily_offers()` (migration SQL) : titre et description inseres automatiquement
- `mockOffers.ts` : donnees de test

## Nouvelles sections dans OfferDetail.tsx

Quatre blocs seront ajoutes entre le bloc prix et le compteur de stock :

### 1. Avertissement allergenes
Un bandeau avec une icone `AlertTriangle` indiquant :
> "Le contenu de ce lot varie chaque jour. Le restaurant ne peut garantir l'absence d'allergenes. En cas d'allergie ou d'intolerance, contactez directement le commercant avant de reserver."

### 2. Mini-carte interactive
Une carte Leaflet de hauteur fixe (160px, coins arrondis) affichant la position du restaurant. Le geocodage utilise Nominatim (meme logique que `MapView.tsx`). La carte sera en lecture seule (pas de drag, zoom fixe). Si le geocodage echoue, l'adresse textuelle est affichee a la place.

### 3. Instructions de collecte
Un bloc avec icone `ClipboardList` et les consignes :
- Presentez votre confirmation de reservation au commercant
- Respectez le creneau de retrait indique
- Le contenu du lot peut varier selon les invendus du jour

### 4. Rappel emballage
Un bloc avec icone `ShoppingBag` rappelant :
> "Pensez a apporter votre propre sac ou contenant pour recuperer votre lot. Ensemble, reduisons les emballages !"

## Details techniques

### Fichiers modifies

- **`src/components/OfferDetail.tsx`** : ajout des 4 sections, import de Leaflet, renommage des textes, ajout d'un `useEffect` + `useState` pour le geocodage de l'adresse
- **`src/components/SurpriseBagConfig.tsx`** : renommer le titre "Panier surprise" en "Lot Anti-Gaspi"
- **`src/pages/MerchantOnboarding.tsx`** : renommer le label
- **`src/data/mockOffers.ts`** : renommer le titre
- **Migration SQL** : mettre a jour la fonction `generate_daily_offers()` pour inserer "Lot Anti-Gaspi" comme titre

### Dependances existantes
Leaflet est deja installe (`leaflet` + `@types/leaflet`). Pas de nouvelle dependance.

