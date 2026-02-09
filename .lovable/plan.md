

# Correction de l'onglet Reservations admin

## Probleme

Le meme probleme que pour les Signalements : la requete utilise `profiles:user_id(email, full_name)` mais PostgREST ne peut pas resoudre cette jointure car il n'y a pas de FK directe entre `reservations` et `profiles`.

Cela provoque une erreur 400, des retries en boucle, et rien ne s'affiche.

## Solution

Appliquer la meme approche que pour `AdminReports.tsx` : separer la requete en deux etapes.

### Fichier modifie : `src/pages/admin/AdminReservations.tsx`

Dans le `queryFn` de la requete `admin-reservations` :

1. Remplacer `.select("*, restaurants(name), offers(title), profiles:user_id(email, full_name)")` par `.select("*, restaurants(name), offers(title)")`
2. Extraire les `user_id` uniques des resultats
3. Faire une seconde requete vers `profiles` pour recuperer `user_id, email, full_name`
4. Fusionner les donnees avec un `Map` cote client

### Code concret

```typescript
// Etape 1 : reports sans profiles
const { data, error } = await query;
if (error) throw error;

const reservations = data as any[];
if (reservations.length === 0) return reservations;

// Etape 2 : profils a part
const userIds = [...new Set(reservations.map((r) => r.user_id))];
const { data: profiles } = await supabase
  .from("profiles")
  .select("user_id, email, full_name")
  .in("user_id", userIds);

const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
return reservations.map((r) => ({
  ...r,
  profiles: profileMap.get(r.user_id) ?? null,
}));
```

## Resume

| Fichier | Modification |
|---|---|
| `src/pages/admin/AdminReservations.tsx` | Supprimer jointure `profiles:user_id`, fetch profils separement |

## Resultat attendu

Les reservations s'afficheront immediatement avec le nom/email du consommateur, le restaurant, l'offre, la date, le statut et le code retrait.
