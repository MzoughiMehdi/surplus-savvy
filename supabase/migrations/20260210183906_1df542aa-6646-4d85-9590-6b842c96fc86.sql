
-- Permettre a tous de lire les configs actives (pour afficher les offres de demain)
CREATE POLICY "Public can view active configs"
  ON surprise_bag_config FOR SELECT
  USING (is_active = true);

-- Permettre a tous de lire les overrides (pour filtrer les suspensions)
CREATE POLICY "Public can view daily overrides"
  ON daily_overrides FOR SELECT
  USING (true);
