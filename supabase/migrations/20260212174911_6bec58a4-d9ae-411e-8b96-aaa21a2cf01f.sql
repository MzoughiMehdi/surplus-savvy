
ALTER TABLE public.support_messages
  ADD COLUMN admin_unread boolean NOT NULL DEFAULT true,
  ADD COLUMN merchant_unread boolean NOT NULL DEFAULT false;
