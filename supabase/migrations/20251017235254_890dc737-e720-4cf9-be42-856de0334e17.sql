-- Fonctions PostgreSQL pour calcul des statistiques vendeur en temps réel

-- 1. Fonction: Calculer le total des ventes (commandes livrées)
CREATE OR REPLACE FUNCTION get_vendor_total_sales(vendor_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM marketplace_orders
    WHERE seller_id = vendor_user_id
      AND status = 'delivered'
  );
END;
$$;

-- 2. Fonction: Calculer la note moyenne du vendeur
CREATE OR REPLACE FUNCTION get_vendor_average_rating(vendor_user_id UUID)
RETURNS NUMERIC(3,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(ROUND(AVG(pr.rating), 2), 0.0)
    FROM product_ratings pr
    INNER JOIN marketplace_products mp ON pr.product_id = mp.id
    WHERE mp.seller_id = vendor_user_id
  );
END;
$$;

-- 3. Fonction: Compter les abonnés actifs
CREATE OR REPLACE FUNCTION get_vendor_follower_count(vendor_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT subscriber_id)::INTEGER
    FROM vendor_subscriptions
    WHERE vendor_id = vendor_user_id
      AND is_active = true
  );
END;
$$;

-- 4. Fonction: Compter le total d'évaluations
CREATE OR REPLACE FUNCTION get_vendor_total_reviews(vendor_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(pr.id)::INTEGER
    FROM product_ratings pr
    INNER JOIN marketplace_products mp ON pr.product_id = mp.id
    WHERE mp.seller_id = vendor_user_id
  );
END;
$$;

-- 5. Créer des indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_status 
ON marketplace_orders(seller_id, status);

CREATE INDEX IF NOT EXISTS idx_product_ratings_product_id 
ON product_ratings(product_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller 
ON marketplace_products(seller_id);

CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_active 
ON vendor_subscriptions(vendor_id, is_active);