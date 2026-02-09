
# Suspension des restaurants avec pause d'abonnement, masquage des offres et page Paiements

## 1. Suspension des restaurants (statut "suspended")

Le bouton "Suspendre" utilise actuellement le statut `"rejected"`, ce qui est incorrect. On introduit un statut `"suspended"` distinct.

### Fichiers modifies

**`src/pages/admin/AdminRestaurants.tsx`**
- Ajouter `suspended` dans `statusColors` (style orange/warning)
- Bouton "Suspendre" passe le statut a `"suspended"` au lieu de `"rejected"`
- Ajouter l'option "Suspendus" dans le filtre Select
- Afficher icone et label pour `suspended` (icone `PauseCircle`)
- Pour les restaurants suspendus, afficher le bouton "Reactiver"
- Lors de la suspension : desactiver toutes les offres actives du restaurant ET pause de l'abonnement Stripe via une edge function

**`src/pages/admin/AdminRestaurantDetail.tsx`**
- Ajouter `suspended` dans `statusConfig` (label "Suspendu", icone `PauseCircle`, style orange)
- Bouton "Suspendre" passe le statut a `"suspended"`
- Ajouter bouton "Reactiver" pour les suspendus
- Lors de la suspension : appel a la meme edge function pour desactiver offres + pause abonnement
- Lors de la reactivation : appel a l'edge function pour reprendre l'abonnement

## 2. Masquer instantanement les offres d'un restaurant suspendu

Quand un admin suspend un restaurant, toutes ses offres actives sont desactivees immediatement via :
```sql
UPDATE offers SET is_active = false WHERE restaurant_id = :id AND is_active = true
```

La fonction `generate_daily_offers()` filtre deja sur `r.status = 'approved'`, donc aucune nouvelle offre ne sera generee tant que le restaurant reste suspendu.

A la reactivation, les offres ne sont pas re-activees automatiquement ; elles seront regenerees le lendemain par `generate_daily_offers()`.

## 3. Suspendre / reprendre l'abonnement Stripe

### Nouvelle edge function : `supabase/functions/manage-subscription-status/index.ts`

Cette fonction permet a l'admin de mettre en pause ou reprendre l'abonnement Stripe d'un commercant.

**Logique :**
- Recoit `{ restaurantId, action: "pause" | "resume" }` en body
- Verifie que l'appelant est admin (via `user_roles`)
- Recupere le `owner_id` du restaurant, puis l'email du proprietaire depuis `profiles`
- Cherche le customer Stripe par email
- Recupere l'abonnement actif
- **Pause** : `stripe.subscriptions.update(subId, { pause_collection: { behavior: "void" } })` -- l'abonnement reste actif mais aucune facture n'est generee
- **Resume** : `stripe.subscriptions.update(subId, { pause_collection: null })` -- reprend la facturation

Cette approche ne supprime pas l'abonnement, elle le met simplement en pause. Le commercant ne sera pas facture pendant la suspension.

### Configuration
- Ajouter `[functions.manage-subscription-status] verify_jwt = false` dans `supabase/config.toml`

## 4. Page Paiements dediee avec filtres

### Nouveau fichier : `src/pages/admin/AdminPayouts.tsx`

Page dediee avec :
- **Filtre par commercant** : Select avec la liste des restaurants
- **Filtre par date** : Champs date de debut et date de fin
- **Filtre par statut** : Select "Tous" / "En attente" / "Payes"
- Bouton "Marquer paye" conserve
- Requetes Supabase filtrees cote serveur

### `src/pages/admin/AdminSettings.tsx`
- Supprimer la section "Historique des paiements" (tout le bloc lignes 33-44 et 217-267)
- Supprimer les imports inutiles (`Euro`, `CheckCircle`, `Clock` pour payouts, `formatDistanceToNow`, `fr`)

### `src/pages/admin/AdminLayout.tsx`
- Ajouter "Paiements" dans `navItems` avec icone `Euro`, url `/admin/payouts`

### `src/App.tsx`
- Ajouter la route `<Route path="payouts" element={<AdminPayouts />} />`

## Resume des fichiers

| Fichier | Action |
|---|---|
| `src/pages/admin/AdminRestaurants.tsx` | Modifier (statut suspended + desactivation offres + appel edge function) |
| `src/pages/admin/AdminRestaurantDetail.tsx` | Modifier (statut suspended + desactivation offres + appel edge function) |
| `supabase/functions/manage-subscription-status/index.ts` | Creer (pause/resume abonnement Stripe) |
| `supabase/config.toml` | Modifier (ajouter config edge function) |
| `src/pages/admin/AdminPayouts.tsx` | Creer (page filtrable) |
| `src/pages/admin/AdminSettings.tsx` | Modifier (retirer section payouts) |
| `src/pages/admin/AdminLayout.tsx` | Modifier (ajouter nav Paiements) |
| `src/App.tsx` | Modifier (ajouter route payouts) |

## Flux de suspension complet

1. Admin clique "Suspendre" sur un restaurant
2. Le statut passe a `"suspended"` en base
3. Toutes les offres actives du restaurant sont desactivees (`is_active = false`)
4. L'edge function `manage-subscription-status` est appelee avec `action: "pause"` pour mettre en pause l'abonnement Stripe
5. Le commercant recoit une notification de changement de statut (trigger existant)
6. Les consommateurs ne voient plus les offres du restaurant

## Flux de reactivation

1. Admin clique "Reactiver"
2. Le statut repasse a `"approved"`
3. L'edge function est appelee avec `action: "resume"` pour reprendre la facturation
4. Les offres seront regenerees le lendemain par `generate_daily_offers()`
