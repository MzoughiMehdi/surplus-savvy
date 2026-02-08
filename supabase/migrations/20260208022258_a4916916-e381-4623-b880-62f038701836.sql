CREATE POLICY "Users can view offers from own reservations"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.offer_id = offers.id
      AND reservations.user_id = auth.uid()
    )
  );