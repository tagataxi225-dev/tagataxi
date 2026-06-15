-- Désactiver TOUTES les règles de transport existantes
UPDATE public.pricing_rules 
SET is_active = false 
WHERE service_type = 'transport' 
  AND is_active = true;

-- Créer les règles de tarification pour TOUTES les villes
INSERT INTO public.pricing_rules (
  service_type, vehicle_class, base_price, price_per_km, 
  minimum_fare, currency, city, is_active
) VALUES
  -- KINSHASA (CDF - Base)
  ('transport', 'moto', 1000, 200, 500, 'CDF', 'Kinshasa', true),
  ('transport', 'eco', 1500, 250, 1000, 'CDF', 'Kinshasa', true),
  ('transport', 'standard', 2500, 400, 1500, 'CDF', 'Kinshasa', true),
  ('transport', 'premium', 3500, 600, 2000, 'CDF', 'Kinshasa', true),
  
  -- LUBUMBASHI (CDF - +20%)
  ('transport', 'moto', 1200, 240, 600, 'CDF', 'Lubumbashi', true),
  ('transport', 'eco', 1800, 300, 1200, 'CDF', 'Lubumbashi', true),
  ('transport', 'standard', 3000, 480, 1800, 'CDF', 'Lubumbashi', true),
  ('transport', 'premium', 4200, 720, 2400, 'CDF', 'Lubumbashi', true),
  
  -- KOLWEZI (CDF - +10%)
  ('transport', 'moto', 1100, 220, 550, 'CDF', 'Kolwezi', true),
  ('transport', 'eco', 1650, 275, 1100, 'CDF', 'Kolwezi', true),
  ('transport', 'standard', 2750, 440, 1650, 'CDF', 'Kolwezi', true),
  ('transport', 'premium', 3850, 660, 2200, 'CDF', 'Kolwezi', true),
  
  -- ABIDJAN (XOF - conversion ~0.33)
  ('transport', 'moto', 330, 66, 165, 'XOF', 'Abidjan', true),
  ('transport', 'eco', 500, 83, 330, 'XOF', 'Abidjan', true),
  ('transport', 'standard', 825, 132, 500, 'XOF', 'Abidjan', true),
  ('transport', 'premium', 1155, 198, 660, 'XOF', 'Abidjan', true)
ON CONFLICT DO NOTHING;