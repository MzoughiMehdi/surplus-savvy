

# Correction : Crash du Dashboard sur les reservations de demain

## Probleme

La requete du Dashboard (ligne 131-136) fait un JOIN implicite :
```
offers(title, discounted_price)
```

Pour les reservations de demain, `offer_id` est NULL, donc `r.offers` vaut `null`. La ligne 283 fait `r.offers.title` sans verification, ce qui provoque le crash :
```
Cannot read properties of null (reading 'title')
```

## Correction

**Fichier** : `src/pages/Dashboard.tsx`

1. Mettre a jour l'interface `ReservationData` pour rendre `offers` nullable :
```typescript
offers: { title: string; discounted_price: number } | null;
```

2. Proteger l'affichage aux lignes 283 et 305 avec un fallback :
```typescript
<p className="text-sm font-semibold text-foreground">
  {r.offers?.title ?? "Panier de demain"}
</p>
```
```typescript
<span className="text-sm font-bold text-primary">
  €{r.offers?.discounted_price ?? "—"}
</span>
```

## Impact

Aucun changement de logique, juste un affichage defensif pour les reservations sans offre liee.

