-- Storage bucket pour assets vendeur (logos, bannières) et trigger follower_count

-- 1. Créer le bucket vendor-assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-assets',
  'vendor-assets',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Les vendeurs peuvent uploader leurs propres assets
CREATE POLICY "Vendors can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Policy: Les vendeurs peuvent mettre à jour leurs assets
CREATE POLICY "Vendors can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Policy: Les vendeurs peuvent supprimer leurs assets
CREATE POLICY "Vendors can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Policy: Tout le monde peut voir les assets publics
CREATE POLICY "Public vendor assets are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-assets');

-- 6. Fonction pour mettre à jour follower_count en temps réel
CREATE OR REPLACE FUNCTION update_vendor_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Déterminer le vendor_id concerné
  v_vendor_id := COALESCE(NEW.vendor_id, OLD.vendor_id);
  
  -- Compter les abonnés actifs
  SELECT COUNT(DISTINCT subscriber_id)::INTEGER INTO v_new_count
  FROM vendor_subscriptions
  WHERE vendor_id = v_vendor_id
    AND is_active = true;
  
  -- Mettre à jour vendor_profiles
  UPDATE vendor_profiles
  SET follower_count = v_new_count,
      updated_at = NOW()
  WHERE user_id = v_vendor_id;
  
  RETURN NEW;
END;
$$;

-- 7. Trigger pour mettre à jour follower_count automatiquement
DROP TRIGGER IF EXISTS trigger_update_follower_count ON vendor_subscriptions;
CREATE TRIGGER trigger_update_follower_count
AFTER INSERT OR UPDATE OF is_active OR DELETE ON vendor_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_vendor_follower_count();