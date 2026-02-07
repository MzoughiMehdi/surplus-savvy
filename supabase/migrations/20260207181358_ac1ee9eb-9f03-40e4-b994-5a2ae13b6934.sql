
DROP POLICY "Anyone can view active offers" ON public.offers;

CREATE POLICY "Anyone can view active offers"
ON public.offers
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = offers.restaurant_id
    AND restaurants.status = 'approved'
  )
);
