
DROP POLICY IF EXISTS "Restaurant owners can manage offers" ON offers;
CREATE POLICY "Restaurant owners can manage offers" ON offers
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Anyone can view active offers" ON offers;
CREATE POLICY "Anyone can view active offers" ON offers
  FOR SELECT
  USING (
    is_active = true AND items_left > 0
    AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = offers.restaurant_id
      AND restaurants.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Users can view offers from own reservations" ON offers;
CREATE POLICY "Users can view offers from own reservations" ON offers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.offer_id = offers.id
    AND reservations.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can view all offers" ON offers;
CREATE POLICY "Admins can view all offers" ON offers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
