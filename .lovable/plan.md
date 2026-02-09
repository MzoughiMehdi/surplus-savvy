

# Generation automatique quotidienne des offres

## Probleme

Toutes les offres en base ont la date du **8 fevrier** (hier). Le hook `useOffers` filtre sur `CURRENT_DATE`, donc rien ne s'affiche aujourd'hui. De plus, la generation actuelle depend de l'ouverture du dashboard par le commercant, ce qui n'est pas fiable.

## Ce qui va changer

### 1. Creer une fonction SQL `generate_daily_offers()`

Une fonction cote base de donnees qui :
- Parcourt tous les restaurants ayant une configuration de panier surprise active
- Verifie qu'aucune offre n'existe deja pour aujourd'hui
- Cree automatiquement les offres du jour avec la quantite configuree (pas d'accumulation d'invendus)
- Respecte les suspensions et personnalisations du calendrier (`daily_overrides`)

### 2. Marquer les offres de la veille comme "invendues"

Avant de generer les nouvelles offres, les offres d'hier encore actives avec des `items_left > 0` seront passees en `is_active = false` pour ne plus etre affichees. Les invendus ne sont jamais reportes au jour suivant.

### 3. Appeler la generation automatiquement au chargement

Modifier `useOffers.ts` pour appeler `generate_daily_offers()` via RPC avant de charger les offres. La premiere visite du jour declenche la creation. L'index unique `unique_offer_per_restaurant_per_day` empeche tout doublon.

### 4. Nettoyer le code du Dashboard

Supprimer la logique `generateTodayOffer` du `Dashboard.tsx` qui faisait doublon et dependait de la connexion du commercant.

## Details techniques

### Migration SQL
- Marquer les offres passees comme inactives : `UPDATE offers SET is_active = false WHERE date < CURRENT_DATE`
- Creer la fonction `generate_daily_offers()` en `SECURITY DEFINER` qui :
  1. Desactive les offres des jours precedents
  2. Insere les nouvelles offres du jour a partir de `surprise_bag_config` + `daily_overrides`

### Fichiers modifies
- **Migration SQL** : fonction `generate_daily_offers()` + nettoyage des anciennes offres
- **`src/hooks/useOffers.ts`** : appel `supabase.rpc('generate_daily_offers')` avant le fetch
- **`src/pages/Dashboard.tsx`** : suppression de `generateTodayOffer` et du `useEffect` associe

### Resultat
- Les offres s'affichent automatiquement chaque jour
- Chaque jour repart a zero avec la quantite configuree
- Les invendus de la veille sont marques inactifs et disparaissent
- Les suspensions et overrides du calendrier sont respectes
- Plus de dependance a l'ouverture du dashboard commercant

