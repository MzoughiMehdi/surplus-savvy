

# Correction du badge "Nouveau" qui reste chez le commerçant

## Problème

Le commerçant ne peut pas mettre à jour le flag `merchant_unread` car la table `support_messages` n'a **aucune politique RLS pour UPDATE côté commerçant**. Seuls les admins ont le droit de modifier les messages. L'appel `update({ merchant_unread: false })` échoue silencieusement, et le badge "1" reste affiché en permanence.

## Correction

### Migration SQL

Ajouter une politique RLS permettant aux propriétaires de restaurants de mettre à jour les messages liés à leur restaurant :

```sql
CREATE POLICY "Owners can update own messages"
ON public.support_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = support_messages.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = support_messages.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);
```

Aucun changement de code nécessaire. Le code existant dans `Dashboard.tsx` est correct : il appelle bien `update({ merchant_unread: false })` puis `onUnreadChange()`. C'est uniquement la permission en base qui manquait.

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter la politique RLS "Owners can update own messages" |
