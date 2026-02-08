

# Ajouter la gestion des photos (restaurant + panier) sur le compte commercant

## Ce qui existe deja
- **Photo du restaurant** : Le composant `RestaurantImageUpload` est deja integre dans le Dashboard et fonctionne (upload vers le bucket `restaurant-images`, mise a jour de `restaurants.image_url`).
- **Photo d'offre** : Le composant `OfferImageUpload` existe mais n'est utilise nulle part dans le Dashboard.

## Ce qui manque
Le commercant ne peut pas definir une photo par defaut pour ses paniers surprise. Quand un panier est auto-genere chaque jour, il est cree sans `image_url`.

## Plan d'implementation

### 1. Ajouter une colonne `image_url` a la table `surprise_bag_config`
Migration SQL :
```sql
ALTER TABLE surprise_bag_config ADD COLUMN image_url text;
```
Cela permet au commercant de definir une photo par defaut pour tous ses paniers surprise.

### 2. Mettre a jour le composant `SurpriseBagConfig`
- Importer `OfferImageUpload`
- Ajouter un champ photo dans la section de configuration du panier surprise
- Quand la photo change, appeler `onUpdate({ image_url: url })` pour sauvegarder dans `surprise_bag_config`

### 3. Mettre a jour la generation automatique des offres dans `Dashboard.tsx`
Dans la fonction `generateTodayOffer`, inclure `image_url: config.image_url` lors de l'insertion de l'offre du jour, pour que chaque panier genere herite de la photo configuree.

### 4. Mettre a jour le hook `useSurpriseBagConfig`
S'assurer que le type `SurpriseBagConfig` inclut le champ `image_url` pour la coherence TypeScript.

## Resultat
Le commercant pourra depuis son Dashboard :
- Changer la **photo du restaurant** (deja en place)
- Changer la **photo du panier surprise** (nouveau) — cette photo sera automatiquement utilisee pour chaque offre generee quotidiennement

