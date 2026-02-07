
-- Create reservations table
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed', -- confirmed, completed, cancelled
  pickup_code text NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Consumers can view their own reservations
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Consumers can create reservations
CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Consumers can cancel their own reservations
CREATE POLICY "Users can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Restaurant owners can view reservations for their restaurants
CREATE POLICY "Owners can view restaurant reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = reservations.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

-- Restaurant owners can update reservation status (mark as completed)
CREATE POLICY "Owners can update restaurant reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = reservations.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

-- Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: decrement items_left when reservation is created
CREATE OR REPLACE FUNCTION public.handle_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offer_items_left integer;
  restaurant_owner uuid;
  offer_title text;
  consumer_name text;
BEGIN
  -- Check items left
  SELECT items_left INTO offer_items_left FROM public.offers WHERE id = NEW.offer_id;
  IF offer_items_left <= 0 THEN
    RAISE EXCEPTION 'Plus de stock disponible pour cette offre';
  END IF;

  -- Decrement items_left
  UPDATE public.offers SET items_left = items_left - 1 WHERE id = NEW.offer_id;

  -- Notify the restaurant owner
  SELECT r.owner_id, o.title INTO restaurant_owner, offer_title
  FROM public.restaurants r
  JOIN public.offers o ON o.restaurant_id = r.id
  WHERE o.id = NEW.offer_id;

  SELECT full_name INTO consumer_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    restaurant_owner,
    '🛒 Nouvelle réservation !',
    COALESCE(consumer_name, 'Un client') || ' a réservé "' || offer_title || '" — Code: ' || NEW.pickup_code,
    'reservation',
    jsonb_build_object('reservation_id', NEW.id, 'offer_id', NEW.offer_id, 'pickup_code', NEW.pickup_code)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_reservation();

-- Trigger: restore items_left when reservation is cancelled
CREATE OR REPLACE FUNCTION public.handle_reservation_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    UPDATE public.offers SET items_left = items_left + 1 WHERE id = NEW.offer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reservation_cancel
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reservation_cancel();

-- Updated_at trigger
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
