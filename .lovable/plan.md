

# Correction de la page de paiement

## Probleme

La variable `VITE_STRIPE_PUBLISHABLE_KEY` n'est pas definie dans le fichier `.env`. `loadStripe` recoit une chaine vide et Stripe refuse de s'initialiser.

## Solution

Ajouter la cle Stripe publishable dans le fichier `.env` :

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SyE0dPrdr7HLEmYM7YiefkuIFz3tw4WSnWsTItRRzhefawhk6RQbWklPdT7RmBjMhpvGzU4FkqKOocXASoB87kS00sEboTZjQ
```

Cette cle est une cle publique Stripe (prefixe `pk_test_`) et peut etre stockee en clair dans le code sans risque.

## Fichier modifie

- **`.env`** : ajout de la ligne `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SyE0d...`

Aucun autre changement necessaire. La page de paiement fonctionnera immediatement apres cet ajout.

