-- Create marketplace products without specific user_id references
-- We'll use the current authenticated user for seller_id when products are added

-- First, let's insert products with a placeholder seller_id that we'll update later
-- For now, we'll create products without seller dependencies

-- Insert commission settings if not exist
INSERT INTO public.commission_settings (service_type, driver_rate, admin_rate, platform_rate, is_active) VALUES
('transport', 85.00, 10.00, 5.00, true),
('delivery', 80.00, 15.00, 5.00, true),
('marketplace', 90.00, 5.00, 5.00, true)
ON CONFLICT (service_type) DO NOTHING;

-- Insert pricing rules for different services
INSERT INTO public.pricing_rules (service_type, city, vehicle_class, base_price, price_per_km, price_per_minute, minimum_fare, currency, is_active) VALUES
('transport', 'kinshasa', 'standard', 1000, 200, 30, 1000, 'CDF', true),
('transport', 'kinshasa', 'premium', 1500, 300, 45, 1500, 'CDF', true),
('delivery', 'kinshasa', 'moto', 500, 150, 25, 500, 'CDF', true),
('delivery', 'kinshasa', 'car', 1000, 250, 35, 1000, 'CDF', true)
ON CONFLICT (service_type, city, vehicle_class) DO NOTHING;

-- Create some sample challenges for drivers
INSERT INTO public.challenges (title, description, challenge_type, target_metric, target_value, reward_type, reward_value, reward_currency, start_date, end_date, is_active) VALUES
('Première course de la semaine', 'Complétez votre première course cette semaine pour gagner un bonus', 'weekly', 'rides_completed', 1, 'cash', 2000, 'CDF', now(), now() + interval '7 days', true),
('Champion du mois', 'Complétez 50 courses ce mois-ci', 'monthly', 'rides_completed', 50, 'cash', 25000, 'CDF', now(), now() + interval '30 days', true),
('Service client parfait', 'Maintenez une note de 4.8+ sur 20 courses', 'weekly', 'rating_average', 48, 'cash', 5000, 'CDF', now(), now() + interval '7 days', true)
ON CONFLICT DO NOTHING;