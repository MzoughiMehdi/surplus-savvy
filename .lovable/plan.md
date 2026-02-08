

# Corriger la mise a jour des creneaux

## Probleme identifie

La configuration (`surprise_bag_config`) est bien mise a jour (pickup_start = 08:00), mais l'offre du jour dans la table `offers` garde les anciens creneaux (18:00). La fonction `syncTodayOffer` dans `useSurpriseBagConfig.ts` execute un UPDATE, mais celui-ci echoue **silencieusement** a cause des politiques de securite de la base de donnees.

**Cause racine** : Toutes les politiques de securite (RLS) sur la table `offers` sont de type RESTRICTIF. En PostgreSQL, s'il n'y a aucune politique permissive, l'acces est refuse par defaut, meme si une politique restrictive devrait autoriser l'operation. L'UPDATE retourne 0 lignes modifiees sans erreur.

## Solution

### Etape 1 : Corriger les politiques de securite (migration SQL)

Changer la politique "Restaurant owners can manage offers" de RESTRICTIVE a PERMISSIVE. Cela permettra aux proprietaires de restaurants de modifier leurs propres offres.

De meme, corriger les autres politiques SELECT sur `offers` qui devraient etre permissives ("Anyone can view active offers", "Users can view offers from own reservations", "Admins can view all offers").

### Etape 2 : Ajouter la gestion d'erreurs dans syncTodayOffer

Dans `src/hooks/useSurpriseBagConfig.ts`, ajouter un log et une verification d'erreur sur l'appel UPDATE pour detecter les echecs futurs.

### Etape 3 : Corriger l'offre existante

L'offre du jour actuellement en base a les mauvais creneaux. Apres la correction des politiques, forcer une synchronisation en rechargeant le dashboard ou en modifiant a nouveau un creneau.

## Detail technique

### Migration SQL

```sql
-- Supprimer les politiques restrictives et les recreer en permissif
DROP POLICY IF EXISTS "Restaurant owners can manage offers" ON offers;
CREATE POLICY "Restaurant owners can manage offers" ON offers
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Anyone can view active offers" ON offers;
CREATE POLICY "Anyone can view active offers" ON offers
  FOR SELECT
  USING (
    is_active = true AND items_left > 0
    AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = offers.restaurant_id
      AND restaurants.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Users can view offers from own reservations" ON offers;
CREATE POLICY "Users can view offers from own reservations" ON offers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.offer_id = offers.id
    AND reservations.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can view all offers" ON offers;
CREATE POLICY "Admins can view all offers" ON offers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### useSurpriseBagConfig.ts -- Ameliorer syncTodayOffer

```typescript
const syncTodayOffer = async (updatedConfig: Partial<SurpriseBagConfig>) => {
  if (!restaurantId) return;
  const today = new Date().toISOString().split("T")[0];
  const offerUpdates: Record<string, any> = {};
  // ... meme logique ...
  if (Object.keys(offerUpdates).length > 0) {
    const { error, count } = await supabase
      .from("offers")
      .update(offerUpdates)
      .eq("restaurant_id", restaurantId)
      .eq("date", today);
    if (error) {
      console.error("Erreur sync offre du jour:", error);
    }
  }
};
```

## Fichiers modifies

1. **Nouvelle migration SQL** -- Corriger les politiques RLS sur la table `offers`
2. **src/hooks/useSurpriseBagConfig.ts** -- Ajouter gestion d'erreurs dans `syncTodayOffer`

