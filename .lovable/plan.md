
# Passer toute l'application sur l'heure de Paris (Europe/Paris)

## Probleme

Partout dans le code, les dates "aujourd'hui" et "demain" sont calculees en UTC :
- **Frontend** : `new Date().toISOString().split("T")[0]` retourne la date UTC. Entre minuit et 2h du matin heure de Paris, ca donne la date de la veille.
- **Backend SQL** : `CURRENT_DATE` et `NOW()` utilisent le fuseau horaire du serveur (UTC). Les offres sont generees et les reservations expirent sur la base de l'heure UTC.

## Solution

### 1. Creer une fonction utilitaire `getParisDate()` (nouveau fichier)

**Fichier : `src/lib/dateUtils.ts`**

```typescript
export function getParisDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  // Retourne "YYYY-MM-DD" en heure de Paris
}

export function getParisTomorrow(): string {
  const d = new Date(getParisDate() + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
```

`toLocaleDateString("en-CA")` retourne le format ISO `YYYY-MM-DD` en tenant compte du fuseau horaire specifie.

### 2. Remplacer tous les calculs de date cote frontend

| Fichier | Ligne(s) | Avant | Apres |
|---------|----------|-------|-------|
| `src/pages/OrdersPage.tsx` | 85-86 | `new Date().toISOString().split("T")[0]` | `getParisDate()` / `getParisTomorrow()` |
| `src/pages/Dashboard.tsx` | 136-137 | idem | idem |
| `src/pages/Dashboard.tsx` | 384 | idem | idem |
| `src/hooks/useOffers.ts` | 49 | idem | `getParisDate()` |
| `src/hooks/useSurpriseBagConfig.ts` | 34 | idem | `getParisDate()` |
| `src/hooks/useTomorrowOffers.ts` | 11-13 | `new Date()` + `toISOString` | `getParisTomorrow()` |
| `src/components/SurpriseBagCalendar.tsx` | 54 | idem | `getParisDate()` |

Chaque fichier importera `getParisDate` et/ou `getParisTomorrow` depuis `@/lib/dateUtils`.

### 3. Corriger les fonctions SQL (migration)

Les deux fonctions SQL (`generate_daily_offers` et `expire_unconfirmed_reservations`) utilisent `CURRENT_DATE` et `NOW()` qui sont en UTC. On les corrige pour utiliser le fuseau Paris :

```sql
-- generate_daily_offers : remplacer CURRENT_DATE par
(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date

-- expire_unconfirmed_reservations : remplacer NOW() par
NOW() AT TIME ZONE 'Europe/Paris'
-- et CURRENT_DATE par
(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date
```

Cela garantit que les offres sont generees a minuit heure de Paris et que les expirations sont calculees en heure de Paris.

## Resume des fichiers modifies

| Fichier | Type |
|---------|------|
| `src/lib/dateUtils.ts` | Nouveau (utilitaire) |
| `src/pages/OrdersPage.tsx` | 2 lignes |
| `src/pages/Dashboard.tsx` | 3 lignes |
| `src/hooks/useOffers.ts` | 1 ligne |
| `src/hooks/useSurpriseBagConfig.ts` | 1 ligne |
| `src/hooks/useTomorrowOffers.ts` | 2 lignes |
| `src/components/SurpriseBagCalendar.tsx` | 1 ligne |
| Migration SQL | 2 fonctions mises a jour |
