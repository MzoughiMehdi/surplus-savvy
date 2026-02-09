ALTER TABLE public.reports
  ADD CONSTRAINT reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.reports
  ADD CONSTRAINT reports_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reservation_id_fkey
  FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);