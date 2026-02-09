

# Correction de l'onglet Signalements

## Probleme

La requete dans `AdminReports.tsx` utilise des jointures PostgREST (`restaurants(name)`, `profiles:user_id(email, full_name)`) mais la table `reports` n'a **aucune foreign key** definie. PostgREST retourne donc une erreur 400 :

```
Could not find a relationship between 'reports' and 'restaurants'
```

Cela provoque des tentatives repetees (retry) qui donnent l'impression de lenteur, et aucun signalement ne s'affiche.

## Solution

### 1. Migration SQL : ajouter les foreign keys manquantes

Ajouter trois contraintes de cle etrangere sur la table `reports` :

```sql
ALTER TABLE public.reports
  ADD CONSTRAINT reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.reports
  ADD CONSTRAINT reports_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reservation_id_fkey
  FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);
```

Ces foreign keys permettront a PostgREST de resoudre correctement les jointures dans la requete existante.

### 2. Aucune modification de code necessaire

Le code de `AdminReports.tsx` est deja correct. Une fois les foreign keys ajoutees, la requete `.select("*, restaurants(name), profiles:user_id(email, full_name)")` fonctionnera sans erreur.

## Resume

| Element | Action |
|---|---|
| Migration SQL | Ajouter 3 foreign keys sur la table `reports` |
| Code | Aucun changement |

## Resultat attendu

Apres la migration, les signalements s'afficheront immediatement avec le nom du restaurant et du consommateur, sans lenteur.

