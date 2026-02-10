

# Correction : Capture manuelle pour toutes les reservations + distinction aujourd'hui/demain

## Deux problemes a corriger

### 1. Le paiement est debite immediatement (backend)

**Fichier** : `supabase/functions/create-payment/index.ts`

Le code a deux bugs :

- **Ligne 100** : `capture_method: "manual"` n'est applique que si `isTomorrowBooking` est vrai. Il faut l'appliquer a TOUTES les reservations pour que le debit ne se fasse qu'a la confirmation du commercant.
- **Lignes 124-137** : Un bloc Connect duplique ecrase `payment_intent_data` sans conserver `capture_method: "manual"`.

**Corrections** :
1. Supprimer la condition `if (isTomorrowBooking)` (ligne 100) et toujours definir `capture_method: "manual"`
2. Supprimer le second bloc Connect duplique (lignes 124-137) qui ecrase tout
3. Le premier bloc Connect (lignes 108-122) utilise deja le spread operator et conservera `capture_method`

```text
Avant :
  if (isTomorrowBooking) { capture_method: "manual" }  // seulement demain
  if (stripeAccountId) { ...spread, connect }           // OK
  if (stripeAccountId) { connect }                      // ECRASE tout!

Apres :
  capture_method: "manual"                              // toujours
  if (stripeAccountId) { ...spread, connect }           // conserve capture_method
  // bloc duplique supprime
```

### 2. Le commercant ne distingue pas aujourd'hui / demain (frontend)

**Fichier** : `src/pages/Dashboard.tsx`

La requete (ligne 133) ne selectionne pas `pickup_date` ni `config_id`. Sans ces donnees, impossible de distinguer les types de reservation.

**Corrections** :

1. Ajouter `pickup_date` et `config_id` dans le `select` de la requete reservations
2. Mettre a jour l'interface `ReservationData` pour inclure ces champs
3. Afficher un badge distinctif sur chaque carte de reservation :
   - **"Aujourd'hui"** : si `pickup_date` correspond a aujourd'hui ou si pas de `pickup_date` (reservation classique)
   - **"Demain"** : si `pickup_date` correspond a demain (pre-reservation)
4. Afficher la date de retrait sous le titre de la reservation

### Flux resultant

```text
1. Consommateur reserve (aujourd'hui ou demain) -> Stripe autorise (hold), PAS de debit
2. Commercant voit le badge "Aujourd'hui" ou "Demain" sur la reservation
3. Commercant accepte -> capture-payment capture le hold -> debit reel
4. Commercant refuse -> capture-payment annule le hold -> pas de debit
```

### Aucun changement de schema requis

Les colonnes `pickup_date` et `config_id` existent deja dans la table `reservations`.

