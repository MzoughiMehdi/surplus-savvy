

# Correction : Rendre capture-payment idempotent

## Fichier modifie

`supabase/functions/capture-payment/index.ts`

## Changements

### Bloc "capture" (lignes 53-80)

Avant de capturer, recuperer le PaymentIntent et verifier son statut :

- `succeeded` : retourner succes immediatement (deja capture)
- `requires_capture` : proceder a la capture normalement (c'est le cas attendu -- le hold a ete place au moment de la commande, le debit reel se fait maintenant a la confirmation du commercant)
- Autre statut : retourner une erreur explicative

### Bloc "cancel" (lignes 82-89)

Meme logique :

- `canceled` : retourner succes immediatement
- `requires_capture` : proceder a l'annulation (liberer le hold)
- Autre statut : retourner une erreur explicative

## Rappel du flux de paiement

1. Le consommateur passe commande : Stripe autorise le montant (`capture_method: manual`) -- les fonds sont bloques mais PAS debites
2. Le commercant clique "Accepter" : la fonction `capture-payment` est appelee avec `action: "capture"` -- c'est a ce moment que le debit reel se fait
3. Si le commercant refuse : `action: "cancel"` -- le hold est libere, le client n'est jamais debite

Ce fix ne change pas ce flux. Il empeche simplement les erreurs en cas de double appel.

## Section technique

```text
Avant (simplifie) :
  capture -> stripe.paymentIntents.capture(id)  // crash si deja capture

Apres :
  capture -> stripe.paymentIntents.retrieve(id)
          -> si succeeded : return { success, already_captured }
          -> si requires_capture : stripe.paymentIntents.capture(id)
          -> sinon : return { error, statut inattendu }
```

Aucun changement frontend requis.

