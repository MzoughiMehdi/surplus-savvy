

# Ajout d'une page de detail restaurant dans l'admin

## Probleme actuel

La page `/admin/restaurants` affiche une liste avec nom, adresse, categorie, plan et statut, mais il n'est pas possible de :
- Voir les informations completes d'un restaurant (telephone, description, horaires, image, proprietaire)
- Contacter le proprietaire (email)
- Parcourir les details d'un restaurant specifique

## Ce qui sera fait

### 1. Nouvelle page "Detail Restaurant" (`/admin/restaurants/:id`)

Une page dediee affichant toutes les informations d'un restaurant :

- **Informations generales** : nom, adresse, categorie, description, image
- **Contact** : telephone du restaurant + email du proprietaire (recupere depuis `profiles`)
- **Abonnement** : plan, date de debut, fin de la periode d'essai
- **Statut** : avec boutons d'action (approuver/rejeter/suspendre)
- **Statistiques** : nombre d'offres, nombre de reservations, note moyenne
- **Bouton "Contacter"** : lien `mailto:` vers l'email du proprietaire pour envoyer un email directement

### 2. Modification de la liste des restaurants

- Chaque ligne du tableau deviendra cliquable pour naviguer vers la page de detail
- Ajout d'un bouton "Voir" sur chaque restaurant

### 3. Mise a jour du routage

- Ajout de la route `/admin/restaurants/:id` dans `App.tsx`

## Details techniques

- Nouvelle page : `src/pages/admin/AdminRestaurantDetail.tsx`
- Requete Supabase joignant `restaurants` avec `profiles` (via `owner_id`) pour recuperer l'email et le nom du proprietaire
- Requete RPC `get_restaurant_rating` pour la note moyenne
- Comptage des offres et reservations liees au restaurant
- Navigation avec `react-router-dom` (`useParams`, `useNavigate`)
- Bouton retour vers la liste
- Design coherent avec le reste du back-office (memes composants Card, Badge, Button)

