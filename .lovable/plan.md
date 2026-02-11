
# Corrections : affichage consommateur avec deux dates et badges dynamiques

## Probleme 1 : Expiration

Les reservations du 11/02 avec `pickup_end = 23:00` expirent a 22:30 UTC (23:30 Paris). Le cron tourne et la fonction est correcte -- elles expireront automatiquement dans les prochaines minutes. Pas de bug ici.

## Probleme 2 : Affichage consommateur (OrdersPage)

Actuellement, la carte de reservation affiche :
- Le titre
- Le nom du restaurant
- Un badge Aujourd'hui/Demain (meme pour les commandes terminees/expirees)
- "il y a X heures" (date relative de creation)

Il faut :
- Afficher **deux dates** : "Reservee le JJ/MM/AAAA" + "Retrait : [badge] HH:MM - HH:MM"
- Le badge Aujourd'hui/Demain ne s'affiche que pour les statuts actifs (`confirmed`, `accepted`)
- Pour les statuts termines (`completed`, `expired`, `cancelled`), afficher la date de retrait en clair (JJ/MM/AAAA) sans badge

## Modifications prevues

### Fichier `src/pages/OrdersPage.tsx`

**Remplacement du bloc d'affichage des dates (lignes 150-164)** :

Avant :
```
badge Aujourd'hui/Demain
creneau horaire
"il y a X heures"
```

Apres :
```
Reservee le 11/02/2026
Retrait : [Aujourd'hui] 18:00 - 20:00    (si statut actif)
Retrait : 11/02/2026 - 18:00 - 20:00     (si statut termine)
```

Logique :
```typescript
const isActive = ["confirmed", "accepted"].includes(r.status);
const pickupDay = r.pickup_date || r.created_at.split("T")[0];

// Ligne 1 : date de reservation
<p>Reservee le {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>

// Ligne 2 : retrait avec badge conditionnel
<div>
  <CalendarDays /> Retrait :
  {isActive && isTomorrow ? <Badge>Demain</Badge> : null}
  {isActive && isToday ? <Badge>Aujourd'hui</Badge> : null}
  {!isActive ? <span>{new Date(pickupDay).toLocaleDateString("fr-FR")}</span> : null}
  <Clock /> {pickupStart} - {pickupEnd}
</div>
```

**Import a ajouter** : `CalendarDays` depuis `lucide-react`

## Resume

| Fichier | Changement |
|---------|-----------|
| `src/pages/OrdersPage.tsx` | Deux dates (reservation + retrait), badge Aujourd'hui/Demain uniquement pour statuts actifs, date en clair pour statuts termines |
