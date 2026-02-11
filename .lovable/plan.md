

# Corrections du Dashboard commercant : disponibilites, compteurs et dates

## Problemes identifies

1. **Calendrier "11 disponible" ne se met pas a jour** : `reservationCounts` est calcule sur `created_at` (date de creation) au lieu de `pickup_date` (date de retrait). Quand un client reserve pour demain, le calendrier decremente le jour de creation, pas le bon jour.

2. **"Reservations : 0" dans les stats** : `todayReservations` filtre par `created_at` du jour. Une reservation faite hier pour aujourd'hui n'apparait pas.

3. **Pas de distinction entre date de reservation et date de retrait** : La carte de reservation n'affiche qu'une seule date (`created_at`). Le commercant ne sait pas facilement quand la reservation a ete faite vs quand le retrait est prevu.

4. **Badges Aujourd'hui/Demain** : La logique est correcte (`pickup_date` compare a `new Date()`), mais le probleme est que les reservations sans `pickup_date` sont toutes traitees comme "Aujourd'hui" ce qui peut etre faux.

## Corrections prevues

### 1. Corriger `reservationCounts` pour le calendrier (ligne 367-371)

Utiliser `pickup_date` au lieu de `created_at` pour compter les reservations par jour de retrait :

```typescript
reservations.forEach((r) => {
  const date = r.pickup_date || r.created_at.split("T")[0];
  reservationCounts[date] = (reservationCounts[date] || 0) + 1;
});
```

Cela corrigera le nombre de paniers disponibles affiches dans le calendrier.

### 2. Corriger `todayReservations` pour le compteur (ligne 385)

Compter les reservations dont le retrait est prevu aujourd'hui, pas celles creees aujourd'hui :

```typescript
const today = new Date().toISOString().split("T")[0];
const todayReservations = reservations.filter((r) => {
  const pickupDay = r.pickup_date || r.created_at.split("T")[0];
  return pickupDay === today;
});
```

### 3. Afficher les deux dates dans `ReservationCard` (lignes 147-168)

Ajouter deux lignes distinctes :
- **Reservee le** : date de creation (`created_at`) formatee en francais
- **Retrait** : badge Aujourd'hui / Demain / date, avec le creneau horaire

```text
Lot Anti-Gaspi
Reservee le 10/02/2026
[Calendrier] Retrait : [Aujourd'hui] 18:00 - 20:00
[QR] A1B2C3D4
```

### 4. Gerer le cas `pickup_date = null`

Pour les reservations sans `pickup_date` (anciennes reservations avec `offer_id`), utiliser la date de l'offre si disponible, sinon `created_at`. Ajouter `offers.date` dans la jointure si pas deja present pour avoir cette information.

## Fichier modifie

**`src/pages/Dashboard.tsx`** :
- Ligne 367-371 : `reservationCounts` base sur `pickup_date`
- Ligne 385 : `todayReservations` base sur `pickup_date`
- Lignes 147-168 : `ReservationCard` affiche deux dates + badge retrait ameliore

Aucune migration SQL necessaire.

