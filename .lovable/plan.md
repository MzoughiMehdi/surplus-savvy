

# Correction commandes + Stripe Connect pour les paiements restaurants

## 1. Correction de l'onglet commandes

**Probleme** : Apres un paiement, l'utilisateur est redirige vers `/?tab=orders` mais les donnees ne se rechargent pas.

**Solution** : Convertir `OrdersPage.tsx` pour utiliser `useQuery` avec la cle `["reservations", user.id]`, puis dans `CheckoutReturnPage.tsx` invalider cette cle apres la creation de la reservation.

## 2. Systeme de commission avec Stripe Connect

Stripe Connect permet de diviser automatiquement chaque paiement entre la plateforme et le restaurant. Pas de virement manuel : Stripe s'occupe de tout.

### Comment ca marche

```text
Exemple : commande de 10 EUR, taux plateforme = 50%

Client paie 10 EUR via Stripe
          |
          v
Stripe divise automatiquement :
  - 5 EUR pour la plateforme (vous)
  - 5 EUR pour le restaurant (compte connecte)
```

### Onboarding restaurant

Chaque restaurateur devra passer par un formulaire Stripe (heberge par Stripe) ou il renseignera :
- Son IBAN
- Ses informations legales (identite, adresse, etc.)

Le restaurateur n'a PAS besoin de creer un compte Stripe lui-meme. Un bouton dans son dashboard lancera le processus d'onboarding automatiquement.

### Ce qui sera mis en place

#### Nouvelles tables en base de donnees

**`platform_settings`** : stocke le taux de commission global
- `id` (uuid, PK)
- `commission_rate` (integer, defaut 50, de 0 a 100)
- `updated_at`, `updated_by`
- Une seule ligne, inseree par defaut
- RLS : lecture pour tous les authentifies, ecriture pour admins uniquement

**`restaurant_payouts`** : enregistre chaque repartition apres une commande
- `id` (uuid, PK)
- `reservation_id` (uuid, FK)
- `restaurant_id` (uuid, FK)
- `total_amount`, `commission_rate`, `platform_amount`, `restaurant_amount`
- `status` (pending / paid)
- `stripe_transfer_id` (text, nullable) -- ID du transfert Stripe
- RLS : admins voient tout, marchands voient les leurs

**Modification de `restaurants`** : ajout d'un champ `stripe_account_id` (text, nullable) -- ID du compte Stripe Connect du restaurant

#### Nouvelles Edge Functions

**`create-connect-account`** : cree un compte Stripe Connect Express pour un restaurant et retourne le lien d'onboarding
- Verifie l'authentification
- Cree un compte Stripe Express avec le pays et l'email du proprietaire
- Sauvegarde le `stripe_account_id` dans la table `restaurants`
- Retourne l'URL d'onboarding Stripe

**`check-connect-status`** : verifie si le compte Connect du restaurant est operationnel (charges_enabled)
- Retourne le statut d'onboarding (complet ou en attente)

#### Modifications de l'Edge Function existante

**`create-payment`** : modifier pour utiliser Stripe Connect
- Lire le taux de commission depuis `platform_settings`
- Recuperer le `stripe_account_id` du restaurant
- Ajouter `payment_intent_data.application_fee_amount` a la session Stripe pour definir la part plateforme
- Ajouter `payment_intent_data.transfer_data.destination` pour diriger le reste vers le compte Connect du restaurant
- Creer une entree dans `restaurant_payouts` avec le detail de la repartition

#### Nouvelles pages / modifications UI

**`src/pages/admin/AdminSettings.tsx`** (nouveau) : page admin pour :
- Modifier le taux de commission global (slider ou champ numerique)
- Voir la liste des paiements recents avec le detail de la repartition
- Filtrer par statut (pending / paid)

**`src/pages/admin/AdminLayout.tsx`** : ajouter "Parametres" dans la navigation laterale

**`src/App.tsx`** : ajouter la route `/admin/settings`

**`src/pages/Dashboard.tsx`** : ajouter une section "Paiements" dans le dashboard marchand :
- Bouton "Configurer mes paiements" qui lance l'onboarding Stripe Connect
- Statut du compte Connect (en attente / actif)
- Historique des reversements recus

**`src/pages/OrdersPage.tsx`** : refactoring avec `useQuery`

**`src/pages/CheckoutReturnPage.tsx`** : invalider `["reservations"]`

## Fichiers impactes

- **Migrations SQL** : 2 nouvelles tables + modification de `restaurants`
- **`supabase/functions/create-connect-account/index.ts`** (nouveau)
- **`supabase/functions/check-connect-status/index.ts`** (nouveau)
- **`supabase/functions/create-payment/index.ts`** (modifie)
- **`supabase/config.toml`** (ajouter les 2 nouvelles fonctions)
- **`src/pages/OrdersPage.tsx`** (refactoring useQuery)
- **`src/pages/CheckoutReturnPage.tsx`** (invalider reservations)
- **`src/pages/admin/AdminSettings.tsx`** (nouveau)
- **`src/pages/admin/AdminLayout.tsx`** (ajout lien Parametres)
- **`src/App.tsx`** (ajout route /admin/settings)
- **`src/pages/Dashboard.tsx`** (section onboarding Connect + historique)

## Prerequis important

Votre compte Stripe doit etre configure en mode "Plateforme" (Stripe Connect). Cela se fait dans le dashboard Stripe sous Settings > Connect. Si ce n'est pas encore fait, il faudra l'activer avant que les restaurants puissent s'inscrire.

