
-- 1. Table surprise_bag_config
CREATE TABLE public.surprise_bag_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  base_price numeric NOT NULL CHECK (base_price >= 10),
  daily_quantity integer NOT NULL DEFAULT 5,
  pickup_start time NOT NULL DEFAULT '18:00',
  pickup_end time NOT NULL DEFAULT '20:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surprise_bag_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own config"
ON public.surprise_bag_config FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.restaurants WHERE restaurants.id = surprise_bag_config.restaurant_id AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all configs"
ON public.surprise_bag_config FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_surprise_bag_config_updated_at
BEFORE UPDATE ON public.surprise_bag_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Table daily_overrides
CREATE TABLE public.daily_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  quantity integer,
  pickup_start time,
  pickup_end time,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, date)
);

ALTER TABLE public.daily_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own overrides"
ON public.daily_overrides FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.restaurants WHERE restaurants.id = daily_overrides.restaurant_id AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all overrides"
ON public.daily_overrides FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add date column to offers
ALTER TABLE public.offers ADD COLUMN date date;
