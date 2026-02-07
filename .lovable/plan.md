

# Corriger la visibilite des offres des restaurants non approuves

## Probleme
La politique de securite sur la table `offers` permet a quiconque de voir les offres actives (`is_active = true`) sans verifier que le restaurant associe a un statut `approved`. Resultat : les offres de restaurants en attente de validation sont visibles par les consommateurs.

## Solution
Modifier la politique RLS "Anyone can view active offers" pour ajouter une verification du statut du restaurant.

### Changement de politique RLS

Remplacer la politique actuelle :
```text
USING (is_active = true)
```

Par une politique qui verifie aussi le statut du restaurant :
```text
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.status = 'approved'
  )
)
```

### Impact
- Les offres de restaurants en attente (`pending`) ou rejetes (`rejected`) ne seront plus visibles par les consommateurs
- Les proprietaires de restaurants pourront toujours voir et gerer leurs propres offres (via la politique existante "Restaurant owners can manage offers")
- Les admins pourront toujours voir toutes les offres (via la politique existante "Admins can view all offers")
- Aucun changement de code frontend necessaire

