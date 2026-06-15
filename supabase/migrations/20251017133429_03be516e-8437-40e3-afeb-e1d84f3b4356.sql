-- ==========================================
-- 🍴 MIGRATION: Intégration du service Food - Version finale
-- ==========================================

-- Supprimer l'ancienne contrainte CHECK sur service_category (service_configurations)
ALTER TABLE public.service_configurations 
DROP CONSTRAINT IF EXISTS service_configurations_service_category_check;

-- Ajouter la nouvelle contrainte CHECK avec 'food'
ALTER TABLE public.service_configurations 
ADD CONSTRAINT service_configurations_service_category_check 
CHECK (service_category IN ('taxi', 'delivery', 'rental', 'marketplace', 'lottery', 'food'));

-- Supprimer l'ancienne contrainte CHECK sur service_category (service_pricing)
ALTER TABLE public.service_pricing 
DROP CONSTRAINT IF EXISTS service_pricing_service_category_check;

-- Ajouter la nouvelle contrainte CHECK avec 'food'
ALTER TABLE public.service_pricing 
ADD CONSTRAINT service_pricing_service_category_check 
CHECK (service_category IN ('taxi', 'delivery', 'rental', 'marketplace', 'lottery', 'food'));

-- Vérifier si le service Food existe déjà, sinon l'insérer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.service_configurations 
    WHERE service_type = 'food_delivery' AND service_category = 'food'
  ) THEN
    INSERT INTO public.service_configurations (
      service_type,
      service_category,
      display_name,
      description,
      requirements,
      features,
      vehicle_requirements,
      is_active
    ) VALUES (
      'food_delivery',
      'food',
      'Kwenda Food',
      'Commandez vos plats préférés depuis les meilleurs restaurants',
      '["Wallet KwendaPay actif", "Adresse de livraison valide"]'::jsonb,
      '["Large sélection de restaurants", "Livraison rapide en moins de 60 minutes", "Suivi en temps réel du livreur", "Paiement sécurisé via KwendaPay", "Programme de fidélité et réductions"]'::jsonb,
      '{
        "delivery_time_max": 60,
        "min_order_amount": 5000,
        "delivery_radius_km": 15,
        "supports_scheduled_delivery": true,
        "supports_contactless_delivery": true
      }'::jsonb,
      true
    );
  END IF;
END $$;

-- Insérer les tarifications pour les 3 villes
DO $$
BEGIN
  -- Kinshasa
  IF NOT EXISTS (
    SELECT 1 FROM public.service_pricing 
    WHERE service_type = 'food_delivery' AND service_category = 'food' AND city = 'Kinshasa'
  ) THEN
    INSERT INTO public.service_pricing (
      service_type, service_category, city,
      base_price, price_per_km, price_per_minute,
      minimum_fare, maximum_fare, surge_multiplier,
      commission_rate, currency, is_active
    ) VALUES (
      'food_delivery', 'food', 'Kinshasa',
      2000.00, 500.00, 0.00,
      2000.00, 15000.00, 1.0,
      15.00, 'CDF', true
    );
  END IF;

  -- Lubumbashi
  IF NOT EXISTS (
    SELECT 1 FROM public.service_pricing 
    WHERE service_type = 'food_delivery' AND service_category = 'food' AND city = 'Lubumbashi'
  ) THEN
    INSERT INTO public.service_pricing (
      service_type, service_category, city,
      base_price, price_per_km, price_per_minute,
      minimum_fare, maximum_fare, surge_multiplier,
      commission_rate, currency, is_active
    ) VALUES (
      'food_delivery', 'food', 'Lubumbashi',
      2500.00, 600.00, 0.00,
      2500.00, 18000.00, 1.0,
      15.00, 'CDF', true
    );
  END IF;

  -- Kolwezi
  IF NOT EXISTS (
    SELECT 1 FROM public.service_pricing 
    WHERE service_type = 'food_delivery' AND service_category = 'food' AND city = 'Kolwezi'
  ) THEN
    INSERT INTO public.service_pricing (
      service_type, service_category, city,
      base_price, price_per_km, price_per_minute,
      minimum_fare, maximum_fare, surge_multiplier,
      commission_rate, currency, is_active
    ) VALUES (
      'food_delivery', 'food', 'Kolwezi',
      2200.00, 550.00, 0.00,
      2200.00, 16000.00, 1.0,
      15.00, 'CDF', true
    );
  END IF;
END $$;