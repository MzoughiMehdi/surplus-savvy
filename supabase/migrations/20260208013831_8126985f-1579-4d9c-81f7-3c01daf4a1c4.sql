
-- Create a public storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);

-- Allow anyone to view restaurant images
CREATE POLICY "Anyone can view restaurant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

-- Allow restaurant owners to upload their images
CREATE POLICY "Owners can upload restaurant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

-- Allow owners to update their images
CREATE POLICY "Owners can update restaurant images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

-- Allow owners to delete their images
CREATE POLICY "Owners can delete restaurant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);
