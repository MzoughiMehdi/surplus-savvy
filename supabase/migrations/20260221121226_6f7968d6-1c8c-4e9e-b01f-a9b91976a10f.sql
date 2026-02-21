CREATE POLICY "Owners can update own messages"
ON public.support_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = support_messages.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = support_messages.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);