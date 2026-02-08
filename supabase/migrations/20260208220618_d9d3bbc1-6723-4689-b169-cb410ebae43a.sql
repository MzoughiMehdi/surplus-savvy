
-- Add postal_code and city columns to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS city text;
