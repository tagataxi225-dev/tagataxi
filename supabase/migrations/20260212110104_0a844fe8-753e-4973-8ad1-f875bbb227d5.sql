
-- Create promo-banners storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('promo-banners', 'promo-banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read promo banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'promo-banners');

-- Admin insert
CREATE POLICY "Admins can upload promo banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promo-banners'
  AND EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Admin update
CREATE POLICY "Admins can update promo banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'promo-banners'
  AND EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Admin delete
CREATE POLICY "Admins can delete promo banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'promo-banners'
  AND EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);
