
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- 'new_offer', 'reservation', 'status_change', 'info'
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert notifications (via triggers using security definer)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify all consumers when a new offer is created
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_name text;
  consumer record;
BEGIN
  -- Get restaurant name
  SELECT name INTO restaurant_name FROM public.restaurants WHERE id = NEW.restaurant_id;

  -- Notify all consumers (users with role 'consumer' in profiles)
  FOR consumer IN
    SELECT user_id FROM public.profiles WHERE role = 'consumer'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      consumer.user_id,
      'Nouvelle offre disponible !',
      restaurant_name || ' propose "' || NEW.title || '" à ' || NEW.discounted_price || '€',
      'new_offer',
      jsonb_build_object('offer_id', NEW.id, 'restaurant_id', NEW.restaurant_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_offer_notify
  AFTER INSERT ON public.offers
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.notify_new_offer();

-- Trigger: notify merchant when restaurant status changes
CREATE OR REPLACE FUNCTION public.notify_restaurant_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.owner_id,
      CASE NEW.status
        WHEN 'approved' THEN '🎉 Restaurant approuvé !'
        WHEN 'rejected' THEN '❌ Restaurant rejeté'
        ELSE 'Statut mis à jour'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'Votre restaurant "' || NEW.name || '" est maintenant visible par les consommateurs.'
        WHEN 'rejected' THEN 'Votre restaurant "' || NEW.name || '" n''a pas été approuvé. Contactez le support pour plus d''informations.'
        ELSE 'Le statut de "' || NEW.name || '" a changé en ' || NEW.status
      END,
      'status_change',
      jsonb_build_object('restaurant_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_restaurant_status_change_notify
  AFTER UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_restaurant_status_change();
