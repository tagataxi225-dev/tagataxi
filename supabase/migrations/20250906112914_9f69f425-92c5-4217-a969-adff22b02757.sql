-- Migration pour le système de services différenciés chauffeur/livreur

-- Créer un type enum pour les services de taxi
CREATE TYPE taxi_service_type AS ENUM ('moto', 'eco', 'confort', 'premium');

-- Créer un type enum pour les services de livraison  
CREATE TYPE delivery_service_type AS ENUM ('flash', 'flex', 'maxicharge');

-- Créer une table pour les demandes de changement de service
CREATE TABLE public.service_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  current_service_type TEXT NOT NULL,
  requested_service_type TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN ('taxi', 'delivery')),
  reason TEXT,
  justification_documents JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewer_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour la configuration des services
CREATE TABLE public.service_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN ('taxi', 'delivery')),
  display_name TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  vehicle_requirements JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_type, service_category)
);

-- Créer une table pour la tarification par service
CREATE TABLE public.service_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN ('taxi', 'delivery')),
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  base_price NUMERIC NOT NULL DEFAULT 0,
  price_per_km NUMERIC NOT NULL DEFAULT 0,
  price_per_minute NUMERIC DEFAULT 0,
  minimum_fare NUMERIC NOT NULL DEFAULT 0,
  maximum_fare NUMERIC,
  surge_multiplier NUMERIC DEFAULT 1.0,
  commission_rate NUMERIC NOT NULL DEFAULT 15.0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les configurations de services de taxi
INSERT INTO public.service_configurations (service_type, service_category, display_name, description, requirements, features, vehicle_requirements) VALUES
('moto', 'taxi', 'Moto Taxi', 'Transport rapide sur moto pour 1 personne', 
 '["Permis moto valide", "Assurance moto", "Casque passager"]'::jsonb,
 '["Transport rapide", "Évite les embouteillages", "1 passager maximum", "Pas de bagages lourds"]'::jsonb,
 '{"type": "moto", "age_max": 10, "cylinder_min": 125}'::jsonb),

('eco', 'taxi', 'Éco', 'Service économique avec véhicule standard',
 '["Permis de conduire valide", "Assurance véhicule", "Contrôle technique"]'::jsonb,
 '["Prix abordable", "2-4 passagers", "Bagages légers", "Service de base"]'::jsonb,
 '{"type": "voiture", "age_max": 15, "seats_min": 4}'::jsonb),

('confort', 'taxi', 'Confort', 'Service confortable avec véhicule récent',
 '["Permis de conduire valide", "Assurance véhicule", "Contrôle technique", "Véhicule récent"]'::jsonb,
 '["Véhicule climatisé", "4 passagers", "Confort amélioré", "Chauffeur formé"]'::jsonb,
 '{"type": "voiture", "age_max": 8, "seats_min": 4, "ac_required": true}'::jsonb),

('premium', 'taxi', 'Premium', 'Service haut de gamme avec véhicule de luxe',
 '["Permis de conduire valide", "Assurance véhicule", "Contrôle technique", "Formation service client", "Tenue professionnelle"]'::jsonb,
 '["Véhicule haut de gamme", "Chauffeur en uniforme", "Services additionnels", "Wi-Fi", "Eau offerte"]'::jsonb,
 '{"type": "voiture", "age_max": 5, "seats_min": 4, "luxury_brand": true, "ac_required": true}'::jsonb);

-- Insérer les configurations de services de livraison
INSERT INTO public.service_configurations (service_type, service_category, display_name, description, requirements, features, vehicle_requirements) VALUES
('flash', 'delivery', 'Flash', 'Livraison express en moins de 2 heures',
 '["Permis de conduire valide", "Assurance véhicule", "Formation livraison express"]'::jsonb,
 '["Livraison < 2h", "Petits colis", "Priorité maximale", "Suivi temps réel"]'::jsonb,
 '{"type": "moto_or_car", "cargo_capacity": "small", "speed_priority": true}'::jsonb),

('flex', 'delivery', 'Flex', 'Livraison standard dans la journée',
 '["Permis de conduire valide", "Assurance véhicule", "Formation livraison"]'::jsonb,
 '["Livraison journée", "Colis moyens", "Flexibilité horaire", "Optimisation trajets"]'::jsonb,
 '{"type": "car_or_van", "cargo_capacity": "medium"}'::jsonb),

('maxicharge', 'delivery', 'MaxiCharge', 'Livraison gros volumes avec équipement spécial',
 '["Permis de conduire valide", "Permis poids lourd si requis", "Assurance véhicule", "Formation manutention"]'::jsonb,
 '["Gros volumes", "Équipement spécial", "Livraison planifiée", "Aide au déchargement"]'::jsonb,
 '{"type": "van_or_truck", "cargo_capacity": "large", "loading_equipment": true}'::jsonb);

