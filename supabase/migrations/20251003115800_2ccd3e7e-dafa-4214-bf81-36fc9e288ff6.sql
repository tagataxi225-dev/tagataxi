-- Désactiver TOUTES les règles de transport existantes pour moto, eco, standard, premium
UPDATE public.pricing_rules 
SET is_active = false 
WHERE service_type = 'transport' 
  AND vehicle_class IN ('moto', 'eco', 'standard', 'premium', 'first_class')
  AND is_active = true;

-- Créer les 4 nouvelles règles de tarification pour Kinshasa
INSERT INTO public.pricing_rules (
  service_type, vehicle_class, base_price, price_per_km, 
  minimum_fare, currency, city, is_active
) VALUES
  -- Moto-taxi
  ('transport', 'moto', 1000, 200, 500, 'CDF', 'Kinshasa', true),
  -- Éco
  ('transport', 'eco', 1500, 250, 1000, 'CDF', 'Kinshasa', true),
  -- Confort/Standard
  ('transport', 'standard', 2500, 400, 1500, 'CDF', 'Kinshasa', true),
  -- Premium
  ('transport', 'premium', 3500, 600, 2000, 'CDF', 'Kinshasa', true);