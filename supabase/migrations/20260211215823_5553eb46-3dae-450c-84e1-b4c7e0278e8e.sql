
CREATE OR REPLACE FUNCTION public.generate_daily_offers()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Deactivate past offers still marked active
  UPDATE offers SET is_active = false WHERE date < (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date AND is_active = true;

  -- Generate today's offers from surprise_bag_config
  INSERT INTO offers (restaurant_id, title, description, original_price, discounted_price, quantity, items_left, pickup_start, pickup_end, image_url, category, date, is_active)
  SELECT
    c.restaurant_id,
    'Lot Anti-Gaspi',
    'Un assortiment surprise de nos meilleurs produits du jour',
    c.base_price,
    ROUND(c.base_price * 0.4, 2),
    COALESCE(ov.quantity, c.daily_quantity),
    COALESCE(ov.quantity, c.daily_quantity),
    COALESCE(ov.pickup_start, c.pickup_start),
    COALESCE(ov.pickup_end, c.pickup_end),
    c.image_url,
    r.category,
    (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date,
    true
  FROM surprise_bag_config c
  JOIN restaurants r ON r.id = c.restaurant_id
  LEFT JOIN daily_overrides ov ON ov.restaurant_id = c.restaurant_id AND ov.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date
  WHERE c.is_active = true
    AND r.status = 'approved'
    AND (ov IS NULL OR ov.is_suspended = false)
    AND NOT EXISTS (
      SELECT 1 FROM offers o
      WHERE o.restaurant_id = c.restaurant_id
      AND o.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date
    );
$function$;

CREATE OR REPLACE FUNCTION public.expire_unconfirmed_reservations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  pickup_end_time TIME;
  pickup_date_val DATE;
  deadline TIMESTAMPTZ;
  paris_now TIMESTAMPTZ;
BEGIN
  paris_now := NOW() AT TIME ZONE 'Europe/Paris';

  FOR r IN
    SELECT res.id, res.offer_id, res.config_id, res.pickup_date, res.payment_intent_id, res.status,
           o.pickup_end AS offer_pickup_end, o.date AS offer_date,
           c.pickup_end AS config_pickup_end
    FROM reservations res
    LEFT JOIN offers o ON o.id = res.offer_id
    LEFT JOIN surprise_bag_config c ON c.id = res.config_id
    WHERE res.status IN ('confirmed', 'accepted')
  LOOP
    pickup_end_time := COALESCE(r.offer_pickup_end, r.config_pickup_end);
    IF pickup_end_time IS NULL THEN
      CONTINUE;
    END IF;

    pickup_date_val := COALESCE(r.pickup_date, r.offer_date, (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date);
    deadline := (pickup_date_val + pickup_end_time) - INTERVAL '30 minutes';

    IF paris_now >= deadline THEN
      UPDATE reservations SET status = 'expired' WHERE id = r.id;
      
      IF r.offer_id IS NOT NULL THEN
        UPDATE offers SET items_left = items_left + 1 WHERE id = r.offer_id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;
