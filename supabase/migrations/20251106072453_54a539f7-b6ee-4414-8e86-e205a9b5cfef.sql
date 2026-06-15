-- MIGRATION FINALE SIMPLIFIÉE
INSERT INTO driver_profiles (id, user_id, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, vehicle_class, vehicle_color, license_number, license_expiry, insurance_number, insurance_expiry, verification_status, is_active, service_type)
VALUES ('6bd56fde-d3e1-4df9-a79c-670397581890', '6bd56fde-d3e1-4df9-a79c-670397581890', 'Honda', 'CB 125', 2022, 'KIN-1234', 'moto', 'Rouge', 'DL2024001', (NOW() + INTERVAL '2 years')::date, 'INS2024001', (NOW() + INTERVAL '1 year')::date, 'approved', true, 'taxi')
ON CONFLICT (id) DO UPDATE SET is_active = true, verification_status = 'approved', service_type = 'taxi';

DELETE FROM driver_subscriptions WHERE driver_id = '6bd56fde-d3e1-4df9-a79c-670397581890';
INSERT INTO driver_subscriptions (driver_id, plan_id, status, start_date, end_date, rides_remaining, payment_method)
SELECT '6bd56fde-d3e1-4df9-a79c-670397581890', id, 'active', NOW(), NOW() + INTERVAL '30 days', 999, 'free'
FROM subscription_plans WHERE name = 'Essai Gratuit 1 Mois' AND service_type = 'transport' LIMIT 1;

DELETE FROM driver_locations WHERE driver_id = '6bd56fde-d3e1-4df9-a79c-670397581890';
INSERT INTO driver_locations (driver_id, latitude, longitude, is_online, is_available, vehicle_class, last_ping, is_verified)
VALUES ('6bd56fde-d3e1-4df9-a79c-670397581890', -4.3217, 15.3069, true, true, 'moto', NOW(), true);

INSERT INTO marketplace_products (seller_id, title, description, price, category, status, moderation_status, images, stock_count) VALUES
  ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'MacBook Pro M3', 'Neuf scellé 16GB RAM', 2500000, 'electronics', 'active', 'approved', '["https://placehold.co/300"]', 3),
  ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'Samsung Galaxy S24', '256GB 5G', 850000, 'electronics', 'active', 'approved', '["https://placehold.co/300"]', 8),
  ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'Sac à dos Laptop', 'USB charging', 35000, 'fashion', 'active', 'approved', '["https://placehold.co/300"]', 25),
  ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'Cafetière Nespresso', 'Machine expresso', 180000, 'home', 'active', 'approved', '["https://placehold.co/300"]', 5),
  ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'Kit Fitness Complet', 'Tapis yoga + haltères', 95000, 'sports', 'active', 'approved', '["https://placehold.co/300"]', 15),
  ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'Parfum Dior Sauvage', '100ml Homme', 125000, 'beauty', 'active', 'approved', '["https://placehold.co/300"]', 12);

UPDATE subscription_plans SET is_active = true WHERE service_type = 'transport' AND is_active = false;