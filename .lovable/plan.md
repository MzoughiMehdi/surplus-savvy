

# Mise a jour des stats profil + suppression de l'annulation

## Problemes identifies

1. **Les stats ne se mettent pas a jour** : Le cache React Query (`queryKey: ["profile-stats", user.id]`) n'est jamais invalide apres une nouvelle commande. Quand l'utilisateur revient sur l'onglet Profil, il voit les anciennes valeurs.

2. **L'annulation de reservation est encore possible** : Le bouton "Annuler la reservation" apparait sur les commandes confirmees, dans `OrdersPage.tsx` et `ReservationConfirmation.tsx`.

## Solution

### 1. Invalider le cache des stats apres une commande

Dans `CheckoutReturnPage.tsx`, apres la creation reussie d'une reservation, appeler `queryClient.invalidateQueries({ queryKey: ["profile-stats"] })` pour forcer le rechargement des stats au prochain affichage du profil.

### 2. Retirer la possibilite d'annuler une reservation

- **`OrdersPage.tsx`** : Supprimer la fonction `cancelReservation` et ne plus passer `onCancel` au composant `ReservationConfirmation`
- **`ReservationConfirmation.tsx`** : Supprimer la prop `onCancel` de l'interface et retirer le bouton "Annuler la reservation"

## Fichiers modifies

- **`src/pages/CheckoutReturnPage.tsx`** : Ajouter `useQueryClient` et invalider le cache `profile-stats` apres creation de reservation
- **`src/pages/OrdersPage.tsx`** : Supprimer `cancelReservation` et la prop `onCancel`
- **`src/components/ReservationConfirmation.tsx`** : Supprimer la prop `onCancel` et le bouton d'annulation

