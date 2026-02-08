

# Systeme de notation multi-criteres + notification d'evaluation

## Objectif

1. Permettre aux clients de noter une commande retiree selon 3 criteres (qualite, quantite, presentation)
2. Afficher les moyennes par critere dans la fiche detail d'un panier
3. Envoyer automatiquement une notification au client quand sa commande est marquee comme retiree, l'invitant a evaluer son panier

---

## Ce qui change pour l'utilisateur

- **Apres le retrait** : le client recoit une notification "Evaluez votre panier !" qui l'invite a donner son avis
- **Lors de la notation** : 3 lignes d'etoiles (Qualite, Quantite, Presentation) au lieu d'une seule note globale
- **Dans la fiche d'un panier** : les moyennes de chaque critere s'affichent sous la note globale (ex: Qualite 4.2, Quantite 3.8, Presentation 4.5)

---

## Etapes d'implementation

### 1. Migration base de donnees

- Ajouter 3 colonnes a la table `reviews` : `rating_quality`, `rating_quantity`, `rating_presentation`
- Mettre a jour les fonctions RPC `get_restaurant_rating` et `get_all_restaurant_ratings` pour inclure les moyennes par critere
- Creer un trigger `on_reservation_completed` qui insere une notification au client quand le statut passe a "completed"

### 2. Notification automatique au retrait

Un trigger PostgreSQL sur la table `reservations` detecte le passage du statut a "completed" et cree automatiquement une notification pour le client avec :
- Titre : "Evaluez votre panier !"
- Message : "Comment etait votre panier de [nom du restaurant] ? Donnez votre avis."
- Type : "review_prompt"
- Metadata : reservation_id et restaurant_id (pour navigation directe)

### 3. Mise a jour du formulaire de notation

Le composant `ReservationConfirmation` affichera 3 lignes d'etoiles :
- Qualite des produits
- Quantite / rapport qualite-prix
- Presentation / emballage

Le bouton d'envoi ne s'active que quand les 3 criteres sont remplis. La note globale est calculee comme la moyenne des 3.

### 4. Affichage des moyennes dans la fiche panier

Le composant `OfferDetail` affichera sous la note globale existante une section compacte avec les 3 moyennes par critere (visible uniquement si des avis existent).

### 5. Mise a jour des hooks

- `useReviews.ts` : gestion des 3 sous-notes a l'envoi et a la lecture
- `useAllRestaurantRatings.ts` : propagation des sous-moyennes pour l'affichage dans les fiches

---

## Details techniques

### Migration SQL

```sql
-- Nouvelles colonnes
ALTER TABLE public.reviews
  ADD COLUMN rating_quality integer,
  ADD COLUMN rating_quantity integer,
  ADD COLUMN rating_presentation integer;

ALTER TABLE public.reviews
  ADD CONSTRAINT check_rating_quality CHECK (rating_quality BETWEEN 1 AND 5),
  ADD CONSTRAINT check_rating_quantity CHECK (rating_quantity BETWEEN 1 AND 5),
  ADD CONSTRAINT check_rating_presentation CHECK (rating_presentation BETWEEN 1 AND 5);

-- RPC mise a jour
CREATE OR REPLACE FUNCTION public.get_restaurant_rating(p_restaurant_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint, avg_quality numeric, avg_quantity numeric, avg_presentation numeric)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*),
    ROUND(AVG(rating_quality)::numeric, 1),
    ROUND(AVG(rating_quantity)::numeric, 1),
    ROUND(AVG(rating_presentation)::numeric, 1)
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id;
$$;

CREATE OR REPLACE FUNCTION public.get_all_restaurant_ratings()
RETURNS TABLE(restaurant_name text, avg_rating numeric, review_count bigint, avg_quality numeric, avg_quantity numeric, avg_presentation numeric)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    r.name, ROUND(AVG(rev.rating)::numeric, 1), COUNT(*),
    ROUND(AVG(rev.rating_quality)::numeric, 1),
    ROUND(AVG(rev.rating_quantity)::numeric, 1),
    ROUND(AVG(rev.rating_presentation)::numeric, 1)
  FROM public.reviews rev
  JOIN public.restaurants r ON r.id = rev.restaurant_id
  GROUP BY r.name;
$$;

-- Trigger notification au retrait
CREATE OR REPLACE FUNCTION public.handle_reservation_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  offer_title text;
  restaurant_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    SELECT o.title, r.name INTO offer_title, restaurant_name
    FROM offers o JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.id = NEW.offer_id;

    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Evaluez votre panier !',
      'Comment etait votre panier de ' || restaurant_name || ' ? Donnez votre avis.',
      'review_prompt',
      jsonb_build_object('reservation_id', NEW.id, 'restaurant_id', NEW.restaurant_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reservation_completed
  AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION handle_reservation_completed();
```

### Fichiers modifies

1. **`src/hooks/useReviews.ts`** : `submitReview` accepte les 3 notes, calcule la moyenne globale ; `useUserReviewForReservation` retourne les sous-notes
2. **`src/hooks/useAllRestaurantRatings.ts`** : retourne les 3 moyennes par critere
3. **`src/components/ReservationConfirmation.tsx`** : formulaire avec 3 lignes d'etoiles + affichage lecture seule
4. **`src/components/OfferDetail.tsx`** : section compacte avec les moyennes par critere sous la note globale

