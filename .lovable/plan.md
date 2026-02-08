

# Corriger les photos et descriptions des offres sur la page d'accueil

## Cause du probleme

Lors du nettoyage des doublons, toutes les offres ont ete remplacees par des offres generiques identiques :
- Meme titre : "Panier surprise"
- Meme description
- Aucune image (`image_url` = null)

Le composant `OfferCard` affiche alors une image par defaut identique pour tous.

## Solution

### 1. Mettre a jour les offres existantes avec des images et descriptions uniques

Executer un UPDATE SQL pour donner a chaque offre de demo une image et une description correspondant a son restaurant :

- **Le Fournil** (bakery) : image boulangerie, description viennoiseries
- **Sushi Yuki** (sushi) : image sushi, description sushi
- **Bio & Local** (grocery) : image epicerie, description fruits/legumes
- **Dolce Vita** (dessert) : image patisserie, description desserts
- **Le Bistrot** (meals) : image bistrot, description plats du jour
- **Chez Nadia** (meals) : image traiteur oriental, description specialites orientales

### 2. Utiliser l'image du restaurant comme fallback dans `useOffers.ts`

Modifier la ligne qui definit `image` dans le mapping pour utiliser l'image du restaurant quand l'offre n'a pas d'image propre :

```
image: o.image_url ?? o.restaurants?.image_url ?? fallback_unsplash
```

Cela garantit que meme si une offre n'a pas de photo dediee, elle affichera au minimum la photo du restaurant.

### Fichiers modifies
- `src/hooks/useOffers.ts` : fallback image vers restaurant
- Migration SQL : mise a jour des images et descriptions des offres de demo

### Resultat
- Chaque restaurant aura une photo et description unique sur la page d'accueil
- Les futures offres auto-generees utiliseront la photo du `surprise_bag_config`, ou a defaut celle du restaurant

