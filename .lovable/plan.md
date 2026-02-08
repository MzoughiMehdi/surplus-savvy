

# Correction des "Euros economises" sur la page Profil

## Probleme identifie

La requete pour calculer les statistiques retourne bien les reservations completees, mais le champ `offers` est `null` car les politiques de securite de la base de donnees bloquent l'acces aux offres.

Actuellement, un consommateur ne peut voir une offre que si elle est active ET que le restaurant est approuve. Or, une offre reservee dans le passe peut avoir ete desactivee depuis, ce qui rend la jointure impossible.

## Solution

### 1. Ajouter une politique de securite en base de donnees

Creer une nouvelle politique RLS sur la table `offers` qui permet aux utilisateurs de voir les offres liees a leurs propres reservations, meme si ces offres sont desactivees :

```sql
CREATE POLICY "Users can view offers from own reservations"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.offer_id = offers.id
      AND reservations.user_id = auth.uid()
    )
  );
```

### 2. Aucune modification de code necessaire

Le code dans `ProfilePage.tsx` est correct. Une fois la politique ajoutee, la jointure `offers(discounted_price, original_price)` retournera les bonnes valeurs au lieu de `null`.

## Fichiers impactes

- **Migration SQL uniquement** : ajout d'une politique RLS sur la table `offers`
- Aucun fichier TypeScript a modifier
