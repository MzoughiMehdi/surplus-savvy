

# Paiement Stripe integre dans l'application

## Probleme actuel
Le `create-payment` fonctionne correctement (retourne une URL Stripe valide), mais la redirection vers `checkout.stripe.com` sort de l'application. Que ce soit avec `window.location.href` ou `window.open`, l'utilisateur quitte l'app, ce qui pose probleme pour une experience mobile native.

## Solution : Stripe Embedded Checkout
Au lieu de rediriger vers Stripe, on va integrer le formulaire de paiement Stripe directement dans l'application en utilisant **Stripe Embedded Checkout**. Le formulaire de carte bancaire s'affichera dans une page dediee de l'app.

## Etapes d'implementation

### 1. Modifier l'Edge Function `create-payment`
- Changer le mode de creation de session pour retourner un `client_secret` au lieu d'une URL
- Utiliser `ui_mode: "embedded"` dans la creation de la session Checkout
- Remplacer `success_url` / `cancel_url` par `return_url` (requis pour le mode embedded)

### 2. Creer une page de paiement `/checkout`
- Nouvelle page `src/pages/CheckoutPage.tsx`
- Charger Stripe.js via `@stripe/stripe-js` et `@stripe/react-stripe-js`
- Utiliser le composant `<EmbeddedCheckout>` de Stripe qui affiche le formulaire de paiement directement dans l'app
- Recuperer le `clientSecret` depuis l'Edge Function et le passer au composant

### 3. Modifier le flux dans `OfferDetail.tsx`
- Au lieu de rediriger vers l'URL Stripe, naviguer vers `/checkout` en passant les infos de l'offre
- Utiliser `react-router-dom` pour la navigation interne

### 4. Creer une page de retour `/checkout-return`
- Nouvelle page `src/pages/CheckoutReturnPage.tsx`
- Verifier le statut du paiement via Stripe
- Si succes : creer la reservation en base et rediriger vers les commandes avec le QR code
- Si echec : afficher un message et permettre de reessayer

### 5. Ajouter les routes
- Ajouter `/checkout` et `/checkout-return` dans `App.tsx`

## Details techniques

**Dependances a ajouter :** `@stripe/stripe-js`, `@stripe/react-stripe-js`

**Edge Function modifiee :**
```text
session = stripe.checkout.sessions.create({
  ui_mode: "embedded",
  return_url: `${origin}/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
  ...
})
return { clientSecret: session.client_secret }
```

**Composant Embedded Checkout :**
```text
<EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
  <EmbeddedCheckout />
</EmbeddedCheckoutProvider>
```

**Flux utilisateur :**
```text
Offre -> Bouton Reserver -> Page /checkout (formulaire Stripe integre)
  -> Paiement OK -> /checkout-return -> Creation reservation -> Onglet Commandes + QR
  -> Paiement KO -> Message d'erreur + retour
```

## Avantages
- Le paiement reste 100% dans l'application
- Compatible mobile (Android/iOS via PWA ou WebView)
- Pas de perte de session utilisateur
- Experience fluide sans changement de fenetre

