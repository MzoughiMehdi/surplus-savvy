CREATE UNIQUE INDEX unique_offer_per_restaurant_per_day
ON offers (restaurant_id, date)
WHERE is_active = true;