
-- Ajouter colonnes (IF NOT EXISTS pour idempotence)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating_quality integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating_quantity integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating_presentation integer;

-- Contraintes (drop first pour idempotence)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS check_rating_quality;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS check_rating_quantity;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS check_rating_presentation;
ALTER TABLE public.reviews ADD CONSTRAINT check_rating_quality CHECK (rating_quality BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD CONSTRAINT check_rating_quantity CHECK (rating_quantity BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD CONSTRAINT check_rating_presentation CHECK (rating_presentation BETWEEN 1 AND 5);

-- Recreer les fonctions RPC (deja droppees)
DROP FUNCTION IF EXISTS public.get_restaurant_rating(uuid);
DROP FUNCTION IF EXISTS public.get_all_restaurant_ratings();

CREATE FUNCTION public.get_restaurant_rating(p_restaurant_id uuid)
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

CREATE FUNCTION public.get_all_restaurant_ratings()
RETURNS TABLE(restaurant_name text, avg_rating numeric, review_count bigint, avg_quality numeric, avg_quantity numeric, avg_presentation numeric)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    r.name,
    ROUND(AVG(rev.rating)::numeric, 1),
    COUNT(*),
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
      'Évaluez votre panier !',
      'Comment était votre panier de ' || restaurant_name || ' ? Donnez votre avis.',
      'review_prompt',
      jsonb_build_object('reservation_id', NEW.id, 'restaurant_id', NEW.restaurant_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reservation_completed ON public.reservations;
CREATE TRIGGER on_reservation_completed
  AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_completed();
