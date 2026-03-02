

# Plan : Creer le fichier docs/CAHIER_DES_CHARGES.md

Creer un fichier Markdown complet a la racine du projet dans `docs/CAHIER_DES_CHARGES.md` contenant le cahier des charges exhaustif du projet SurplusSavvy. Le document sera structure comme suit :

---

## Contenu du cahier des charges

### 1. Presentation generale
- **Nom** : SurplusSavvy
- **Objet** : Marketplace anti-gaspillage alimentaire connectant commercants et consommateurs pour la vente de "lots surprises" a prix reduit
- **Cibles** : Web responsive + iOS natif (Capacitor)
- **Langue de l'interface** : Francais

### 2. Stack technique
- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS
- **Backend** : Supabase (Auth, Database PostgreSQL, Edge Functions, Storage, RLS)
- **Paiement** : Stripe (Checkout Embedded, Connect Express, manual capture)
- **Cartographie** : Leaflet + OpenStreetMap (tuiles CartoDB Voyager)
- **Geocodage** : Nominatim (OpenStreetMap)
- **Mobile** : Capacitor (iOS wrapper avec deep links `surplussavvy://`)
- **QR Code** : qrcode.react
- **Graphiques** : Recharts

### 3. Charte graphique

| Element | Valeur |
|---|---|
| Police corps | Outfit (sans-serif) |
| Police titres | Fraunces (serif) |
| Couleur primaire | HSL 173 80% 26% (teal fonce) |
| Couleur accent | HSL 45 90% 55% (or/jaune) |
| Fond clair | HSL 30 20% 97% (beige clair) |
| Fond sombre | HSL 180 10% 8% |
| Texte principal | HSL 20 25% 12% |
| Destructive/erreur | HSL 0 75% 55% |
| Succes | HSL 160 55% 40% |
| Border radius | 1.25rem (20px) |
| Mode sombre | Supporte via classe `.dark` |
| Gradient signature | `linear-gradient(135deg, primary, accent)` applique via `.text-gradient-warm` |
| Effet verre | `.glass-card` : bg-card/80 + backdrop-blur-md |
| Animations | fade-in-up (0.5s), scale-in (0.3s) |
| Safe areas iOS | `env(safe-area-inset-*)` sur body et bottom nav |
| Taille input mobile | Forcee a 16px pour eviter le zoom Safari |

### 4. Roles et permissions

**3 roles utilisateur :**

| Role | Stockage | Acces |
|---|---|---|
| consumer | `profiles.role = 'consumer'` | Accueil, Explorer, Favoris, Commandes, Profil |
| merchant | `profiles.role = 'merchant'` | Dashboard commercant (reservations, stats, messages, config lots) |
| admin | `user_roles.role = 'admin'` (table separee + fonction `has_role`) | Back-office complet |

- Le role admin est verifie via `user_roles` (table dediee) et la fonction SQL `has_role()` (SECURITY DEFINER)
- Les merchants sont rediriges automatiquement vers `/dashboard`
- Le mode invite est supporte via `sessionStorage.guest_mode`

### 5. Architecture des ecrans

**5.1 Ecrans publics / consommateur**

| Ecran | Route | Description |
|---|---|---|
| Welcome | `/` | Page d'accueil avec image hero plein ecran, boutons Connexion/Inscription/Invite/Partenaire |
| Auth | `/auth` | Login, Signup, Signup merchant, Mot de passe oublie. OAuth Google + Apple |
| Home | `/home` (onglet home) | Hero section, bandeau impact, filtre categories, liste offres du jour, section "Demain" |
| Explorer | `/home` (onglet explore) | Recherche texte, tri prix/note, filtre categories, liste offres + offres demain |
| Carte | Overlay depuis Home | Carte Leaflet interactive avec marqueurs restaurants |
| Detail offre | Overlay | Image hero, infos restaurant, notes multi-criteres, carte mini, prix barre/reduit, avertissement allergenes, rappel emballage, bouton reserver |
| Checkout | `/checkout` | Stripe Embedded Checkout |
| Retour checkout | `/checkout-return` | Verification paiement + creation reservation |
| Commandes | `/home` (onglet orders) | Liste des reservations avec statut, code retrait, date, prix |
| Detail reservation | Overlay | QR code, code retrait, statut, evaluation multi-criteres (qualite/quantite/presentation), signalement |
| Favoris | `/home` (onglet favorites) | Liste restaurants favoris avec photo, categorie, adresse |
| Profil | `/home` (onglet profile) | Infos utilisateur, stats (repas sauves/euros economises), menu, deconnexion |
| Maintenance | `/*` (quand active) | Message de maintenance personnalisable |

