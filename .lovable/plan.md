

# Correction : Checkout bloque sur les offres de demain

## Probleme

L'URL de checkout pour une offre de demain est :
`/checkout?offerId=&offerTitle=...&configId=62ab...&pickupDate=2026-02-11`

`offerId` est vide car l'offre n'a pas encore ete generee. Or, la ligne 44 de `CheckoutPage.tsx` verifie :
```
if (!offerId || !amount)
```

Un `offerId` vide ("") est falsy en JavaScript, donc la page affiche "Parametres de paiement manquants" au lieu du formulaire Stripe.

## Correction

**Fichier** : `src/pages/CheckoutPage.tsx`, ligne 44

Modifier la condition pour accepter soit un `offerId` soit un `configId` (offres de demain) :

```typescript
if ((!offerId && !configId) || !amount) {
```

C'est exactement la meme logique que celle deja utilisee dans `create-payment/index.ts` ligne 38 :
```typescript
if ((!offerId && !configId) || !amount) throw new Error("Missing offerId/configId or amount");
```

## Resume

Un seul changement, une seule ligne. Le reste du flux (create-payment, verify-payment) gere deja correctement le cas `configId` sans `offerId`.
