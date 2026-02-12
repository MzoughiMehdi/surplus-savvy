

# Correction du badge Messages + Ajout badge Reservations

## Probleme identifie

Le compteur de messages non lus (`merchantUnreadCount`) est charge une seule fois au montage du composant Dashboard via `fetchData()`. Quand le commercant ouvre une conversation (ce qui marque `merchant_unread = false` en base), le compteur dans le state du parent n'est jamais mis a jour. En revenant sur la liste, le composant `MerchantMessagesTab` recharge les messages depuis la base (donc le badge "Nouveau" disparait), mais le compteur en bas reste inchange.

## Corrections prevues

### 1. Fichier `src/pages/Dashboard.tsx`

**Bug messages :**
- Extraire la logique de chargement du compteur non lu dans une fonction separee `fetchUnreadCount`
- Appeler `fetchUnreadCount` a chaque changement d'onglet vers "messages" (quand le commercant entre dans l'onglet, on recharge le compteur)
- Passer un callback `onUnreadChange` au composant `MerchantMessagesTab` pour que celui-ci puisse mettre a jour le compteur du parent quand il marque un message comme lu
- Dans `MerchantMessagesTab.openConversation`, apres avoir mis `merchant_unread = false`, appeler ce callback pour decrementer le compteur

**Badge reservations :**
- Ajouter un state `unreadReservations` qui compte les reservations avec statut `confirmed` (en attente)
- Ce compteur est calcule a partir des donnees deja chargees (`pendingReservations.length`)
- Ajouter un state `hasSeenReservations` qui passe a `true` quand le commercant entre dans l'onglet "reservations"
- Quand `hasSeenReservations` est `true`, le badge disparait
- Le badge reapparait si de nouvelles reservations arrivent (quand `pendingReservations.length` change et depasse la valeur vue)
- Passer `unreadReservations` au `MerchantBottomNav` et afficher le badge de la meme facon que pour les messages

**MerchantBottomNav :**
- Ajouter une prop `unreadReservations` pour afficher le badge sur l'onglet "Reservations"
- Generaliser l'affichage du badge pour les deux onglets (messages et reservations)

## Resume technique

| Fichier | Modification |
|---|---|
| `src/pages/Dashboard.tsx` | Corriger le rafraichissement du compteur messages, ajouter badge reservations, passer callback au MerchantMessagesTab |

Aucune modification de base de donnees requise. Le compteur de reservations utilise les donnees deja presentes (reservations en attente).

