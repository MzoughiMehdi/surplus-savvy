
# Corriger la page blanche et integrer Stripe Connect dans l'onboarding

## Probleme

Apres avoir clique sur "Valider l'inscription", le code appelle `create-checkout` (abonnement Stripe) puis fait `window.location.href = data.url` pour rediriger vers une page de paiement externe. Cette redirection cause une page blanche. De plus, le compte Stripe Connect du commercant n'est pas cree pendant l'onboarding, ce qui signifie qu'il ne sera pas pret a recevoir des paiements meme apres validation admin.

## Solution

Remplacer la redirection vers Stripe Checkout (abonnement) par la creation du compte Stripe Connect, puis rediriger vers le formulaire d'onboarding Stripe Connect. Ainsi, a la fin de l'inscription :

1. Le restaurant est cree en base (statut `pending`)
2. Le compte Stripe Connect Express est cree via l'edge function `create-connect-account`
3. Le commercant est redirige vers le formulaire Stripe Connect pour renseigner ses informations bancaires
4. Au retour de Stripe, il arrive sur `/dashboard` avec le bandeau "En attente de validation"
5. Des que l'admin approuve le restaurant, le commercant est immediatement operationnel pour recevoir les paiements

## Modifications

### 1. `src/pages/MerchantOnboarding.tsx` - handleSubmit (lignes 121-131)

Remplacer l'appel a `create-checkout` par un appel a `create-connect-account` :

```typescript
// AVANT :
const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
  body: { priceId: MERCHANT_PLAN.price_id },
});
if (checkoutError || !data?.url) {
  toast.success("Restaurant enregistré !");
  navigate("/dashboard");
  return;
}
toast.success("Restaurant enregistré ! Redirection vers le paiement...");
window.location.href = data.url;

// APRES :
// Creer le compte Stripe Connect
const { data: connectData, error: connectError } = await supabase.functions.invoke(
  "create-connect-account",
  { body: { restaurantId: newRest.id } }
);

if (connectError || !connectData?.url) {
  // Fallback : si Stripe Connect echoue, on redirige quand meme
  toast.success("Restaurant enregistré ! Vous pourrez configurer vos paiements plus tard.");
  navigate("/dashboard");
  return;
}

toast.success("Restaurant enregistré ! Configurez vos informations de paiement...");
window.location.href = connectData.url;
```

La difference clef : la redirection vers Stripe Connect est un formulaire d'onboarding bancaire (pas un paiement). Les URL de retour (`return_url` et `refresh_url`) dans l'edge function `create-connect-account` pointent deja vers `/dashboard`.

### 2. `src/pages/MerchantOnboarding.tsx` - Etape confirmation (lignes 369-380)

Remplacer le bloc "Abonnement" par un message expliquant le processus :

```typescript
// AVANT : bloc affichant MERCHANT_PLAN avec prix et features

// APRES :
<div className="rounded-xl bg-card p-4 shadow-sm">
  <p className="text-xs text-muted-foreground">Prochaine etape</p>
  <p className="text-sm font-semibold text-foreground">Configuration des paiements</p>
  <p className="mt-1 text-xs text-muted-foreground">
    Vous allez etre redirige vers notre partenaire de paiement pour configurer
    la reception de vos revenus. Votre compte sera ensuite valide par un administrateur.
  </p>
</div>
```

### 3. `src/pages/MerchantOnboarding.tsx` - Import

Retirer l'import de `MERCHANT_PLAN` qui n'est plus utilise.

## Resume

| Fichier | Changement |
|---------|-----------|
| `src/pages/MerchantOnboarding.tsx` | Remplacement `create-checkout` par `create-connect-account`, mise a jour du texte de confirmation, nettoyage import |

## Flux resultant

```text
Inscription compte -> Infos restaurant -> Config panier -> Confirmation
                                                              |
                                                    [Valider l'inscription]
                                                              |
                                               Creation restaurant (pending)
                                               Creation config panier
                                               Creation compte Stripe Connect
                                                              |
                                               Redirection vers Stripe Connect
                                               (formulaire bancaire)
                                                              |
                                               Retour sur /dashboard
                                               "En attente de validation admin"
                                                              |
                                               Admin approuve -> operationnel
```
