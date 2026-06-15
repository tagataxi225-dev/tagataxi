-- Add shop_logo_url to vendor_profiles
ALTER TABLE vendor_profiles
ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;

-- Add created_at to marketplace_products if not exists (for NOUVEAUTÉ badge)
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN vendor_profiles.shop_logo_url IS 'URL du logo de la boutique (recommandé: 200x200px, format carré)';
COMMENT ON COLUMN marketplace_products.created_at IS 'Date de création du produit (pour badge NOUVEAUTÉ)';