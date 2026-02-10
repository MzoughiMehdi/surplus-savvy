
-- Create the expiration function
CREATE OR REPLACE FUNCTION public.expire_unconfirmed_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  pickup_end_time TIME;
  pickup_date_val DATE;
  deadline TIMESTAMPTZ;
BEGIN
  FOR r IN
    SELECT res.id, res.offer_id, res.config_id, res.pickup_date, res.payment_intent_id,
           o.pickup_end AS offer_pickup_end, o.date AS offer_date,
           c.pickup_end AS config_pickup_end
    FROM reservations res
    LEFT JOIN offers o ON o.id = res.offer_id
    LEFT JOIN surprise_bag_config c ON c.id = res.config_id
    WHERE res.status = 'confirmed'
  LOOP
    pickup_end_time := COALESCE(r.offer_pickup_end, r.config_pickup_end);
    IF pickup_end_time IS NULL THEN
      CONTINUE;
    END IF;

    pickup_date_val := COALESCE(r.pickup_date, r.offer_date, CURRENT_DATE);
    deadline := (pickup_date_val + pickup_end_time) - INTERVAL '30 minutes';

    IF NOW() >= deadline THEN
      UPDATE reservations SET status = 'expired' WHERE id = r.id;
      
      IF r.offer_id IS NOT NULL THEN
        UPDATE offers SET items_left = items_left + 1 WHERE id = r.offer_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;
