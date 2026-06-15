-- Supprimer tous les triggers qui utilisent refresh_vendor_stats_cache
DROP TRIGGER IF EXISTS trigger_refresh_stats_on_order_delivery ON marketplace_orders;
DROP TRIGGER IF EXISTS trigger_refresh_stats_on_rating_change ON product_ratings;
DROP TRIGGER IF EXISTS trigger_refresh_stats_on_subscription_change ON vendor_subscriptions;
DROP TRIGGER IF EXISTS trigger_refresh_stats_on_profile_update ON vendor_profiles;

-- Supprimer la fonction avec CASCADE
DROP FUNCTION IF EXISTS refresh_vendor_stats_cache() CASCADE;