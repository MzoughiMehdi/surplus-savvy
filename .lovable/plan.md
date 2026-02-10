

# Ajout d'onglets de navigation sur le Dashboard commercant

## Structure des 4 onglets

Navigation fixe en bas de page, meme style visuel que le `BottomNav` existant (fond primary, icones blanches, indicateur actif) :

1. **Dashboard** (defaut) -- icone `Store` -- contenu actuel : photo, abonnement, Connect, stats rapides, config panier, calendrier
2. **Reservations** -- icone `Clock` -- reservations en attente de validation (statut `confirmed`) avec boutons Accepter/Refuser
3. **Commandes** -- icone `ShoppingBag` -- commandes acceptees (`accepted`) avec bouton "Marquer comme retire" + commandes retirees (`completed`)
4. **Statistiques** -- icone `BarChart3` -- metriques et graphiques

## Contenu de l'onglet Statistiques

- **Moyenne de reservations par jour** sur les 30 derniers jours (card avec chiffre)
- **Graphique en barres** : nombre de commandes par jour sur les 30 derniers jours (recharts `BarChart`)
- **Total revenus bruts des 30 derniers jours** (somme des `discounted_price` des reservations `completed`)
- **Graphique en barres des revenus par mois** (recharts `BarChart`)

## Changements techniques

### Fichier : `src/pages/Dashboard.tsx`

1. **Ajouter un state `activeTab`** : `"dashboard" | "reservations" | "commandes" | "stats"`, defaut `"dashboard"`

2. **Augmenter la limite de la requete** de 20 a 200 pour avoir assez de donnees pour les statistiques

3. **Creer un composant `MerchantBottomNav` inline** reprenant le style exact de `BottomNav` :
   - 4 boutons : Dashboard, Reservations, Commandes, Statistiques
   - Meme classes CSS : `fixed bottom-0`, `bg-primary`, `text-primary-foreground`, indicateur actif

4. **Reorganiser le rendu conditionnel** :
   - Le header (titre, logout, notifications) reste toujours visible
   - Le contenu change selon `activeTab` :
     - `"dashboard"` : photo, abonnement, Connect, statut pending, stats rapides, config panier, calendrier
     - `"reservations"` : liste filtree sur `status === "confirmed"` avec boutons Accepter/Refuser et badges Aujourd'hui/Demain
     - `"commandes"` : liste filtree sur `status === "accepted"` ou `"completed"`, bouton "Marquer comme retire" pour les acceptees
     - `"stats"` : calculs et graphiques recharts

5. **Ajouter `pb-24`** au conteneur principal pour l'espace sous la nav fixe

6. **Section Statistiques** :
   - Filtrer les reservations des 30 derniers jours
   - Calculer la moyenne par jour : `total / 30`
   - Grouper par jour pour le graphique barres (recharts `BarChart`, `XAxis`, `YAxis`, `Tooltip`, `Bar`)
   - Calculer le total brut : somme des `discounted_price` des reservations `completed`
   - Grouper par mois pour le graphique revenus mensuels
   - Utiliser `ResponsiveContainer` pour le responsive

### Aucun nouveau fichier, aucun changement backend

Tout reste dans `Dashboard.tsx`. Les donnees sont filtrees/calculees a partir des reservations deja chargees. `recharts` est deja installe.

