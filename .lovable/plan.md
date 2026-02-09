

# Corriger la carte qui ne s'affiche pas

## Probleme

Les tuiles **Stadia Maps** (alidade_smooth) necessitent une cle API pour fonctionner. Sans cle, les tuiles ne se chargent pas et la carte reste vide ou cassee.

## Solution

Remplacer le fournisseur de tuiles par **CartoDB Voyager**, qui est gratuit et ne necessite aucune cle API. Le style est similaire : moderne, epure, avec des tons clairs.

### Modifications

**`src/components/MapView.tsx`** (lignes 14-15) :
- Remplacer `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png` par `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Mettre a jour l'attribution

**`src/components/OfferDetail.tsx`** (ligne 40) :
- Meme remplacement du tile URL

Aucune autre modification necessaire. Les pins et popups restent identiques.

