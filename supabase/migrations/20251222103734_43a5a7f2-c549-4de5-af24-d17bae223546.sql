-- Ajouter les colonnes pour produits digitaux dans marketplace_products
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS digital_file_url TEXT,
ADD COLUMN IF NOT EXISTS digital_file_name TEXT,
ADD COLUMN IF NOT EXISTS digital_file_size INTEGER,
ADD COLUMN IF NOT EXISTS digital_download_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS digital_file_type TEXT;

-- Créer la table de suivi des téléchargements digitaux
CREATE TABLE IF NOT EXISTS public.marketplace_digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  download_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par token
CREATE INDEX IF NOT EXISTS idx_digital_downloads_token ON public.marketplace_digital_downloads(download_token);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_buyer ON public.marketplace_digital_downloads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_order ON public.marketplace_digital_downloads(order_id);

-- Activer RLS
ALTER TABLE public.marketplace_digital_downloads ENABLE ROW LEVEL SECURITY;

-- Politique: Les acheteurs peuvent voir leurs propres téléchargements
CREATE POLICY "Buyers can view their own downloads"
ON public.marketplace_digital_downloads
FOR SELECT
USING (auth.uid() = buyer_id);

-- Politique: Le système peut créer des téléchargements
CREATE POLICY "System can create downloads"
ON public.marketplace_digital_downloads
FOR INSERT
WITH CHECK (true);

-- Politique: Le système peut mettre à jour les téléchargements
CREATE POLICY "System can update downloads"
ON public.marketplace_digital_downloads
FOR UPDATE
USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_digital_downloads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_digital_downloads_updated_at ON public.marketplace_digital_downloads;
CREATE TRIGGER trigger_update_digital_downloads_updated_at
BEFORE UPDATE ON public.marketplace_digital_downloads
FOR EACH ROW
EXECUTE FUNCTION public.update_digital_downloads_updated_at();

-- Créer le bucket pour les fichiers digitaux
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed', 'audio/mpeg', 'audio/mp3', 'video/mp4', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Politique storage: Les vendeurs peuvent uploader dans leur dossier
CREATE POLICY "Vendors can upload digital files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique storage: Les vendeurs peuvent voir leurs fichiers
CREATE POLICY "Vendors can view their digital files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique storage: Les vendeurs peuvent supprimer leurs fichiers
CREATE POLICY "Vendors can delete their digital files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);