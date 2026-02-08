

# Ajout de restaurants de test avec comptes marchands individuels

## Objectif

Creer 6 comptes utilisateurs marchands distincts (chacun avec email/mot de passe) et associer a chacun un restaurant avec des paniers. Tu pourras te connecter avec chaque compte pour configurer les paiements Stripe, modifier les parametres, et faire tes tests.

## Comptes marchands crees

| Restaurant | Categorie | Email | Mot de passe |
|---|---|---|---|
| Le Fournil de Montmartre | Boulangerie | fournil.test@yopmail.com | Test1234! |
| Sakura Sushi | Sushi | sakura.test@yopmail.com | Test1234! |
| L'Epicerie Verte | Epicerie | epicerie.test@yopmail.com | Test1234! |
| Cafe des Arts | Cafe | cafearts.test@yopmail.com | Test1234! |
| Le Bistrot du Marche | Bistrot | bistrot.test@yopmail.com | Test1234! |
| Chez Nadia - Traiteur Oriental | Traiteur | nadia.test@yopmail.com | Test1234! |

## Ce qui sera cree pour chaque restaurant

- Un compte utilisateur avec le role "merchant" dans le profil
- Un restaurant avec statut "approved", adresse parisienne, photo Unsplash
- 2 offres/paniers avec photos, prix, creneaux de retrait et stock
- Une configuration de panier surprise (surprise_bag_config)

## Implementation technique

### Etape 1 : Creer les 6 comptes utilisateurs

Utiliser une edge function temporaire qui cree les utilisateurs via le Supabase Admin API (service role). Chaque utilisateur recevra :
- Un profil avec `role = 'merchant'`
- Un email et mot de passe fixes

### Etape 2 : Migration SQL pour les donnees

Une fois les user IDs recuperes, inserer via migration SQL :
- 6 restaurants (un par owner_id) avec photos Unsplash et statut "approved"
- 12 offres (2 par restaurant) avec des photos variees, prix reduits realistes, et stock
- 6 configurations surprise_bag_config

### Etape 3 : Nettoyage

Supprimer la edge function temporaire apres l'insertion.

### Photos utilisees (Unsplash, libres de droits)

- Boulangerie : pain, croissants, viennoiseries
- Sushi : plateaux sushi, bento
- Epicerie : fruits/legumes, produits bio
- Cafe : patisseries, brunch
- Bistrot : plats du marche, cuisine francaise
- Traiteur oriental : mezze, plats orientaux

### Fichiers crees/modifies

- `supabase/functions/seed-test-merchants/index.ts` (temporaire) : cree les 6 comptes
- Migration SQL : insere restaurants, offres, configs
- Suppression de la edge function apres usage

