-- Phase 1: Ajouter les colonnes de métriques de popularité
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS popularity_score NUMERIC GENERATED ALWAYS AS 
  ((view_count * 0.3) + (sales_count * 10) + (rating_average * 5)) STORED;

-- Créer un index pour les performances de tri par popularité
CREATE INDEX IF NOT EXISTS idx_marketplace_products_popularity 
ON marketplace_products(popularity_score DESC NULLS LAST);

-- Phase 2: Table pour logger les vues de produits
CREATE TABLE IF NOT EXISTS product_views_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id 
ON product_views_log(product_id);

CREATE INDEX IF NOT EXISTS idx_product_views_user_id 
ON product_views_log(user_id);

-- RLS pour product_views_log
ALTER TABLE product_views_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log product views"
ON product_views_log FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own product views"
ON product_views_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Fonction trigger pour incrémenter automatiquement les vues
CREATE OR REPLACE FUNCTION increment_product_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_products
  SET view_count = view_count + 1
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour auto-incrémenter les vues
DROP TRIGGER IF EXISTS trigger_increment_product_views ON product_views_log;
CREATE TRIGGER trigger_increment_product_views
AFTER INSERT ON product_views_log
FOR EACH ROW
EXECUTE FUNCTION increment_product_views();

-- Fonction pour mettre à jour les ventes (appelée depuis marketplace_orders)
CREATE OR REPLACE FUNCTION update_product_sales_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter sales_count quand une commande est complétée
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE marketplace_products
    SET sales_count = sales_count + 1
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;