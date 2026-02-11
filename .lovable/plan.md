

# Rendre Stripe Connect optionnel dans l'onboarding

## Contexte

Actuellement, l'onboarding redirige le commercant vers Stripe Connect immediatement apres la creation du restaurant. Le commercant doit pouvoir **choisir** de configurer ses paiements plus tard, depuis son tableau de bord (la section "Paiements" existe deja dans le Dashboard via `ConnectSection`).

Les paiements captures avant la configuration de Stripe Connect sont stockes sur le compte plateforme. Quand le commercant configure son compte Connect, les reversements en attente doivent lui etre transferes.

## Modifications

### 1. `src/pages/MerchantOnboarding.tsx` - Supprimer l'appel Stripe Connect

Remplacer l'appel a `create-connect-account` + redirection par une simple navigation vers `/dashboard` :

```typescript
// AVANT (lignes 121-134) :
const { data: connectData, error: connectError } = await supabase.functions.invoke(
  "create-connect-account", ...
);
...
window.location.href = connectData.url;

// APRES :
toast.success("Restaurant enregistre ! Configurez vos paiements depuis votre tableau de bord.");
navigate("/dashboard");
```

### 2. `src/pages/MerchantOnboarding.tsx` - Texte de confirmation

Mettre a jour le bloc de confirmation pour expliquer que la configuration des paiements est faisable depuis le dashboard :

```
"Vous pourrez configurer la reception de vos paiements a tout moment
depuis votre tableau de bord. Votre compte sera valide par un administrateur."
```

### 3. `src/pages/Dashboard.tsx` - Mettre en avant la configuration Connect

Remonter la `ConnectSection` en haut du dashboard quand le compte n'est pas encore configure, avec un message plus visible pour inciter le commercant a finaliser sa configuration.

### 4. Edge function `create-connect-account` - Transferer les paiements en attente

Apres la verification du statut `charges_enabled` dans `check-connect-status`, ajouter une logique pour transferer les `restaurant_payouts` en statut `pending` qui n'ont pas encore de `stripe_transfer_id` valide (ie. paiements captures avant la configuration Connect).

Creer une nouvelle edge function `transfer-pending-payouts` :
- Declenchee quand le commercant termine son onboarding Connect (au retour sur le dashboard, via `check-connect-status` quand `chargesEnabled` passe a `true`)
- Parcourt les `restaurant_payouts` en statut `pending` pour ce restaurant
- Cree un `Transfer` Stripe vers le compte Connect pour chaque payout en attente
- Met a jour le statut du payout en `completed`

## Resume des fichiers

| Fichier | Changement |
|---------|-----------|
| `src/pages/MerchantOnboarding.tsx` | Suppression appel Connect, redirection directe vers /dashboard, mise a jour texte |
| `src/pages/Dashboard.tsx` | Mise en avant ConnectSection quand pas configure |
| `supabase/functions/transfer-pending-payouts/index.ts` | Nouvelle fonction pour transferer les paiements en attente |
| `supabase/config.toml` | Ajout config pour transfer-pending-payouts |

## Flux

```text
Onboarding -> Creation restaurant -> Redirection /dashboard
                                          |
                          [ConnectSection visible en evidence]
                                          |
                     Le commercant peut configurer Connect maintenant ou plus tard
                                          |
                     Quand Connect est active -> transfert automatique des paiements en attente
```

