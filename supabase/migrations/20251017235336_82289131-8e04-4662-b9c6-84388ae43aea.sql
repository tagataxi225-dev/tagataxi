-- Vue matérialisée pour cache des statistiques vendeur (correction)

-- 1. Créer la vue matérialisée sans is_active
CREATE MATERIALIZED VIEW vendor_stats_cache AS
SELECT 
  vp.id AS vendor_profile_id,
  vp.user_id,
  vp.shop_name,
  vp.shop_description,
  vp.shop_logo_url,
  vp.shop_banner_url,
  get_vendor_total_sales(vp.user_id) AS total_sales,
  get_vendor_average_rating(vp.user_id) AS average_rating,
  get_vendor_follower_count(vp.user_id) AS follower_count,
  get_vendor_total_reviews(vp.user_id) AS total_reviews,
  vp.created_at,
  vp.updated_at
FROM vendor_profiles vp;

-- 2. Créer des indexes pour recherche rapide
CREATE UNIQUE INDEX idx_vendor_stats_cache_user_id ON vendor_stats_cache(user_id);
CREATE INDEX idx_vendor_stats_cache_profile_id ON vendor_stats_cache(vendor_profile_id);

-- 3. Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_vendor_stats_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_stats_cache;
  RETURN NEW;
END;
$$;

-- 4. Triggers pour rafraîchir automatiquement sur changements

-- Trigger sur marketplace_orders (quand commande livrée)
CREATE TRIGGER trigger_refresh_stats_on_order_delivery
AFTER UPDATE OF status ON marketplace_orders
FOR EACH ROW
WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
EXECUTE FUNCTION refresh_vendor_stats_cache();

-- Trigger sur product_ratings (nouvel avis ou modification)
CREATE TRIGGER trigger_refresh_stats_on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON product_ratings
FOR EACH ROW
EXECUTE FUNCTION refresh_vendor_stats_cache();

-- Trigger sur vendor_subscriptions (changement abonnement)
CREATE TRIGGER trigger_refresh_stats_on_subscription_change
AFTER INSERT OR UPDATE OF is_active OR DELETE ON vendor_subscriptions
FOR EACH ROW
EXECUTE FUNCTION refresh_vendor_stats_cache();

-- Trigger sur vendor_profiles (mise à jour profil)
CREATE TRIGGER trigger_refresh_stats_on_profile_update
AFTER UPDATE ON vendor_profiles
FOR EACH ROW
EXECUTE FUNCTION refresh_vendor_stats_cache();

-- 5. Grant access
GRANT SELECT ON vendor_stats_cache TO authenticated;
GRANT SELECT ON vendor_stats_cache TO anon;