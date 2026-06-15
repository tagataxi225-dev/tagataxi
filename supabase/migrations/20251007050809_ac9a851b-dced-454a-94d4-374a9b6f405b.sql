-- Enrichir la table marketplace_products avec les colonnes manquantes
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Créer la table product_ratings pour le système de notation
CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS sur product_ratings
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre aux utilisateurs de voir tous les avis
CREATE POLICY "Users can view all product ratings"
ON product_ratings FOR SELECT
TO authenticated
USING (true);

-- Policy pour permettre aux utilisateurs de créer leur propre avis
CREATE POLICY "Users can create their own product ratings"
ON product_ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy pour permettre aux utilisateurs de modifier leur propre avis
CREATE POLICY "Users can update their own product ratings"
ON product_ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy pour permettre aux utilisateurs de supprimer leur propre avis
CREATE POLICY "Users can delete their own product ratings"
ON product_ratings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement rating_average et rating_count
CREATE OR REPLACE FUNCTION update_product_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  -- Calculer la nouvelle moyenne et le nombre d'avis
  SELECT 
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)::integer
  INTO v_avg, v_count
  FROM product_ratings
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
  
  -- Mettre à jour la table marketplace_products
  UPDATE marketplace_products
  SET 
    rating_average = COALESCE(v_avg, 0.00),
    rating_count = COALESCE(v_count, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger pour mettre à jour les stats après INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trigger_update_product_rating_stats ON product_ratings;
CREATE TRIGGER trigger_update_product_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON product_ratings
FOR EACH ROW
EXECUTE FUNCTION update_product_rating_stats();