**5.2 Dashboard commercant**

| Onglet | Description |
|---|---|
| Dashboard | Photo restaurant, config lot anti-gaspi (prix/quantite/creneau/photo), calendrier overrides, section paiements Stripe Connect |
| Reservations | Liste reservations en attente : boutons Accepter/Refuser avec capture/annulation paiement |
| Commandes | Historique des commandes passees (acceptees/completees) avec bouton "Marquer comme retire" |
| Messages | Messagerie support avec admin (conversation threaded, indicateur non-lus) |
| Statistiques | KPI (moyenne/jour, revenus 30j), graphique commandes/jour, graphique revenus/mois (Recharts) |

**5.3 Back-office admin**

| Route | Description |
|---|---|
| `/admin` | Vue d'ensemble : compteurs restaurants, offres, utilisateurs, en attente |
| `/admin/restaurants` | Liste restaurants avec validation (approuver/rejeter) |
| `/admin/restaurants/:id` | Detail restaurant |
| `/admin/reservations` | Toutes les reservations |
| `/admin/messages` | Messages support des commercants |
| `/admin/payouts` | Gestion des versements |
| `/admin/reports` | Signalements utilisateurs |
| `/admin/analytics` | Statistiques globales |
| `/admin/settings` | Taux de commission (slider), mode maintenance (switch + message) |

### 6. Navigation

**Consommateur** : Bottom nav fixe avec 5 onglets (Accueil, Explorer, Commandes, Favoris, Profil) - fond couleur primaire, indicateur actif en haut.

**Commercant** : Bottom nav separee avec 5 onglets (Dashboard, Reservations, Commandes, Messages, Statistiques) - badges non-lus sur Messages et Reservations.

**Admin** : Layout sidebar desktop classique.

### 7. Logique metier

**7.1 Tarification**
- Prix de vente = Valeur reelle x 0.40 (reduction fixe de 60%)
- Prix minimum : 10 euros de valeur reelle (soit 4 euros prix de vente)
- Commission plateforme : configurable via `platform_settings.commission_rate` (defaut 50%)

**7.2 Flux de paiement**
1. Le consommateur clique "Reserver" -> redirige vers `/checkout` avec parametres
2. Edge function `create-payment` cree une session Stripe Checkout Embedded
3. Mode `manual capture` : l'argent est autorise mais pas debite
4. Retour sur `/checkout-return` -> Edge function `verify-payment` verifie la session et cree la reservation
5. Le commercant voit la reservation en statut "confirmed" (en attente)
6. **Accepter** : statut -> "accepted", Edge function `capture-payment` debite le client
7. **Refuser** : statut -> "cancelled", Edge function `capture-payment` (action: cancel) annule l'autorisation
8. **Retrait** : statut -> "completed" marque manuellement par le commercant

**7.3 Split payment (Stripe Connect)**
- Si le restaurant a un `stripe_account_id`, le paiement utilise `transfer_data.destination`
- `application_fee_amount` = montant x taux commission
- Sinon, paiement simple sans split (les fonds restent sur le compte plateforme avec payout enregistre dans `restaurant_payouts`)

**7.4 Generation des offres**
- Fonction SQL `generate_daily_offers` appelee automatiquement au premier chargement du jour
- Genere les offres du jour a partir de `surprise_bag_config` pour chaque restaurant actif
- Les offres expirees (creneau depasse) sont filtrees cote client toutes les 60 secondes

**7.5 Offres "Demain"**
- Reservations pour le lendemain avec paiement differe (manual capture)
- Le consommateur est informe que le debit n'intervient que si le commercant confirme
- Utilise `config_id` + `pickup_date` au lieu de `offer_id`

**7.6 Overrides journaliers**
- Le commercant peut modifier quantite, creneau ou suspendre un jour via le calendrier
- Table `daily_overrides` avec `is_suspended`, `quantity`, `pickup_start`, `pickup_end`

**7.7 Expiration automatique**
- Fonction SQL `expire_unconfirmed_reservations` expire les reservations non confirmees

**7.8 Notifications**
- Table `notifications` avec types, titre, message, metadata JSON
- Composant NotificationBell avec badge non-lus

**7.9 Evaluations**
- Apres retrait (status "completed"), evaluation multi-criteres :
  - Qualite des produits (1-5 etoiles)
  - Quantite / rapport qualite-prix (1-5 etoiles)
  - Presentation / emballage (1-5 etoiles)
- Note globale = moyenne des 3 criteres
- Fonctions SQL `get_restaurant_rating` et `get_all_restaurant_ratings`

