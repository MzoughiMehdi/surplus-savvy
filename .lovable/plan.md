
# Ajouter "Contactez-nous" pour les commercants

## Ce qui sera fait

Ajout d'un bouton "Contactez-nous" sur le dashboard marchand permettant d'envoyer un message a l'equipe de la plateforme. Le message sera stocke en base de donnees pour que les admins puissent le consulter.

## Modifications

### 1. Nouvelle table `support_messages`

Creation d'une table pour stocker les messages des commercants :
- `id` (uuid, cle primaire)
- `restaurant_id` (uuid, reference au restaurant)
- `user_id` (uuid, l'utilisateur qui envoie)
- `subject` (text, sujet du message)
- `message` (text, contenu)
- `status` (text, default "pending" -- pending/read/resolved)
- `created_at` (timestamp)

Politiques RLS :
- Les proprietaires peuvent inserer et voir leurs propres messages
- Les admins peuvent tout voir et mettre a jour le statut

### 2. Composant `ContactSupportDialog`

Nouveau composant `src/components/ContactSupportDialog.tsx` :
- Un Dialog (modal) avec un formulaire simple : sujet (select parmi quelques options) + message (textarea)
- Options de sujet : "Question generale", "Probleme technique", "Paiements", "Autre"
- Validation avec longueur minimum du message
- Insertion dans la table `support_messages` via Supabase
- Toast de confirmation apres envoi

### 3. Dashboard marchand (`src/pages/Dashboard.tsx`)

- Ajouter un bouton "Contactez-nous" dans l'onglet Dashboard, en bas apres le calendrier
- Import de l'icone `MessageCircle` de lucide-react
- Le bouton ouvre le `ContactSupportDialog`

### 4. Admin : consultation des messages (optionnel mais recommande)

- Ajouter une section dans `AdminDashboard.tsx` ou une nouvelle page pour lister les messages recus avec le nom du restaurant, le sujet, la date et le statut

## Resume

| Fichier | Action |
|---|---|
| Migration SQL | Creer table `support_messages` + RLS |
| `src/components/ContactSupportDialog.tsx` | Nouveau composant modal de contact |
| `src/pages/Dashboard.tsx` | Ajouter bouton "Contactez-nous" |
| `src/pages/admin/AdminDashboard.tsx` | Afficher les messages recus (optionnel) |
