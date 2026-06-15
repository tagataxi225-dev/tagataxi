-- Insert some sample promo codes for testing
INSERT INTO public.promo_codes (
  code, title, description, discount_type, discount_value, 
  min_order_amount, applicable_services, usage_limit, user_limit,
  valid_from, valid_until, is_active
) VALUES 
(
  'WELCOME20', 
  'Bienvenue - 20% de réduction', 
  'Réduction de 20% pour les nouveaux utilisateurs', 
  'percentage', 
  20, 
  5000, 
  ARRAY['transport', 'delivery'], 
  1000, 
  1,
  NOW(),
  NOW() + INTERVAL '3 months',
  true
),
(
  'FREEDELIVERY', 
  'Livraison gratuite', 
  'Livraison gratuite pour commandes de plus de 10000 CDF', 
  'free_delivery', 
  0, 
  10000, 
  ARRAY['delivery'], 
  500, 
  1,
  NOW(),
  NOW() + INTERVAL '1 month',
  true
),
(
  'SAVE5000', 
  '5000 CDF de réduction', 
  'Réduction fixe de 5000 CDF', 
  'fixed_amount', 
  5000, 
  15000, 
  ARRAY['transport', 'delivery', 'marketplace'], 
  200, 
  1,
  NOW(),
  NOW() + INTERVAL '2 months',
  true
),
(
  'WEEKEND30', 
  'Weekend Special - 30% off', 
  'Réduction de 30% pour le weekend', 
  'percentage', 
  30, 
  3000, 
  ARRAY['transport'], 
  100, 
  2,
  NOW(),
  NOW() + INTERVAL '2 weeks',
  true
),
(
  'VIP15', 
  'Réduction VIP', 
  'Réduction de 15% pour nos clients VIP', 
  'percentage', 
  15, 
  0, 
  ARRAY['transport', 'delivery', 'marketplace'], 
  50, 
  3,
  NOW(),
  NOW() + INTERVAL '6 months',
  true
)
ON CONFLICT (code) DO NOTHING;