-- Fonction globale de refresh des statistiques vendeur
CREATE OR REPLACE FUNCTION refresh_vendor_stats_cache(p_vendor_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO vendor_stats_cache (
    vendor_id,
    total_products,
    total_sales,
    avg_rating,
    total_reviews,
    follower_count,
    last_product_date,
    last_sale_date,
    last_updated
  )
  SELECT 
    p_vendor_id,
    (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = p_vendor_id AND moderation_status = 'approved'),
    (SELECT COUNT(*) FROM marketplace_orders WHERE seller_id = p_vendor_id AND status = 'delivered'),
    COALESCE((SELECT AVG(rating)::numeric(3,2) FROM user_ratings WHERE rated_user_id = p_vendor_id AND marketplace_order_id IS NOT NULL), 0),
    (SELECT COUNT(*) FROM user_ratings WHERE rated_user_id = p_vendor_id AND marketplace_order_id IS NOT NULL),
    (SELECT COUNT(*) FROM vendor_subscriptions WHERE vendor_id = p_vendor_id AND is_active = true),
    (SELECT MAX(created_at) FROM marketplace_products WHERE seller_id = p_vendor_id),
    (SELECT MAX(updated_at) FROM marketplace_orders WHERE seller_id = p_vendor_id AND status = 'delivered'),
    NOW()
  ON CONFLICT (vendor_id) DO UPDATE SET
    total_products = EXCLUDED.total_products,
    total_sales = EXCLUDED.total_sales,
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    follower_count = EXCLUDED.follower_count,
    last_product_date = EXCLUDED.last_product_date,
    last_sale_date = EXCLUDED.last_sale_date,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;