-- Insérer la tarification par défaut pour les services taxi (Kinshasa)
INSERT INTO public.service_pricing (service_type, service_category, city, base_price, price_per_km, price_per_minute, minimum_fare, commission_rate) VALUES
('moto', 'taxi', 'Kinshasa', 1500, 200, 30, 1000, 12.0),
('eco', 'taxi', 'Kinshasa', 2000, 300, 50, 1500, 15.0),
('confort', 'taxi', 'Kinshasa', 3000, 400, 60, 2000, 15.0),
('premium', 'taxi', 'Kinshasa', 5000, 600, 80, 3000, 18.0);

-- Insérer la tarification par défaut pour les services livraison (Kinshasa)
INSERT INTO public.service_pricing (service_type, service_category, city, base_price, price_per_km, minimum_fare, commission_rate) VALUES
('flash', 'delivery', 'Kinshasa', 5000, 500, 3000, 20.0),
('flex', 'delivery', 'Kinshasa', 3000, 300, 2000, 15.0),
('maxicharge', 'delivery', 'Kinshasa', 8000, 800, 5000, 25.0);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.service_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour service_change_requests
CREATE POLICY "Chauffeurs accèdent à leurs demandes de changement"
ON public.service_change_requests
FOR ALL
USING (auth.uid() = driver_id);

CREATE POLICY "Admins gèrent toutes les demandes de changement"
ON public.service_change_requests
FOR ALL
USING (is_current_user_admin());

-- Politiques RLS pour service_configurations (lecture publique pour les services actifs)
CREATE POLICY "Configurations de services publiques en lecture"
ON public.service_configurations
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins gèrent les configurations de services"
ON public.service_configurations
FOR ALL
USING (is_current_user_admin());

-- Politiques RLS pour service_pricing (lecture publique pour les tarifs actifs)
CREATE POLICY "Tarification publique en lecture"
ON public.service_pricing
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins gèrent la tarification"
ON public.service_pricing
FOR ALL
USING (is_current_user_admin());

-- Triggers pour updated_at
CREATE TRIGGER update_service_change_requests_updated_at
  BEFORE UPDATE ON public.service_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_configurations_updated_at
  BEFORE UPDATE ON public.service_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer le prix selon le service
CREATE OR REPLACE FUNCTION public.calculate_service_price(
  p_service_type TEXT,
  p_service_category TEXT,
  p_distance_km NUMERIC,
  p_duration_minutes NUMERIC DEFAULT 0,
  p_city TEXT DEFAULT 'Kinshasa'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pricing_config RECORD;
  calculated_price NUMERIC;
  breakdown JSONB;
BEGIN
  -- Récupérer la configuration de tarification
  SELECT * INTO pricing_config
  FROM public.service_pricing
  WHERE service_type = p_service_type
    AND service_category = p_service_category
    AND city = p_city
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
  ORDER BY valid_from DESC
  LIMIT 1;
  
  IF pricing_config IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Configuration de tarification non trouvée',
      'service_type', p_service_type,
      'service_category', p_service_category,
      'city', p_city
    );
  END IF;
  
  -- Calculer le prix
  calculated_price := pricing_config.base_price + 
                     (p_distance_km * pricing_config.price_per_km) +
                     (p_duration_minutes * COALESCE(pricing_config.price_per_minute, 0));
  
  -- Appliquer le prix minimum
  IF calculated_price < pricing_config.minimum_fare THEN
    calculated_price := pricing_config.minimum_fare;
  END IF;
  
  -- Appliquer le prix maximum si défini
  IF pricing_config.maximum_fare IS NOT NULL AND calculated_price > pricing_config.maximum_fare THEN
    calculated_price := pricing_config.maximum_fare;
  END IF;
  
  -- Appliquer le multiplicateur de surcharge
  calculated_price := calculated_price * COALESCE(pricing_config.surge_multiplier, 1.0);
  
  -- Créer le détail de la facture
  breakdown := jsonb_build_object(
    'base_price', pricing_config.base_price,
    'distance_cost', p_distance_km * pricing_config.price_per_km,
    'time_cost', p_duration_minutes * COALESCE(pricing_config.price_per_minute, 0),
    'surge_multiplier', COALESCE(pricing_config.surge_multiplier, 1.0),
    'minimum_fare_applied', calculated_price = pricing_config.minimum_fare,
    'maximum_fare_applied', pricing_config.maximum_fare IS NOT NULL AND calculated_price = pricing_config.maximum_fare,
    'commission_rate', pricing_config.commission_rate,
    'driver_earnings', calculated_price * (100 - pricing_config.commission_rate) / 100
  );
  
  RETURN jsonb_build_object(
    'calculated_price', calculated_price,
    'currency', pricing_config.currency,
    'service_type', p_service_type,
    'service_category', p_service_category,
    'breakdown', breakdown
  );
END;
$$;