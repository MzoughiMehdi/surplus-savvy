
-- Add columns for tomorrow pre-bookings and deferred payment
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS pickup_date date,
ADD COLUMN IF NOT EXISTS config_id uuid REFERENCES public.surprise_bag_config(id),
ADD COLUMN IF NOT EXISTS payment_intent_id text;

-- Make offer_id nullable for pre-bookings (no offer exists yet)
ALTER TABLE public.reservations ALTER COLUMN offer_id DROP NOT NULL;
