

# Corriger le decalage de date dans le calendrier du Dashboard

## Probleme

Quand une reservation n'a pas de `pickup_date` (reservations du jour), le code utilise `r.created_at.split("T")[0]` pour extraire la date. Cette operation decoupe la date UTC brute, sans conversion au fuseau Europe/Paris.

Exemple concret : la reservation creee a `2026-02-11T23:03:32Z` (UTC) correspond en realite au **12 fevrier a 00:03 heure de Paris**, mais le code affiche le **11 fevrier**.

## Solution

Creer une fonction utilitaire qui convertit un timestamp UTC en date YYYY-MM-DD au fuseau Europe/Paris, et l'utiliser partout ou `created_at` est utilise comme fallback pour la date.

## Modifications

### 1. `src/lib/dateUtils.ts` - Nouvelle fonction

Ajouter une fonction `toParisDateString(isoTimestamp: string): string` qui convertit un timestamp ISO en date locale Paris :

```typescript
export function toParisDateString(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}
```

### 2. `src/pages/Dashboard.tsx` - Deux corrections

**Ligne 379** - Calcul des `reservationCounts` pour le calendrier :

```typescript
// AVANT :
const date = r.pickup_date || r.created_at.split("T")[0];

// APRES :
const date = r.pickup_date || toParisDateString(r.created_at);
```

**Ligne 397** - Filtrage des reservations du jour :

```typescript
// AVANT :
const pickupDay = r.pickup_date || r.created_at.split("T")[0];

// APRES :
const pickupDay = r.pickup_date || toParisDateString(r.created_at);
```

**Ligne 149** - Dans le composant `ReservationCard` :

```typescript
// AVANT :
const pickupDay = r.pickup_date || today;

// APRES :
const pickupDay = r.pickup_date || toParisDateString(r.created_at);
```

Ajouter l'import de `toParisDateString` depuis `@/lib/dateUtils`.

## Resume

| Fichier | Changement |
|---------|-----------|
| `src/lib/dateUtils.ts` | Ajout de `toParisDateString()` |
| `src/pages/Dashboard.tsx` | 3 remplacements de `split("T")[0]` / `today` par `toParisDateString()` |

## Impact

Toutes les reservations sans `pickup_date` seront desormais affichees a la bonne date selon le fuseau Europe/Paris, coherent avec le reste de l'application.
