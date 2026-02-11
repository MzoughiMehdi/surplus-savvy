

# Ajouter un lien vers le compte Stripe du commercant

## Modification

### `src/pages/Dashboard.tsx` - Section "Paiements" (lignes 141-148)

Quand le compte Connect est actif (badge "Actif"), ajouter un lien "Voir mon compte" a cote du badge qui ouvre le dashboard Stripe Express du commercant dans un nouvel onglet.

L'URL du dashboard Stripe Express est : `https://dashboard.stripe.com/express/login` -- mais pour un acces direct, Stripe fournit une API "Login Link". On va plutot utiliser un lien simple vers `https://connect.stripe.com/express_login` qui redirige automatiquement le commercant vers son dashboard Express.

Alternativement, pour une meilleure UX, on peut creer une edge function qui genere un lien de connexion temporaire via l'API Stripe (`stripe.accounts.createLoginLink(accountId)`).

### Approche retenue : Edge function pour lien securise

**1. Nouvelle edge function `create-connect-login-link/index.ts`**

- Recoit le `restaurantId` dans le body
- Recupere le `stripe_account_id` du restaurant en base
- Appelle `stripe.accounts.createLoginLink(stripeAccountId)` pour generer un lien temporaire
- Renvoie l'URL

**2. `src/pages/Dashboard.tsx` - Lignes 141-148**

Remplacer le badge "Actif" seul par un badge + un bouton lien :

```text
AVANT :
  <Badge variant="secondary">Actif</Badge>

APRES :
  <div className="flex items-center gap-2">
    <Badge variant="secondary">Actif</Badge>
    <Button size="sm" variant="ghost" onClick={handleOpenStripeDashboard}>
      Voir mon compte <ExternalLink />
    </Button>
  </div>
```

La fonction `handleOpenStripeDashboard` utilisera la meme technique que `handleSetupConnect` : ouvrir une fenetre synchrone puis rediriger vers l'URL recue de l'edge function.

## Resume

| Modification | Fichier |
|---|---|
| Nouvelle edge function pour generer un login link Stripe | `supabase/functions/create-connect-login-link/index.ts` |
| Ajout du bouton "Voir mon compte" a cote du badge Actif | `src/pages/Dashboard.tsx` |

