
# Supprimer l'abonnement et le bouton "Voir mon compte" Stripe

## Contexte

Le systeme d'abonnement (29EUR/mois avec essai gratuit) n'est plus necessaire. Les marchands peuvent creer des offres librement. Le bouton "Voir mon compte" Stripe Connect (qui pose des problemes de navigation dans le sandbox) doit aussi etre retire quand le compte est actif.

## Modifications

### 1. `src/pages/Dashboard.tsx`

- **Supprimer le bloc "Abonnement"** (lignes 491-518) : la carte avec CreditCard, plan, essai gratuit, bouton "Gerer" et bouton checkout
- **Supprimer l'import de `useSubscription` et `MERCHANT_PLAN`** (ligne 13)
- **Supprimer `const subscription = useSubscription()`** (ligne 393)
- **Supprimer le calcul `trialDaysLeft`** (lignes 447-449)
- **Supprimer la carte "Plan" dans les stats** (lignes 541-545) qui affiche `subscription_plan`
- **Dans `ConnectSection`** : retirer le bouton "Voir mon compte" et les variables `dashboardLoading` / `handleOpenStripeDashboard`. Quand le compte est actif, afficher seulement le badge "Actif" sans bouton.
- **Nettoyer les imports inutilises** (`CreditCard`, `ExternalLink` si plus utilise ailleurs, `Loader2` dans ConnectSection si plus utilise)

### 2. `src/hooks/useSubscription.ts`

- **Supprimer le fichier** entierement (plus utilise nulle part apres les changements)

### 3. `src/pages/MerchantOnboarding.tsx`

- **Supprimer `subscription_plan: "trial"`** de l'insertion du restaurant (ligne 107). Laisser le champ vide ou ne pas l'inclure.

### 4. `src/pages/admin/AdminRestaurants.tsx`

- **Supprimer la colonne "Plan"** du tableau et les appels a `manage-subscription-status` dans les fonctions suspend/reactivate

### 5. `src/pages/admin/AdminRestaurantDetail.tsx`

- **Supprimer la carte "Abonnement"** (subscription_plan, subscription_start, trial_ends_at)
- **Supprimer les appels a `manage-subscription-status`** dans suspend/reactivate

### 6. `src/pages/admin/AdminAnalytics.tsx`

- **Supprimer les statistiques par plan d'abonnement** (planMap)

### 7. Edge Functions (nettoyage optionnel)

- Les fonctions `check-subscription`, `create-checkout`, `customer-portal`, `manage-subscription-status` ne seront plus appelees. Elles peuvent etre supprimees pour garder le projet propre.

## Resume des fichiers touches

| Fichier | Action |
|---|---|
| `src/pages/Dashboard.tsx` | Retirer bloc abonnement, bouton "Voir mon compte", imports lies |
| `src/hooks/useSubscription.ts` | Supprimer le fichier |
| `src/pages/MerchantOnboarding.tsx` | Retirer `subscription_plan: "trial"` |
| `src/pages/admin/AdminRestaurants.tsx` | Retirer colonne Plan et appels manage-subscription-status |
| `src/pages/admin/AdminRestaurantDetail.tsx` | Retirer carte Abonnement et appels manage-subscription-status |
| `src/pages/admin/AdminAnalytics.tsx` | Retirer stats par plan |
| Edge functions (4 fichiers) | Supprimer check-subscription, create-checkout, customer-portal, manage-subscription-status |
