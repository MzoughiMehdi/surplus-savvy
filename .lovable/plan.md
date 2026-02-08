

# Correction des images manquantes pour Le Fournil et Chez Nadia

## Probleme

Les URLs Unsplash utilisees pour ces deux restaurants pointent vers des photos qui n'existent plus ou sont invalides :
- Le Fournil de Montmartre : `photo-1517433670267-08bbd4be890f`
- Chez Nadia - Traiteur Oriental : `photo-1541518763669-27fef04b14ea`

## Solution

Mettre a jour les URLs dans la base de donnees avec des photos Unsplash valides et verifiees.

## Details techniques

Une migration SQL mettra a jour la colonne `image_url` de la table `restaurants` pour ces deux restaurants :

- **Le Fournil de Montmartre** : photo d'une boulangerie/vitrine de pains (`photo-1504753793650-d4a2b783c15e`)
- **Chez Nadia - Traiteur Oriental** : photo d'un restaurant/cuisine orientale (`photo-1466978913421-dad2ebd01d17`)

```sql
UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=800'
WHERE name = 'Le Fournil de Montmartre';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800'
WHERE name = 'Chez Nadia - Traiteur Oriental';
```

Aucun fichier de code ne sera modifie, seule la base de donnees sera mise a jour.

