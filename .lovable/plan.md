
# Correction des 6 problemes identifies

## 1. Double payout dans verify-payment

**Fichier** : `supabase/functions/verify-payment/index.ts`

Supprimer le bloc de creation de payout (lignes 116-141) qui enregistre un payout pour les reservations non-demain. Puisque toutes les reservations utilisent maintenant `capture_method: "manual"`, le payout doit etre cree uniquement dans `capture-payment` au moment de la capture reelle des fonds.

Le bloc a supprimer :
```
// Record the payout split after successful payment (only for immediate capture)
if (restaurantId && !isTomorrowBooking) { ... }
```

## 2. Protection des routes /dashboard et /admin

**Fichier** : `src/App.tsx`

Creer un composant `ProtectedRoute` qui verifie l'authentification et le role avant de rendre la page :

- `/dashboard` : accessible uniquement aux utilisateurs connectes avec le role `merchant`
- `/admin` : accessible uniquement aux utilisateurs connectes avec le role `admin` (remplace la verification interne de `AdminLayout`)
- `/checkout` et `/checkout-return` : accessibles uniquement aux utilisateurs connectes
- Redirection vers `/auth` si non connecte
- Affichage d'un loader pendant le chargement de l'authentification

```text
<Route path="/dashboard" element={
  <ProtectedRoute role="merchant">
    <Dashboard />
  </ProtectedRoute>
} />
```

Le composant utilisera `useAuth()` pour verifier `user`, `loading`, `profileLoading`, `profile.role` et `isAdmin`.

## 3. generate_daily_offers() appele une seule fois

**Fichier** : `src/hooks/useOffers.ts`

Remplacer l'appel systematique a `supabase.rpc('generate_daily_offers')` par un mecanisme qui ne l'execute qu'une fois par session :

- Utiliser une variable de module (`let hasGenerated = false`) en dehors du hook
- Verifier cette variable avant d'appeler le RPC
- La mettre a `true` apres le premier appel
- Les chargements suivants (navigation, remontage du composant) ne declencheront plus la RPC

## 4. Navigation avec React Router (consommateur)

**Fichiers** : `src/App.tsx`, `src/pages/Index.tsx`, `src/components/BottomNav.tsx`

Transformer les onglets du consommateur en sous-routes React Router :

- Ajouter les routes `/home/explore`, `/home/orders`, `/home/favorites`, `/home/profile` dans `App.tsx`
- Modifier `Index.tsx` pour utiliser `useLocation` et `Outlet` au lieu de `activeTab`
- Modifier `BottomNav` pour utiliser `useNavigate` avec les chemins au lieu d'un callback `onNavigate`
- Le bouton retour du navigateur fonctionnera entre les onglets
- Les URLs seront bookmarkables

Pour le dashboard commercant, meme approche avec les sous-routes `/dashboard/reservations`, `/dashboard/commandes`, `/dashboard/stats`.

## 5. Dashboard commercant optimiste

**Fichier** : `src/pages/Dashboard.tsx`

Modifier les actions Accepter / Refuser / Marquer comme retire dans `ReservationCard` :

- **Mise a jour optimiste** : modifier `reservations` via `setReservations` immediatement au clic
- **Parallelisation** : lancer le `update` DB et l'appel `capture-payment` en `Promise.all`
- **Suppression de `fetchData()`** apres chaque action
- **State de chargement cible** : `loadingReservationId` pour desactiver uniquement les boutons de la carte en cours
- **Rollback en cas d'erreur** : restaurer l'etat precedent et afficher un toast d'erreur

Passer `setReservations` et `loadingReservationId` en props de `ReservationCard` au lieu de `fetchData`.

## 6. Cle Stripe en variable d'environnement

**Fichier** : `src/pages/CheckoutPage.tsx`

Remplacer la cle Stripe en dur (ligne 8) par une variable d'environnement :

```typescript
// Avant
const stripePromise = loadStripe("pk_test_51SyE0d...");

// Apres
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");
```

Ajouter `VITE_STRIPE_PUBLISHABLE_KEY` dans le fichier `.env` avec la valeur actuelle.

---

## Ordre d'implementation

1. verify-payment (suppression payout) + deploiement
2. CheckoutPage (variable d'environnement Stripe)
3. useOffers (appel RPC une seule fois)
4. ProtectedRoute + App.tsx (protection des routes)
5. Navigation React Router (Index + BottomNav + Dashboard + App.tsx)
6. Dashboard optimiste (ReservationCard)

Les points 1-3 sont des corrections rapides et independantes. Les points 4-6 touchent la navigation et le Dashboard et seront faits dans l'ordre pour eviter les conflits.
