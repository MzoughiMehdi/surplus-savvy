

# Onglet Reservations admin, Signalements consommateur et admin

## 1. Page admin "Reservations" (`/admin/reservations`)

Creer une nouvelle page `src/pages/admin/AdminReservations.tsx` qui affiche toutes les reservations de la plateforme, avec les memes types de filtres que la page Paiements :

- **Filtre par commercant** : champ texte avec autocompletion (meme composant que Paiements)
- **Filtre par statut** : Select (Tous / En attente / Acceptee / Retiree / Annulee)
- **Filtre par date** : date debut et date fin

Tableau avec colonnes : Consommateur (email ou nom), Restaurant, Offre, Date, Statut, Code retrait.

### Fichiers concernes
- **Creer** `src/pages/admin/AdminReservations.tsx`
- **Modifier** `src/pages/admin/AdminLayout.tsx` : ajouter "Reservations" dans `navItems` (icone `ClipboardList`, url `/admin/reservations`)
- **Modifier** `src/App.tsx` : ajouter la route `<Route path="reservations" element={<AdminReservations />} />`

## 2. Systeme de signalement cote consommateur

Permettre a un consommateur de signaler une commande (texte + photo) depuis le detail de sa reservation.

### Base de donnees

Creer une table `reports` via migration SQL :

```sql
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reservation_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  message text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Consommateurs peuvent creer et voir leurs propres signalements
CREATE POLICY "Users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins peuvent tout voir et mettre a jour
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
```

Creer un bucket storage `report-images` (public) pour les photos de signalement.

### Bouton "Signaler" dans le detail de commande

**Modifier** `src/components/ReservationConfirmation.tsx` :
- Ajouter un bouton "Signaler un probleme" (icone `Flag`) en bas de la page
- Au clic, ouvrir un Dialog avec :
  - Un champ texte (Textarea) pour decrire le probleme
  - Un bouton d'upload photo (upload vers le bucket `report-images`)
  - Un bouton "Envoyer le signalement"
- Apres envoi, inserer une ligne dans la table `reports`
- Afficher un toast de confirmation
- Si un signalement existe deja pour cette reservation, afficher "Signalement envoye" au lieu du bouton

## 3. Onglet admin "Signalements" (`/admin/reports`)

Creer une page `src/pages/admin/AdminReports.tsx` pour consulter tous les signalements.

### Contenu de la page
- Liste des signalements avec : Consommateur, Restaurant, Date, Message (tronque), Photo (miniature cliquable), Statut
- **Filtre par statut** : Tous / En attente / Traite / Rejete
- **Filtre par commercant** : champ texte avec autocompletion
- Cliquer sur un signalement ouvre un detail avec :
  - Le message complet
  - La photo en grand
  - Un champ "Notes admin" (Textarea) pour ajouter des commentaires
  - Boutons "Marquer traite" / "Rejeter" qui mettent a jour le statut

### Fichiers concernes
- **Creer** `src/pages/admin/AdminReports.tsx`
- **Modifier** `src/pages/admin/AdminLayout.tsx` : ajouter "Signalements" dans `navItems` (icone `Flag`, url `/admin/reports`)
- **Modifier** `src/App.tsx` : ajouter la route `<Route path="reports" element={<AdminReports />} />`

## Resume des fichiers

| Fichier | Action |
|---|---|
| Migration SQL | Creer table `reports` + RLS + bucket `report-images` |
| `src/pages/admin/AdminReservations.tsx` | Creer |
| `src/pages/admin/AdminReports.tsx` | Creer |
| `src/components/ReservationConfirmation.tsx` | Modifier (ajouter bouton Signaler + Dialog) |
| `src/pages/admin/AdminLayout.tsx` | Modifier (ajouter 2 entrees nav) |
| `src/App.tsx` | Modifier (ajouter 2 routes) |

## Navigation admin finale

```text
+------------------+
| Vue d'ensemble   |
| Restaurants      |
| Reservations NEW |
| Paiements        |
| Signalements NEW |
| Analytics        |
| Parametres       |
+------------------+
```

