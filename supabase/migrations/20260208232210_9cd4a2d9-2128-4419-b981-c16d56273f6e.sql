
CREATE OR REPLACE FUNCTION public.get_restaurant_rating(p_restaurant_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint, avg_quality numeric, avg_quantity numeric, avg_presentation numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*),
    ROUND(AVG(rating_quality)::numeric, 1),
    ROUND(AVG(rating_quantity)::numeric, 1),
    ROUND(AVG(rating_presentation)::numeric, 1)
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id;
$$;

CREATE OR REPLACE FUNCTION public.get_all_restaurant_ratings()
RETURNS TABLE(restaurant_name text, avg_rating numeric, review_count bigint, avg_quality numeric, avg_quantity numeric, avg_presentation numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    r.name,
    ROUND(AVG(rev.rating)::numeric, 1),
    COUNT(*),
    ROUND(AVG(rev.rating_quality)::numeric, 1),
    ROUND(AVG(rev.rating_quantity)::numeric, 1),
    ROUND(AVG(rev.rating_presentation)::numeric, 1)
  FROM public.reviews rev
  JOIN public.restaurants r ON r.id = rev.restaurant_id
  GROUP BY r.name;
$$;
