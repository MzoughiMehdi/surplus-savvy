-- Create an RPC for all restaurant ratings (aggregate only, no user_id)
CREATE OR REPLACE FUNCTION public.get_all_restaurant_ratings()
RETURNS TABLE(restaurant_name text, avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    r.name as restaurant_name,
    ROUND(AVG(rev.rating)::numeric, 1) as avg_rating,
    COUNT(*) as review_count
  FROM public.reviews rev
  JOIN public.restaurants r ON r.id = rev.restaurant_id
  GROUP BY r.name;
$$;