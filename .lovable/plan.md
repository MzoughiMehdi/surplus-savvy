

# Correction des bugs 1, 2, 3 et 4

## Bug 1 : Trigger `handle_new_user` ne synchronise pas le role merchant

**Probleme** : Le trigger `handle_new_user` cree toujours un profil avec le role par defaut `consumer`, meme quand l'utilisateur s'inscrit via le mode `merchant-signup` qui envoie `role: "merchant"` dans les metadata.

**Correction** : Migration SQL pour modifier la fonction `handle_new_user` afin de lire `raw_user_meta_data->>'role'` et l'utiliser si present (avec fallback sur `consumer`).

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')
  );
  RETURN NEW;
END;
$$;
```

---

## Bug 2 : Deduplication verify-payment par session_id Stripe

**Fichier** : `supabase/functions/verify-payment/index.ts`

**Probleme** : La deduplication actuelle cherche une reservation recente (5 min) du meme user pour la meme offre. Cela empeche un utilisateur d'acheter deux fois la meme offre legitimement, et reste fragile temporellement.

**Correction** : 
- Ajouter une colonne `stripe_session_id` a la table `reservations` (migration)
- Stocker le `sessionId` dans la reservation a la creation
- Dedupliquer en verifiant si une reservation avec ce `stripe_session_id` existe deja

Migration :
```sql
ALTER TABLE reservations ADD COLUMN stripe_session_id text;
CREATE UNIQUE INDEX idx_reservations_stripe_session ON reservations(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
```

Edge function : remplacer la requete de deduplication par un `.eq("stripe_session_id", sessionId)` et ajouter `stripe_session_id: sessionId` dans l'insert.

---

## Bug 3 : Lien merchant dans ProfilePage sans contexte auth

**Fichier** : `src/pages/ProfilePage.tsx` (ligne 102)

**Probleme** : Le bouton "Vous etes commercant ?" redirige vers `/merchant-onboarding` directement. Un utilisateur non connecte arrive sur le formulaire sans etre authentifie, ce qui provoque des erreurs.

**Correction** : Rediriger vers `/auth?mode=merchant-signup` pour que l'utilisateur passe d'abord par l'authentification avec le bon contexte merchant.

---

## Bug 4 : Boutons Parametres et Aide inactifs dans ProfilePage

**Fichier** : `src/pages/ProfilePage.tsx` (lignes 130-133)

**Probleme** : Les boutons "Parametres" et "Aide & Contact" n'ont aucun `onClick` handler, ils ne font rien au clic.

**Correction** : Ajouter des handlers avec `toast.info()` pour informer l'utilisateur que ces fonctionnalites arrivent bientot (pattern "coming soon"), car il n'y a pas encore de pages dediees.

```typescript
if (item.label === "Paramètres") toast.info("Les paramètres arrivent bientôt !");
if (item.label === "Aide & Contact") toast.info("Le support arrive bientôt !");
```

---

## Resume

| Bug | Type | Fichier(s) | Action |
|-----|------|-----------|--------|
| 1 | Migration + DB | Trigger `handle_new_user` | Lire le role depuis les metadata |
| 2 | Migration + Edge Function | `reservations` + `verify-payment` | Colonne `stripe_session_id` + dedup par session |
| 3 | Frontend | `ProfilePage.tsx` L102 | `/merchant-onboarding` -> `/auth?mode=merchant-signup` |
| 4 | Frontend | `ProfilePage.tsx` L130-133 | Ajout toast "coming soon" sur Parametres et Aide |

