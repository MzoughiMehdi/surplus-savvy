
# Systeme de messagerie bidirectionnelle Admin / Commercant

## Ce qui sera fait

Transformer le systeme de messages de support actuel en une messagerie conversationnelle : l'admin pourra repondre aux messages des commercants, et les commercants auront un onglet "Messages" dans leur barre de navigation pour consulter les conversations et les reponses.

## Modifications de la base de donnees

### Nouvelle table `support_replies`

Stocker les reponses (admin ou commercant) liees a un message de support :
- `id` (uuid)
- `message_id` (uuid, reference a `support_messages.id`)
- `sender_role` (text : "admin" ou "merchant")
- `sender_id` (uuid, l'utilisateur qui repond)
- `content` (text)
- `created_at` (timestamp)

Politiques RLS :
- Les admins peuvent tout voir et inserer des reponses
- Les proprietaires du restaurant lie au message peuvent voir et inserer des reponses
- Personne ne peut supprimer

## Cote Admin

### Nouvelle page `src/pages/admin/AdminMessages.tsx`

- Page dediee accessible via un nouvel onglet "Messages" dans la sidebar admin (icone `MessageCircle`)
- Liste des conversations (support_messages) avec nom du restaurant, sujet, date, statut, nombre de reponses
- Clic sur une conversation ouvre un volet de detail avec le fil de messages (message initial + reponses) et un champ de reponse en bas
- Possibilite de changer le statut (Nouveau, Lu, Resolu)

### Modifications dans `AdminLayout.tsx`

- Ajouter l'entree "Messages" dans `navItems` avec l'icone `MessageCircle`

### Modifications dans `App.tsx`

- Ajouter la route `/admin/messages` vers `AdminMessages`

### Nettoyage `AdminDashboard.tsx`

- Retirer la section messages du dashboard (elle est deplacee dans sa propre page)
- Garder uniquement les stats (restaurants, offres, utilisateurs, en attente)

## Cote Commercant

### Nouvel onglet "Messages" dans `Dashboard.tsx`

- Ajouter un onglet "Messages" (icone `MessageCircle`) dans la barre de navigation du bas du commercant, entre "Commandes" et "Statistiques"
- Le contenu de l'onglet affiche :
  - Un bouton "Nouveau message" qui ouvre le `ContactSupportDialog` existant
  - La liste des conversations precedentes avec sujet, date, statut
  - Clic sur une conversation affiche le fil (message initial + reponses) et un champ pour repondre

## Resume des fichiers

| Fichier | Action |
|---|---|
| Migration SQL | Creer table `support_replies` + RLS |
| `src/pages/admin/AdminMessages.tsx` | Nouvelle page de messagerie admin |
| `src/pages/admin/AdminLayout.tsx` | Ajouter entree "Messages" dans la sidebar |
| `src/pages/admin/AdminDashboard.tsx` | Retirer la section messages |
| `src/App.tsx` | Ajouter route `/admin/messages` |
| `src/pages/Dashboard.tsx` | Ajouter onglet "Messages" avec liste conversations et reponses |

## Details techniques

- Les reponses sont chargees via une jointure `support_replies` filtree par `message_id`
- Le champ de reponse insere dans `support_replies` avec `sender_role` = "admin" ou "merchant" selon le contexte
- Le statut du message passe automatiquement a "read" quand l'admin repond, et reste modifiable manuellement
- L'affichage du fil de conversation est un simple scroll vertical avec des bulles alignees a gauche (commercant) ou a droite (admin)
