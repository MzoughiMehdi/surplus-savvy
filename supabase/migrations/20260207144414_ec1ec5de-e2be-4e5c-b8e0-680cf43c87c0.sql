-- Add database-level constraints for offer validation
ALTER TABLE public.offers
  ADD CONSTRAINT check_prices_positive 
    CHECK (original_price > 0 AND discounted_price > 0),
  ADD CONSTRAINT check_discount_valid 
    CHECK (discounted_price < original_price),
  ADD CONSTRAINT check_quantity_positive 
    CHECK (quantity > 0 AND items_left >= 0);

-- Replace the permissive reviews SELECT policy with one that hides user_id
-- by restricting public access and creating an aggregate RPC

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Anyone can view reviews for average calculation" ON public.reviews;

-- Only allow users to see their own reviews
CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create an RPC for public aggregate rating data (no user_id exposed)
CREATE OR REPLACE FUNCTION public.get_restaurant_rating(p_restaurant_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    ROUND(AVG(rating)::numeric, 1) as avg_rating,
    COUNT(*) as review_count
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id;
$$;