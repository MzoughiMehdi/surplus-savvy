CREATE OR REPLACE FUNCTION public.handle_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_owner uuid;
  offer_title text;
  consumer_name text;
BEGIN
  IF NEW.offer_id IS NOT NULL THEN
    UPDATE public.offers SET items_left = items_left - 1 WHERE id = NEW.offer_id;

    SELECT r.owner_id, o.title INTO restaurant_owner, offer_title
    FROM public.restaurants r
    JOIN public.offers o ON o.restaurant_id = r.id
    WHERE o.id = NEW.offer_id;
  ELSIF NEW.config_id IS NOT NULL THEN
    SELECT r.owner_id INTO restaurant_owner
    FROM public.restaurants r
    JOIN public.surprise_bag_config c ON c.restaurant_id = r.id
    WHERE c.id = NEW.config_id;

    offer_title := 'Panier de demain';
  END IF;

  IF restaurant_owner IS NOT NULL THEN
    SELECT full_name INTO consumer_name
    FROM public.profiles WHERE user_id = NEW.user_id;

    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      restaurant_owner,
      '🛒 Nouvelle réservation !',
      COALESCE(consumer_name, 'Un client') || ' a réservé "'
        || COALESCE(offer_title, 'Panier') || '" — Code: ' || NEW.pickup_code,
      'reservation',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'offer_id', COALESCE(NEW.offer_id, NEW.config_id),
        'pickup_code', NEW.pickup_code
      )
    );
  END IF;

  RETURN NEW;
END;
$$;