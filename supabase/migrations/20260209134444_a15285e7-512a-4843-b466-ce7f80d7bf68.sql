
-- Add maintenance columns to platform_settings
ALTER TABLE public.platform_settings
  ADD COLUMN maintenance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN maintenance_message text;

-- Allow anonymous (non-authenticated) users to read platform_settings for maintenance check
CREATE POLICY "Anyone can read platform_settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);
