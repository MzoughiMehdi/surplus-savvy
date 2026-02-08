

# Corriger les offres en double sur la page d'accueil

## Probleme

Chaque restaurant de demo a **2 offres differentes** inserees manuellement (ex: "Panier Viennoiseries" + "Panier Pains Artisanaux"). Le modele economique prevoit **un seul panier surprise par restaurant par jour**, genere automatiquement.

De plus, le restaurant "nooba" a une ancienne offre manuelle ("Jdjd") sans date qui s'affiche aussi.

## Solution

### 1. Nettoyer la base de donnees
Supprimer toutes les offres de demo et ne garder qu'une seule offre par restaurant pour aujourd'hui :

```sql
-- Supprimer les offres des restaurants de demo
DELETE FROM offers
WHERE restaurant_id IN (
  'a1000001-0000-0000-0000-000000000001',
  'a1000002-0000-0000-0000-000000000002',
  'a1000003-0000-0000-0000-000000000003',
  'a1000004-0000-0000-0000-000000000004',
  'a1000005-0000-0000-0000-000000000005',
  'a1000006-0000-0000-0000-000000000006'
);

-- Supprimer l'offre manuelle "Jdjd" sans date
DELETE FROM offers WHERE id = '0be1a96f-81d7-4abe-b9d6-21f2437822cd';

-- Re-inserer une seule offre par restaurant de demo pour aujourd'hui
INSERT INTO offers (restaurant_id, title, description, original_price, discounted_price, quantity, items_left, pickup_start, pickup_end, category, date, is_active) VALUES
('a1000001-0000-0000-0000-000000000001', 'Panier surprise', 'Un assortiment surprise de nos meilleurs produits du jour', 12.00, 4.80, 5, 5, '18:00', '20:00', 'bakery', CURRENT_DATE, true),
('a1000002-0000-0000-0000-000000000002', 'Panier surprise', 'Un assortiment surprise de nos meilleurs produits du jour', 18.00, 7.20, 5, 5, '18:00', '20:00', 'sushi', CURRENT_DATE, true),
('a1000003-0000-0000-0000-000000000003', 'Panier surprise', 'Un assortiment surprise de nos meilleurs produits du jour', 15.00, 6.00, 5, 5, '18:00', '20:00', 'grocery', CURRENT_DATE, true),
('a1000004-0000-0000-0000-000000000004', 'Panier surprise', 'Un assortiment surprise de nos meilleurs produits du jour', 16.00, 6.40, 5, 5, '18:00', '20:00', 'dessert', CURRENT_DATE, true),
('a1000005-0000-0000-0000-000000000005', 'Panier surprise', 'Un assortiment surprise de nos meilleurs produits du jour', 14.00, 5.60, 5, 5, '18:00', '20:00', 'meals', CURRENT_DATE, true),
('a1000006-0000-0000-0000-000000000006', 'Panier surprise', 'Un assortiment surprise de nos meilleurs produits du jour', 18.00, 7.20, 5, 5, '18:00', '20:00', 'meals', CURRENT_DATE, true);
```

### 2. Ajouter une contrainte d'unicite en base
Pour empecher qu'un restaurant ait plus d'une offre par jour a l'avenir :

```sql
CREATE UNIQUE INDEX unique_offer_per_restaurant_per_day
ON offers (restaurant_id, date)
WHERE is_active = true;
```

Cela garantit qu'un seul panier surprise actif peut exister par restaurant et par jour.

### Resultat
- Un seul panier par restaurant sur la page d'accueil
- Prix uniformes a -60%
- Impossible de creer des doublons a l'avenir

Aucun fichier de code ne sera modifie.
