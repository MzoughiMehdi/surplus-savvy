
# Correction des commandes, stock et paiements automatiques

## Probleme 1 : Stock non mis a jour

Les fonctions de base de donnees (`handle_new_reservation`, `handle_reservation_cancel`, `notify_new_offer`, `notify_restaurant_status_change`) existent mais **aucun trigger n'est attache aux tables**. C'est pour cela que le stock ne se decremente pas quand une reservation est creee.

**Solution** : Creer une migration SQL pour attacher tous les triggers manquants :
- `handle_new_reservation` sur INSERT dans `reservations` (decremente `items_left`, notifie le restaurateur)
- `handle_reservation_cancel` sur UPDATE dans `reservations` (re-incremente `items_left` si annulation)
- `notify_new_offer` sur INSERT dans `offers`
- `notify_restaurant_status_change` sur UPDATE dans `restaurants`

## Probleme 2 : Bouton "Mes commandes" dans le profil

Dans `ProfilePage.tsx`, les elements du menu (dont "Mes commandes") sont des boutons sans gestionnaire `onClick`. Cliquer dessus ne fait rien.

**Solution** : Ajouter un `onClick` sur "Mes commandes" pour que ca bascule vers l'onglet commandes. Comme `ProfilePage` est affiche dans `Index` via un systeme d'onglets (pas via le routeur), il faut passer une callback `onNavigate` en prop depuis `Index.tsx` pour changer l'onglet actif vers "orders".

## Probleme 3 : Payouts pas marques automatiquement

Dans `create-payment`, le payout est cree avec `status: "pending"` meme quand Stripe Connect gere le transfert automatiquement. Comme Stripe Connect transfere les fonds au moment du paiement, quand un `stripe_account_id` existe, le statut devrait etre "paid" directement.

**Solution** : Dans `create-payment/index.ts`, si le restaurant a un `stripe_account_id` (donc Stripe Connect est actif), creer le payout avec `status: "paid"` au lieu de "pending". Seuls les restaurants sans compte Connect garderont le statut "pending" (necessitant un virement manuel).

## Probleme 4 : Cache React Query apres paiement

L'invalidation dans `CheckoutReturnPage` utilise `queryKey: ["reservations"]` ce qui devrait fonctionner (correspondance par prefixe). Mais pour plus de robustesse, invalider aussi `queryKey: ["offers"]` pour que le stock affiche se mette a jour cote client.

## Details techniques

### Migration SQL (nouveau fichier)

```sql
CREATE TRIGGER on_new_reservation
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_reservation();

CREATE TRIGGER on_reservation_cancel
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_cancel();

CREATE TRIGGER on_new_offer
  AFTER INSERT ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_offer();

CREATE TRIGGER on_restaurant_status_change
  AFTER UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.notify_restaurant_status_change();
```

### Fichiers modifies

- **`src/pages/ProfilePage.tsx`** : ajouter prop `onNavigate` et gestionnaire onClick sur "Mes commandes" pour basculer vers l'onglet orders
- **`src/pages/Index.tsx`** : passer `onNavigate={setActiveTab}` en prop a `ProfilePage`
- **`supabase/functions/create-payment/index.ts`** : changer le status du payout a "paid" quand `stripeAccountId` est present
- **`src/pages/CheckoutReturnPage.tsx`** : ajouter invalidation de `["offers"]` pour rafraichir le stock cote client
