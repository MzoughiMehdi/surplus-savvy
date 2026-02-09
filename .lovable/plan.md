

# Correction de la requete Signalements

## Probleme

La migration a ajoute une FK `reports.user_id -> auth.users.id`, mais le code fait `profiles:user_id(email, full_name)`. PostgREST ne peut pas joindre `reports` a `profiles` car il n'y a pas de FK directe entre ces deux tables (elles partagent simplement le meme `user_id` via `auth.users`).

Erreur exacte :
```
Could not find a relationship between 'reports' and 'user_id' in the schema cache
```

## Solution

Modifier `src/pages/admin/AdminReports.tsx` pour supprimer la jointure `profiles:user_id(...)` et recuperer les donnees en deux etapes :

1. Requete principale : `reports` avec jointure `restaurants(name)` uniquement (celle-ci fonctionne grace a la FK ajoutee)
2. Requete secondaire : recuperer les profils des utilisateurs concernes depuis la table `profiles`

Alternativement (plus simple) : faire la requete sans jointure sur profiles, et afficher le `user_id` ou faire un appel separe.

### Approche retenue : requete sans jointure profiles

Remplacer la requete :
```typescript
.select("*, restaurants(name), profiles:user_id(email, full_name)")
```

Par :
```typescript
.select("*, restaurants(name)")
```

Puis faire une seconde requete pour recuperer les profils des utilisateurs presents dans les resultats.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/pages/admin/AdminReports.tsx` | Separer la requete en 2 : reports + restaurants, puis profils a part |

### Detail technique

Dans le `queryFn` :
1. Fetch les reports avec `.select("*, restaurants(name)")`
2. Extraire les `user_id` uniques des resultats
3. Fetch les profils correspondants avec `.from("profiles").select("user_id, email, full_name").in("user_id", userIds)`
4. Fusionner les donnees cote client

Le reste du composant (affichage, filtres, dialog) reste inchange, il suffit d'adapter l'acces aux donnees profil.

