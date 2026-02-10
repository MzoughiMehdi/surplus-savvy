

# Affichage des commandes de demain + Expiration automatique

## Probleme

Les reservations pour demain ont `offer_id = null` et `config_id` rempli. Les requetes dans `OrdersPage` et `Dashboard` ne joignent que `offers(...)`, donc pour ces reservations : pas de creneau de retrait, pas de prix, pas de titre.

De plus, il n'existe aucun mecanisme d'expiration automatique : une reservation non validee par le commercant reste "en attente" indefiniment.

## Solution en 3 etapes

### Etape 1 : Migration SQL

**a) Ajouter une foreign key** sur `reservations.config_id` vers `surprise_bag_config.id` pour permettre les jointures PostgREST :

```sql
ALTER TABLE reservations 
ADD CONSTRAINT reservations_config_id_fkey 
FOREIGN KEY (config_id) REFERENCES surprise_bag_config(id);
```

**b) Creer la fonction d'expiration** `expire_unconfirmed_reservations()` :
- Cherche les reservations au statut `confirmed`
- Determine le `pickup_end` depuis `offers` ou `surprise_bag_config`
- Determine la date de retrait depuis `pickup_date` ou `offers.date` ou la date du jour
- Si maintenant >= (date + pickup_end - 30 minutes), passe le statut en `expired`
- Appelle l'Edge Function `capture-payment` via `pg_net` avec `action: "cancel"` pour annuler la pre-autorisation Stripe

**c) Planifier le cron** toutes les minutes via `pg_cron` + `pg_net`.

### Etape 2 : Modifier les requetes et l'affichage

**Fichier `src/pages/OrdersPage.tsx`** :
- Ajouter `surprise_bag_config(base_price, pickup_start, pickup_end)` et `pickup_date` dans le `select`
- Mettre a jour l'interface `Reservation` avec les champs `config_id`, `pickup_date` et `surprise_bag_config`
- Utiliser des fallbacks dans l'affichage et dans les props de `ReservationConfirmation` :
  - Titre : `r.offers?.title ?? "Lot Anti-Gaspi"`
  - Prix : `r.offers?.discounted_price ?? Number((config.base_price * 0.4).toFixed(2))`
  - Pickup : `r.offers?.pickup_start ?? r.surprise_bag_config?.pickup_start` (idem pour pickup_end, avec slice pour formater)
- Afficher un badge "Demain" ou "Aujourd'hui" quand `pickup_date` est present
- Ajouter `expired` dans `statusConfig` : label "Expiree", variant "destructive"

**Fichier `src/pages/Dashboard.tsx`** :
- Ajouter `surprise_bag_config(base_price, pickup_start, pickup_end)` dans le `select` de `fetchData`
- Mettre a jour `ReservationData` pour inclure `surprise_bag_config`
- Dans `ReservationCard`, afficher le creneau de retrait (actuellement absent) et utiliser les fallbacks pour le prix
- Ajouter le statut `expired` dans les badges
- Dans `StatsTab`, utiliser le meme fallback pour le calcul des revenus

**Fichier `src/components/ReservationConfirmation.tsx`** :
- Ajouter `expired` dans `statusConfig` avec icone `XCircle`, label "Expiree", couleur destructive
- Ajouter le message contextuel pour le statut `expired`

### Etape 3 : Planifier le cron job

Inserer le cron job via SQL pour appeler la fonction `expire_unconfirmed_reservations()` toutes les minutes. Pour les reservations avec `payment_intent_id`, la fonction appelle `capture-payment` via `pg_net.http_post` pour annuler la pre-autorisation Stripe.

## Resume des fichiers modifies

| Fichier | Changement |
|---------|-----------|
| Migration SQL | FK config_id, fonction expire + cron |
| `src/pages/OrdersPage.tsx` | Requete enrichie, fallbacks affichage, badge date, statut expired |
| `src/pages/Dashboard.tsx` | Requete enrichie, fallbacks dans ReservationCard, creneau retrait, statut expired |
| `src/components/ReservationConfirmation.tsx` | Statut expired |

## Ordre d'implementation

1. Migration SQL (FK + fonction + cron)
2. OrdersPage (requete + affichage)
3. Dashboard (requete + ReservationCard + StatsTab)
4. ReservationConfirmation (statut expired)

