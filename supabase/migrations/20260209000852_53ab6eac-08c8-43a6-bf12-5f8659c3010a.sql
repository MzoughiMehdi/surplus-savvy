
-- 1. Deactivate all past offers
UPDATE offers SET is_active = false WHERE date < CURRENT_DATE AND is_active = true;

-- 2. Create the generate_daily_offers function
CREATE OR REPLACE FUNCTION generate_daily_offers()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Deactivate past offers still marked active
  UPDATE offers SET is_active = false WHERE date < CURRENT_DATE AND is_active = true;

  -- Generate today's offers from surprise_bag_config
  INSERT INTO offers (restaurant_id, title, description, original_price, discounted_price, quantity, items_left, pickup_start, pickup_end, image_url, category, date, is_active)
  SELECT
    c.restaurant_id,
    'Panier surprise',
    'Un assortiment surprise de nos meilleurs produits du jour',
    c.base_price,
    ROUND(c.base_price * 0.4, 2),
    COALESCE(ov.quantity, c.daily_quantity),
    COALESCE(ov.quantity, c.daily_quantity),
    COALESCE(ov.pickup_start, c.pickup_start),
    COALESCE(ov.pickup_end, c.pickup_end),
    c.image_url,
    r.category,
    CURRENT_DATE,
    true
  FROM surprise_bag_config c
  JOIN restaurants r ON r.id = c.restaurant_id
  LEFT JOIN daily_overrides ov ON ov.restaurant_id = c.restaurant_id AND ov.date = CURRENT_DATE
  WHERE c.is_active = true
    AND r.status = 'approved'
    AND (ov IS NULL OR ov.is_suspended = false)
    AND NOT EXISTS (
      SELECT 1 FROM offers o
      WHERE o.restaurant_id = c.restaurant_id
      AND o.date = CURRENT_DATE
    );
$$;
