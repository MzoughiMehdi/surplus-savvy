

# Correction : Offres de demain invisibles pour les utilisateurs non connectes

## Probleme

Les tables `surprise_bag_config` et `daily_overrides` n'ont pas de politique RLS permettant la lecture publique. Seuls les admins et les proprietaires de restaurants peuvent les consulter. Un utilisateur non connecte (invite) recoit donc une liste vide.

## Correction

Ajouter des politiques RLS `SELECT` publiques sur ces deux tables, similaires a ce qui existe deja pour la table `offers` et `restaurants` (qui sont lisibles par tous) :

### Migration SQL

```sql
-- Permettre a tous de lire les configs actives (pour afficher les offres de demain)
CREATE POLICY "Public can view active configs"
  ON surprise_bag_config FOR SELECT
  USING (is_active = true);

-- Permettre a tous de lire les overrides (pour filtrer les suspensions)
CREATE POLICY "Public can view daily overrides"
  ON daily_overrides FOR SELECT
  USING (true);
```

Ces donnees ne sont pas sensibles : elles contiennent uniquement les creneaux horaires, quantites et prix des offres, exactement les memes informations deja visibles via la table `offers`.

### Aucun changement de code

Le hook `useTomorrowOffers` fonctionne deja correctement. Le probleme est uniquement au niveau des permissions de la base de donnees.
