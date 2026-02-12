

# Badges "Nouveau" pour les messages - Admin et Commerçant

## Objectif

Afficher un indicateur visuel (badge avec compteur) sur l'onglet Messages quand de nouveaux messages ou réponses arrivent, côté admin et côté commerçant.

## Approche

Ajouter deux colonnes booléennes sur la table `support_messages` pour suivre les messages non lus de chaque côté :
- `admin_unread` : passe à `true` quand le commerçant envoie un nouveau message ou une réponse, repassé à `false` quand l'admin ouvre la conversation
- `merchant_unread` : passe à `true` quand l'admin répond, repassé à `false` quand le commerçant ouvre la conversation

## Modifications

### 1. Migration SQL

- Ajouter `admin_unread boolean NOT NULL DEFAULT true` sur `support_messages` (true par défaut car un nouveau message est non lu pour l'admin)
- Ajouter `merchant_unread boolean NOT NULL DEFAULT false` sur `support_messages` (false par défaut car c'est le commerçant qui initie)

### 2. `src/pages/admin/AdminMessages.tsx`

- Au chargement de la liste, compter les messages avec `admin_unread = true`
- Afficher le badge avec le compteur dans le titre "Messages"
- Quand l'admin ouvre une conversation : mettre `admin_unread = false` sur ce message
- Quand l'admin envoie une réponse : mettre `merchant_unread = true` sur le message

### 3. `src/pages/admin/AdminLayout.tsx`

- Charger le compteur de messages avec `admin_unread = true` depuis la base
- Afficher un badge rouge à côté de l'entrée "Messages" dans la sidebar quand le compteur est supérieur à 0

### 4. `src/pages/Dashboard.tsx` (commerçant)

- Dans le composant `Dashboard`, charger le compteur de messages avec `merchant_unread = true` pour le restaurant du commerçant
- Passer ce compteur au `MerchantBottomNav` pour afficher un badge sur l'onglet "Messages"
- Dans `MerchantMessagesTab`, quand le commerçant ouvre une conversation : mettre `merchant_unread = false`
- Quand le commerçant envoie une réponse : mettre `admin_unread = true`
- Afficher aussi un badge "Nouveau" sur chaque conversation non lue dans la liste

## Résumé des fichiers

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter colonnes `admin_unread` et `merchant_unread` |
| `src/pages/admin/AdminMessages.tsx` | Gérer les flags unread à l'ouverture et à l'envoi |
| `src/pages/admin/AdminLayout.tsx` | Badge compteur sur l'entrée "Messages" de la sidebar |
| `src/pages/Dashboard.tsx` | Badge compteur sur l'onglet Messages du bottom nav + flags unread |

