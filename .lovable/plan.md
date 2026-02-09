

# Afficher la photo uploadée pour Chez Nadia

## Probleme

L'offre du jour de Chez Nadia a une image Unsplash codee en dur (`https://images.unsplash.com/photo-1511690743698-d9d18f7e20f1`), alors que la vraie photo uploadee est stockee dans `surprise_bag_config.image_url`.

## Solution

### 1. Mettre a jour l'offre du jour avec la bonne image

Executer un UPDATE SQL pour remplacer l'image Unsplash par la photo uploadee :

```sql
UPDATE offers
SET image_url = 'https://yuqemnbwndyjmpzxlwyv.supabase.co/storage/v1/object/public/restaurant-images/offers/8a6c7d7a-dad6-4f05-b2a3-e3eb7ad0f7db/1770595057851.jpg'
WHERE restaurant_id = 'a1000006-0000-0000-0000-000000000006'
AND date = CURRENT_DATE;
```

### 2. Corriger la synchronisation dans `useSurpriseBagConfig.ts`

Actuellement, la fonction `syncTodayOffer` ne synchronise pas le champ `image_url` quand le commercant change la photo du panier. Il faut ajouter cette ligne dans la logique de synchronisation :

```typescript
if (updatedConfig.image_url !== undefined) offerUpdates.image_url = updatedConfig.image_url;
```

Cela garantit que chaque fois qu'un commercant change la photo dans sa configuration, l'offre du jour est immediatement mise a jour.

### 3. Corriger la generation automatique dans `Dashboard.tsx`

Verifier que la fonction `generateTodayOffer` inclut bien `image_url: config.image_url` lors de la creation de l'offre. (Cela a deja ete fait dans une etape precedente, mais il faut confirmer.)

### Fichiers modifies
- `src/hooks/useSurpriseBagConfig.ts` : ajouter la synchro de `image_url` dans `syncTodayOffer`
- Migration SQL : corriger l'image de l'offre du jour pour Chez Nadia

### Resultat
- La photo uploadee s'affichera immediatement pour Chez Nadia
- Les futurs changements de photo seront automatiquement repercutes sur l'offre du jour
