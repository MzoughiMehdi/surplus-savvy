
# Ajouter les favoris restaurants avec bouton coeur

## Ce que ca fait
- Un bouton coeur apparait sur chaque carte d'offre (page d'accueil et Explorer) et sur chaque commande (page Commandes)
- Si le restaurant est en favori, le coeur est rempli en rouge (bien visible)
- Un clic sur le coeur ajoute le restaurant aux favoris, un second clic le retire
- La page Favoris affiche la liste des restaurants favoris avec leurs offres du jour

## Modifications techniques

### Etape 1 : Creer la table `favorites` en base de donnees
```sql
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
-- L'utilisateur ne peut gerer que ses propres favoris
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Etape 2 : Creer un hook `useFavorites`
Nouveau fichier `src/hooks/useFavorites.ts` :
- Charge les `restaurant_id` favoris de l'utilisateur connecte
- Expose `favorites` (Set de restaurant_id), `isFavorite(restaurantId)`, `toggleFavorite(restaurantId)`
- `toggleFavorite` fait un INSERT ou DELETE selon l'etat actuel, avec un `toast` de confirmation
- Retourne un etat optimiste (mise a jour locale immediate avant la reponse serveur)

### Etape 3 : Ajouter le coeur sur `OfferCard`
Fichier `src/components/OfferCard.tsx` :
- Ajouter une prop `isFavorite: boolean` et `onToggleFavorite: (restaurantId: string) => void`
- Placer un bouton coeur en haut a droite de l'image (position absolute)
- Coeur vide (`Heart`) si pas favori, coeur rempli rouge (`Heart` avec `fill="red"`) si favori
- Le clic sur le coeur appelle `onToggleFavorite` et fait un `e.stopPropagation()` pour ne pas ouvrir le detail

### Etape 4 : Ajouter le coeur sur `OrdersPage`
Fichier `src/pages/OrdersPage.tsx` :
- Utiliser `useFavorites` pour connaitre l'etat favori de chaque restaurant
- Ajouter un petit coeur a cote du nom du restaurant dans chaque ligne de commande
- Meme logique : clic = toggle, `stopPropagation`

### Etape 5 : Passer les props dans `Index.tsx` et `ExplorePage.tsx`
- Utiliser `useFavorites` dans `Index.tsx` et passer `isFavorite` et `onToggleFavorite` a chaque `OfferCard`
- Meme chose dans `ExplorePage.tsx`

### Etape 6 : Mettre a jour `FavoritesPage.tsx`
- Charger les favoris de l'utilisateur avec les infos restaurant jointes
- Afficher les restaurants favoris sous forme de cartes
- Si des offres du jour existent pour ces restaurants, les afficher
- Permettre de retirer un favori depuis cette page