**7.10 Signalements**
- Le consommateur peut signaler un probleme sur une reservation (texte + photo optionnelle)
- Photos stockees dans le bucket `report-images`
- Visibles par l'admin dans `/admin/reports`

**7.11 Favoris**
- Table `favorites` (user_id, restaurant_id)
- Toggle coeur sur les cartes offres et les commandes

**7.12 Messagerie support commercant**
- Table `support_messages` + `support_replies`
- Sujets : general, technique, paiements, autre
- Indicateurs non-lus cote merchant (`merchant_unread`) et admin (`admin_unread`)
- Conversation threaded avec bulles differenciees merchant/admin

### 8. Schema de base de donnees

**Tables principales :**

| Table | Description |
|---|---|
| `profiles` | user_id, role, full_name, email |
| `user_roles` | user_id, role (enum: admin, moderator, user) |
| `restaurants` | Infos commercant (nom, adresse, coords, categorie, SIRET, tel, image, stripe_account_id, status) |
| `surprise_bag_config` | Config lot par restaurant (prix, quantite, creneau, photo, actif) |
| `daily_overrides` | Modifications journalieres (date, quantite, creneau, suspension) |
| `offers` | Offres generees quotidiennement (titre, prix, creneau, stock, categorie, date) |
| `reservations` | Reservations (user_id, offer_id/config_id, pickup_code, status, payment_intent_id, pickup_date) |
| `restaurant_payouts` | Ventilation paiements (montant total, commission, montant restaurant, statut transfert) |
| `reviews` | Evaluations (rating global + quality/quantity/presentation) |
| `favorites` | Favoris utilisateur-restaurant |
| `notifications` | Notifications in-app |
| `reports` | Signalements (message, photo, statut, notes admin) |
| `support_messages` | Tickets support merchant |
| `support_replies` | Reponses threaded |
| `platform_settings` | Commission, mode maintenance, message maintenance |

**Vue :** `restaurants_public` (vue publique sans champs sensibles comme owner_id, stripe_account_id)

**Fonctions SQL :**
- `generate_daily_offers` : generation quotidienne des offres
- `expire_unconfirmed_reservations` : expiration automatique
- `get_restaurant_rating` / `get_all_restaurant_ratings` : calcul moyennes avis
- `has_role` : verification RBAC (SECURITY DEFINER)

### 9. Edge Functions (backend)

| Fonction | Description |
|---|---|
| `create-payment` | Cree session Stripe Checkout (manual capture, split Connect si applicable) |
| `verify-payment` | Verifie session Stripe + cree reservation |
| `capture-payment` | Capture ou annule l'autorisation de paiement |
| `create-connect-account` | Cree compte Stripe Connect Express pour un restaurant |
| `check-connect-status` | Verifie statut onboarding Connect |
| `create-connect-login-link` | Genere lien dashboard Connect |
| `transfer-pending-payouts` | Transfere payouts en attente quand Connect devient actif |
| `geocode-restaurants` | Geocode adresses restaurants via Nominatim |

### 10. Authentification

- **Email/mot de passe** : inscription avec confirmation email obligatoire
- **OAuth** : Google et Apple via proxy Lovable Cloud
- **Capacitor iOS** : deep link `surplussavvy://auth/callback` pour injecter les tokens OAuth dans le WebView
- **Mot de passe oublie** : envoi email de reinitialisation
- **Mode invite** : acces lecture seule sans compte (sessionStorage)

### 11. Onboarding commercant

Parcours en 3-4 etapes :
1. **Compte** (si non connecte) : creation compte email/mdp avec role merchant
2. **Restaurant** : nom, adresse (avec verification geocodage Nominatim), code postal, ville, SIRET optionnel, telephone, categorie (6 choix), description, photo
3. **Configuration lot** : prix (min 10 euros), quantite/jour, creneau retrait
4. **Confirmation** : recapitulatif + soumission

Apres inscription, redirection vers le dashboard ou le commercant peut configurer Stripe Connect.

### 12. Securite
- RLS active sur toutes les tables
- Fonction `has_role` en SECURITY DEFINER pour eviter la recursion RLS
- Roles admin stockes dans table separee `user_roles`
- Vue `restaurants_public` masque les champs sensibles
- Validation cote serveur dans les Edge Functions
- Paiement en manual capture pour eviter les debits non confirmes

---

## Fichier a creer

| Fichier | Action |
|---|---|
| `docs/CAHIER_DES_CHARGES.md` | Creer avec le contenu complet ci-dessus, formate en Markdown propre |

