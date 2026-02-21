

# Correction du geocodage pour "Aam hbib" (36 rue Lecourbe)

## Probleme

Le restaurant "Aam hbib" n'apparait pas sur la carte car ses coordonnees (`latitude`, `longitude`) sont `null` en base de donnees. La carte filtre les offres sans coordonnees et les ignore.

**Cause racine** : le champ `address` contient `"36 rue lecourbe, 75015 Paris"` alors que `postal_code` et `city` sont deja remplis separement. La fonction de geocodage construit donc une adresse redondante (`"36 rue lecourbe, 75015 Paris, 75015 Paris"`) qui echoue sur Nominatim.

## Corrections prevues

### 1. Migration SQL : corriger l'adresse

Nettoyer le champ `address` pour ne garder que la rue. Le code postal et la ville restent dans leurs champs respectifs.

```sql
UPDATE restaurants
SET address = '36 Rue Lecourbe'
WHERE id = 'fc7cc11c-0587-47bc-8378-e6a9b77c0ee8';
```

### 2. Appeler la fonction de geocodage

Invoquer la fonction backend `geocode-restaurants` pour qu'elle calcule les coordonnees GPS du restaurant a partir de l'adresse corrigee. Cela remplira les champs `latitude` et `longitude`.

### 3. Prevention : valider les adresses a la saisie

Modifier le formulaire d'onboarding (`src/pages/MerchantOnboarding.tsx`) pour :
- Rendre le champ `address` plus clair avec un placeholder explicite ("Numero et nom de rue uniquement")
- S'assurer que les champs `postal_code` et `city` sont obligatoires
- Empecher que l'adresse complete (avec code postal et ville) soit saisie dans le champ rue

## Resume des fichiers

| Fichier | Action |
|---|---|
| Migration SQL | Corriger l'adresse du restaurant |
| Appel edge function | Relancer le geocodage |
| `src/pages/MerchantOnboarding.tsx` | Ameliorer les indications du formulaire d'adresse |

