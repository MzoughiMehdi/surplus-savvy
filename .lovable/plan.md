

# Correction de la visibilite des offres multiples

## Probleme identifie

Apres verification en base de donnees, le systeme supporte bien plusieurs offres par restaurant. Le probleme vient de deux choses :

1. **L'offre "boti roti" est desactivee** (`is_active = false`) -- elle n'apparait donc pas cote consommateur. Sur le dashboard marchand, le bouton pour activer/desactiver n'est pas assez clair (c'est une icone crayon).

2. **Les offres avec stock a zero** (`items_left = 0`) restent visibles mais ne peuvent pas etre reservees, ce qui est confus.

## Ce qui sera fait

### 1. Ameliorer le dashboard marchand pour mieux gerer les offres

- Remplacer l'icone crayon par un **bouton toggle explicite** "Activer" / "Desactiver" avec couleurs distinctes (vert/gris)
- Ajouter un **badge de statut** ("Active", "Inactive", "Rupture") sur chaque carte d'offre
- Ajouter un **compteur** en haut : "X active(s) sur Y offre(s)"

### 2. Filtrer les offres en rupture de stock cote consommateur

- Dans `useOffers.ts`, ajouter un filtre `items_left > 0` pour ne pas afficher les offres sans stock disponible
- Cela evitera d'afficher des offres que personne ne peut reserver

### 3. Desactiver automatiquement les offres a zero stock (optionnel mais recommande)

- Quand `items_left` atteint 0 apres une reservation, l'offre reste active mais n'est plus visible grace au filtre ci-dessus

## Details techniques

### Fichiers modifies

- **`src/pages/Dashboard.tsx`** :
  - Ajout d'un badge `Active` / `Inactive` / `Rupture` sur chaque offre
  - Remplacement de l'icone `Edit2` par un bouton texte "Activer" / "Desactiver"
  - Ajout d'un compteur d'offres actives en en-tete de section

- **`src/hooks/useOffers.ts`** :
  - Ajout du filtre `.gt("items_left", 0)` dans la requete Supabase pour exclure les offres en rupture de stock cote consommateur

Aucune modification de base de donnees necessaire.

