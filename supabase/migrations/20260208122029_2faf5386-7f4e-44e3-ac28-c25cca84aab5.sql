
-- 1. platform_settings table
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_rate integer NOT NULL DEFAULT 50 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read platform_settings"
  ON public.platform_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update platform_settings"
  ON public.platform_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert platform_settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.platform_settings (commission_rate) VALUES (50);

-- 2. restaurant_payouts table
CREATE TABLE public.restaurant_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid REFERENCES public.reservations(id),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id),
  total_amount numeric NOT NULL,
  commission_rate integer NOT NULL,
  platform_amount numeric NOT NULL,
  restaurant_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_transfer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all payouts"
  ON public.restaurant_payouts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can read own payouts"
  ON public.restaurant_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = restaurant_payouts.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert payouts"
  ON public.restaurant_payouts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update payouts"
  ON public.restaurant_payouts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add stripe_account_id to restaurants
ALTER TABLE public.restaurants ADD COLUMN stripe_account_id text;
