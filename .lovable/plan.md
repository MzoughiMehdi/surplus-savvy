

# Exclure les commandes acceptees de l'expiration automatique

## Contexte

Actuellement, la fonction `expire_unconfirmed_reservations` expire automatiquement les reservations avec les statuts `confirmed` ET `accepted` 30 minutes avant la fin du creneau de retrait. 

La demande : une commande **acceptee** par le commercant ne doit plus etre expiree automatiquement. Seules les commandes **en attente de validation** (`confirmed`) doivent expirer.

## Modification

### Migration SQL

Modifier la fonction `expire_unconfirmed_reservations` pour ne cibler que le statut `confirmed` :

```sql
-- Avant
WHERE res.status IN ('confirmed', 'accepted')

-- Apres
WHERE res.status = 'confirmed'
```

Cela signifie qu'une fois qu'un commercant accepte une reservation, elle reste active jusqu'a ce qu'il la marque manuellement comme "retiree" (`completed`) ou "annulee" (`cancelled`).

## Impact

- Les commandes en attente (`confirmed`) continuent d'expirer automatiquement 30 min avant la fin du creneau
- Les commandes acceptees (`accepted`) restent en place indefiniment jusqu'a action manuelle du commercant
- Aucun changement cote frontend

| Fichier | Changement |
|---------|-----------|
| Migration SQL | `WHERE res.status = 'confirmed'` au lieu de `IN ('confirmed', 'accepted')` |
