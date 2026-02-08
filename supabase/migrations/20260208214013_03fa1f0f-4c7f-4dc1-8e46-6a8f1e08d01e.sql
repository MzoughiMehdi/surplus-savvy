
-- Drop all existing SELECT policies on offers and recreate them as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Admins can view all offers" ON public.offers;
DROP POLICY IF EXISTS "Users can view offers from own reservations" ON public.offers;
DROP POLICY IF EXISTS "Restaurant owners can manage offers" ON public.offers;

-- Recreate as PERMISSIVE policies (OR logic - any one can grant access)
CREATE POLICY "Anyone can view active offers"
ON public.offers FOR SELECT
USING (
  is_active = true
  AND items_left > 0
  AND EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.status = 'approved'
  )
);

CREATE POLICY "Admins can view all offers"
ON public.offers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view offers from own reservations"
ON public.offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.offer_id = offers.id
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Restaurant owners can manage offers"
ON public.offers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);
