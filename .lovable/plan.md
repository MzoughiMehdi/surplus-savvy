

# Ajustements de la page de detail

## Modifications dans `src/components/OfferDetail.tsx`

### 1. Reduire le bloc allergenes et le deplacer apres les instructions de collecte

Le bloc allergenes (lignes 179-190) sera :
- Deplace apres le bloc "Instructions de collecte" (apres ligne 229)
- Reduit visuellement : padding `p-3` au lieu de `p-4`, icone plus petite (`h-4 w-4`), suppression du titre "Information allergenes" pour ne garder que le texte d'avertissement en une seule ligne compacte

Nouvel ordre des sections :
1. Carte interactive (localisation)
2. Instructions de collecte
3. Avertissement allergenes (compact)
4. Rappel emballage

### 2. Ajouter l'adresse sous la carte

Sous le conteneur de la carte (apres le `div` de la map ou le fallback), ajouter une ligne affichant `offer.restaurantAddress` en texte, visible meme quand la carte est affichee.

## Details techniques

### Fichier modifie
- **`src/components/OfferDetail.tsx`** :
  - Deplacer le bloc allergenes (lignes 179-190) apres le bloc instructions (ligne 229)
  - Reduire le padding et la taille du bloc allergenes (inline, sans titre separe)
  - Ajouter `<p className="mt-2 text-xs text-muted-foreground">{offer.restaurantAddress}</p>` apres la carte dans le bloc localisation (ligne 206, avant la fermeture du `div` parent)

