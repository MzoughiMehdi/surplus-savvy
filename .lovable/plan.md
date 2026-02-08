

# Correction des prix : appliquer -60% sur toutes les offres

## Probleme

Le modele economique impose que le prix reduit soit toujours egal a 40% du prix original (reduction de 60%). Actuellement, certaines offres ont des reductions de 50%, 58%, 63%, 64%, ou meme 75%.

## Solution

Executer une migration SQL qui recalcule le `discounted_price` de toutes les offres existantes avec la formule :

```
discounted_price = ROUND(original_price * 0.4, 2)
```

Cela garantira que toutes les offres affichent exactement -60%.

## Exemples de corrections

| Offre | Prix original | Avant | Apres (40%) |
|---|---|---|---|
| Panier Surprise du Chef | 25.00 | 8.99 (-64%) | 10.00 (-60%) |
| Jdjd | 20.00 | 10.00 (-50%) | 8.00 (-60%) |
| Mechoui de boti | 1000.00 | 250.00 (-75%) | 400.00 (-60%) |
| Panier Viennoiseries | 12.00 | 4.99 (-58%) | 4.80 (-60%) |
| Panier Pains Artisanaux | 14.00 | 5.49 (-61%) | 5.60 (-60%) |

## Details techniques

Une seule commande SQL sur la table `offers` :

```sql
UPDATE offers
SET discounted_price = ROUND(original_price * 0.4, 2);
```

Aucun fichier de code ne sera modifie. Seule la base de donnees sera mise a jour.

Le hook `useSurpriseBagConfig` applique deja correctement la formule `base_price * 0.4` lors de la creation/mise a jour d'offres, donc les futures offres seront correctes automatiquement.

