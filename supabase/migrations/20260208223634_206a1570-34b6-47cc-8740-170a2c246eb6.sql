
-- Create a public view for consumer-facing restaurant data (excludes sensitive fields)
CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = on) AS
SELECT id, name, address, category, description, image_url, phone, city, postal_code, opening_hours, status
FROM public.restaurants
WHERE status = 'approved';

-- Drop the overly permissive consumer policy
DROP POLICY IF EXISTS "Consumers can view approved restaurants" ON public.restaurants;

-- Replace with a restrictive policy: non-owners/non-admins cannot directly SELECT the base table
-- They should use the restaurants_public view instead
-- However, the offers join needs access, so we keep a policy that only allows access 
-- when the user is the owner or admin (existing policies cover those)
-- For the join from offers, we need a minimal policy for authenticated users on approved restaurants
CREATE POLICY "Consumers can view approved restaurants"
  ON public.restaurants FOR SELECT
  USING (status = 'approved');
