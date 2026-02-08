INSERT INTO public.user_roles (user_id, role)
VALUES ('23769175-c220-455a-8ceb-b901992330c9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;