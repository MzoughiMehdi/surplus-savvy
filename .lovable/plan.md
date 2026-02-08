
# Paniers surprise recurrents + Refonte visuelle TGTG

## 1. Refonte des couleurs -- Inspiration Too Good To Go

Remplacement de la palette terracotta actuelle par une palette vert-teal profond, fond clair chaud, tout en gardant une identite propre.

### Nouvelles variables CSS dans `src/index.css`

| Variable | Actuel | Nouveau |
|---|---|---|
| `--primary` | `16 70% 50%` (orange) | `173 80% 26%` (teal profond) |
| `--primary-foreground` | `35 35% 97%` | `0 0% 100%` (blanc) |
| `--background` | `35 35% 97%` | `30 20% 97%` (blanc casse chaud) |
| `--card` | `35 30% 99%` | `0 0% 100%` (blanc pur) |
| `--accent` | `45 85% 52%` | `45 90% 55%` (jaune-dore, badges prix) |
| `--success` | `160 50% 40%` | `160 55% 40%` (vert inchange) |
| `--ring` | `16 70% 50%` | `173 80% 26%` (teal) |
| `--eco-light` | `160 25% 94%` | `173 30% 93%` (teal clair) |

Le mode dark sera aussi ajuste avec les teintes teal. Le gradient `text-gradient-warm` deviendra un degrade teal vers accent.

Tous les composants (BottomNav, OfferCard, CategoryFilter, ImpactBanner, OfferDetail, HeroSection) utilisent deja les variables CSS, donc ils s'adapteront automatiquement sans modification de code.

## 2. Base de donnees -- Nouvelles tables

### Table `surprise_bag_config`

Une ligne par restaurant, stocke la configuration par defaut :

| Colonne | Type | Detail |
|---|---|---|
| id | uuid PK | |
| restaurant_id | uuid FK unique | Vers restaurants |
| base_price | numeric NOT NULL | Valeur reelle, minimum 10 |
| daily_quantity | integer NOT NULL | Nombre par defaut/jour |
| pickup_start | time NOT NULL | Heure debut retrait |
| pickup_end | time NOT NULL | Heure fin retrait |
| is_active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS : lecture/ecriture par le proprietaire du restaurant, lecture admins.

### Table `daily_overrides`

Ajustements pour un jour specifique :

| Colonne | Type | Detail |
|---|---|---|
| id | uuid PK | |
| restaurant_id | uuid FK | Vers restaurants |
| date | date NOT NULL | Jour concerne |
| quantity | integer nullable | Null = utiliser defaut |
| pickup_start | time nullable | |
| pickup_end | time nullable | |
| is_suspended | boolean | Default false |
| created_at | timestamptz | |

Contrainte unique sur `(restaurant_id, date)`. RLS : lecture/ecriture proprietaire, lecture admins.

### Colonne `date` sur la table `offers`

Ajouter une colonne `date` (type date, nullable) pour identifier les paniers du jour.

## 3. Prix de vente : 40% du prix initial

Le prix affiche = `base_price * 0.40` (reduction de 60%).

Le consommateur voit toujours les deux prix : le prix initial barre et le prix de vente.

## 4. Dashboard commercant -- Refonte complete

Remplacement du formulaire de creation d'offres ponctuelles par une interface de configuration de disponibilite.

### Section "Configuration par defaut" (`SurpriseBagConfig.tsx`)

- Valeur moyenne du panier (input numerique, min 10 EUR)
- Affichage automatique du prix de vente (40% de la valeur) a cote
- Nombre de paniers par jour (input numerique)
- Creneau de retrait par defaut (heure debut / fin)
- Switch actif/inactif
- Sauvegarde immediate a chaque modification

### Section "Calendrier" (`SurpriseBagCalendar.tsx`)

- Calendrier mensuel avec pour chaque jour :
  - Nombre de paniers prevus (defaut ou override)
  - Indicateur visuel si suspendu
  - Nombre de paniers deja reserves
- Clic sur un jour ouvre un panneau (`DayOverridePanel.tsx`) pour :
  - Modifier la quantite du jour
  - Modifier le creneau de retrait du jour
  - Suspendre la vente pour ce jour
- Les modifications s'appliquent immediatement aux paniers non reserves

### Section "Reservations" (conservee mais enrichie)

- Le commercant peut maintenant **confirmer** ou **annuler** chaque reservation (au lieu de seulement "marquer comme retire")
- Workflow : confirmed -> accepted (par le commercant) -> completed (retrait) ou cancelled

### Generation automatique des offres du jour

Au chargement du dashboard, le systeme :
1. Verifie si une offre "Panier surprise" existe pour aujourd'hui
2. Si non, en cree une automatiquement basee sur la config + override du jour
3. Si oui, ajuste le stock (`items_left`) et le creneau si un override a ete modifie (uniquement pour les paniers non reserves)

## 5. Onboarding commercant

Ajout d'une etape dans `MerchantOnboarding.tsx` apres la creation du restaurant :
- Valeur moyenne du panier
- Nombre de paniers par jour
- Creneau de retrait

Ces valeurs seront inserees dans `surprise_bag_config`.

## 6. Cote consommateur

### `useOffers.ts`

- Filtrer les offres avec `date = today` (en plus des filtres existants `is_active` et `items_left > 0`)

### `OfferCard.tsx` et `OfferDetail.tsx`

- Afficher "Panier surprise" avec le nom du restaurant
- Les deux prix restent visibles (original barre + prix de vente)
- Le creneau de retrait exact est affiche
- Aucune description detaillee (c'est une surprise)

## 7. Fichiers impactes

### Nouveaux fichiers
- `src/components/SurpriseBagConfig.tsx`
- `src/components/SurpriseBagCalendar.tsx`
- `src/components/DayOverridePanel.tsx`

### Fichiers modifies
- `src/index.css` -- nouvelle palette de couleurs
- `src/pages/Dashboard.tsx` -- refonte majeure (config + calendrier remplacent le formulaire d'offres)
- `src/hooks/useOffers.ts` -- filtre sur `date = today`
- `src/pages/MerchantOnboarding.tsx` -- etape de config panier surprise
- `src/components/OfferCard.tsx` -- ajustement texte "Panier surprise"
- `src/components/OfferDetail.tsx` -- ajustement texte
- `src/components/HeroSection.tsx` -- ajustement du gradient pour les nouvelles couleurs

### Migrations SQL
1. Creer table `surprise_bag_config` avec RLS
2. Creer table `daily_overrides` avec RLS et contrainte unique
3. Ajouter colonne `date` a la table `offers`
