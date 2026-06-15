-- Supprimer triggers obsolètes
DROP FUNCTION IF EXISTS notify_admin_on_new_product() CASCADE;
DROP FUNCTION IF EXISTS notify_seller_product_status() CASCADE;

-- Produit test iouantchi
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM clients WHERE email = 'iouantchi@gmail.com';
  IF v_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM marketplace_products WHERE seller_id = v_user_id AND title = '🧪 Pizza Test') THEN
    INSERT INTO marketplace_products (seller_id, title, description, price, category, status, moderation_status, images, stock_count)
    VALUES (v_user_id, '🧪 Pizza Test', 'Test', 8500, 'food', 'active', 'pending', '["https://images.unsplash.com/photo-1574071318508-1cdbab80d002"]'::jsonb, 10);
  END IF;
END $$;

-- Plans abonnement
INSERT INTO subscription_plans (name, duration_type, rides_included, price, currency, service_type)
VALUES ('Standard Chauffeur', 'monthly', 50, 25000, 'CDF', 'transport')
ON CONFLICT DO NOTHING;

-- Abonnement hadoukone avec payment_method
DO $$
DECLARE v_driver_id UUID; v_plan_id UUID;
BEGIN
  SELECT user_id INTO v_driver_id FROM chauffeurs WHERE email = 'hadoukone0102@gmail.com';
  SELECT id INTO v_plan_id FROM subscription_plans WHERE name = 'Standard Chauffeur';
  
  IF v_driver_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
    UPDATE driver_subscriptions SET status = 'expired' WHERE driver_id = v_driver_id AND status = 'active';
    INSERT INTO driver_subscriptions (driver_id, plan_id, status, rides_remaining, start_date, end_date, payment_method)
    VALUES (v_driver_id, v_plan_id, 'active', 50, NOW(), NOW() + INTERVAL '30 days', 'admin_grant');
  END IF;
END $$;