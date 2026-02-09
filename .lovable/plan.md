

# Refonte visuelle de la carte : pins avec photo et popup amelioree

## 1. Nouveau style de carte

Remplacer le tile layer CartoDB Voyager par **Stadia Alidade Smooth** pour un rendu minimaliste et moderne avec des tons gris clairs qui mettent en valeur les marqueurs.

- Avant : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Apres : `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png`

Applique dans `MapView.tsx` et `OfferDetail.tsx`.

## 2. Pins avec photo du restaurant visible directement

Remplacer les cercles orange emoji par des **marqueurs ronds affichant la photo du restaurant** :

- Cercle de 48px avec la photo du restaurant en `background-image` (cover)
- Bordure epaisse blanche (3px) + ombre portee
- Petite fleche/triangle en bas pointant vers la position exacte
- Badge de prix reduit affiche en overlay sur le coin du pin (ex: "3.99EUR")
- Le tout en HTML/CSS pur via `L.divIcon`

## 3. Marqueur utilisateur ameliore

- Point bleu avec halo pulsant (style Google Maps)
- Plus visible et distinctif par rapport aux pins restaurant

## 4. Popup enrichie au clic

Quand on clique sur un pin, la popup sera redesignee :

- Image du lot en haut, coins arrondis, plus grande (120px de hauteur)
- Nom du restaurant en gras avec une petite etoile de notation si disponible
- Badge de categorie (ex: "Boulangerie", "Sushi")
- Creneau de retrait avec icone horloge
- Prix barre + prix reduit avec badge de reduction (ex: "-40%")
- Bouton "Voir l'offre" arrondi avec la couleur primaire
- Espacement et typographie ameliores pour un rendu type carte (card)

## Fichiers modifies

- **`src/components/MapView.tsx`** : tile layer, marqueurs photo, marqueur utilisateur, popup enrichie
- **`src/components/OfferDetail.tsx`** : tile layer uniquement

## Aucune nouvelle dependance

Tout est realise en HTML/CSS pur dans les `divIcon` et popups Leaflet.

