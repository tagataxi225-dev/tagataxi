-- Phase 2: Activer automatiquement les véhicules approuvés et créer des données de test

-- Mettre à jour la trigger pour activer automatiquement les véhicules approuvés
CREATE OR REPLACE FUNCTION public.activate_approved_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le véhicule est approuvé, l'activer automatiquement
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    NEW.is_active = true;
    NEW.is_available = true;
  END IF;
  
  -- Si le véhicule est rejeté, le désactiver
  IF NEW.moderation_status = 'rejected' AND OLD.moderation_status != 'rejected' THEN
    NEW.is_active = false;
    NEW.is_available = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS activate_approved_vehicles_trigger ON public.rental_vehicles;
CREATE TRIGGER activate_approved_vehicles_trigger
  BEFORE UPDATE ON public.rental_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_approved_vehicles();

-- Créer des partenaires de test s'ils n'existent pas
INSERT INTO public.partenaires (
  user_id, 
  display_name, 
  phone_number, 
  email, 
  address, 
  business_type, 
  company_name, 
  commission_rate, 
  verification_status, 
  is_active
) VALUES 
  (
    gen_random_uuid(), 
    'Transport Kwenda Premium', 
    '+243900123456', 
    'premium@kwendatransport.cd', 
    'Avenue Kasavubu, Kinshasa', 
    'transport', 
    'Kwenda Premium Transport SARL', 
    15.00, 
    'approved', 
    true
  ),
  (
    gen_random_uuid(), 
    'Location Kinshasa Elite', 
    '+243900654321', 
    'elite@locationkinshasa.cd', 
    'Boulevard du 30 Juin, Kinshasa', 
    'rental', 
    'Kinshasa Elite Location SPRL', 
    12.00, 
    'approved', 
    true
  )
ON CONFLICT (user_id) DO NOTHING;

-- Créer des véhicules de test pour les partenaires
DO $$
DECLARE
  partner1_id UUID;
  partner2_id UUID;
BEGIN
  -- Récupérer les IDs des partenaires de test
  SELECT user_id INTO partner1_id FROM public.partenaires WHERE email = 'premium@kwendatransport.cd';
  SELECT user_id INTO partner2_id FROM public.partenaires WHERE email = 'elite@locationkinshasa.cd';

  -- Créer des véhicules de test si les partenaires existent
  IF partner1_id IS NOT NULL THEN
    INSERT INTO public.rental_vehicles (
      partner_user_id,
      category_id,
      name,
      brand,
      model,
      year,
      vehicle_type,
      fuel_type,
      transmission,
      seats,
      daily_rate,
      hourly_rate,
      weekly_rate,
      security_deposit,
      features,
      images,
      license_plate,
      location_address,
      city,
      available_cities,
      comfort_level,
      equipment,
      is_active,
      is_available,
      moderation_status
    ) VALUES 
      (
        partner1_id,
        (SELECT id FROM public.rental_vehicle_categories WHERE name ILIKE '%sedan%' LIMIT 1),
        'Toyota Corolla Premium',
        'Toyota',
        'Corolla',
        2022,
        'sedan',
        'essence',
        'automatique',
        5,
        25000,
        3500,
        150000,
        50000,
        ARRAY['Climatisation', 'GPS', 'Bluetooth', 'Caméra de recul'],
        ARRAY['https://example.com/toyota-corolla-1.jpg', 'https://example.com/toyota-corolla-2.jpg'],
        'CD123456',
        'Avenue Kasavubu, Gombe, Kinshasa',
        'Kinshasa',
        ARRAY['Kinshasa', 'Lubumbashi'],
        'premium',
        ARRAY['GPS', 'Climatisation', 'WiFi'],
        true,
        true,
        'approved'
      ),
      (
        partner1_id,
        (SELECT id FROM public.rental_vehicle_categories WHERE name ILIKE '%suv%' LIMIT 1),
        'Nissan X-Trail Family',
        'Nissan',
        'X-Trail',
        2021,
        'suv',
        'essence',
        'automatique',
        7,
        35000,
        5000,
        210000,
        70000,
        ARRAY['7 places', 'Climatisation', 'GPS', 'Caméra 360°'],
        ARRAY['https://example.com/nissan-xtrail-1.jpg'],
        'CD789012',
        'Boulevard du 30 Juin, Kinshasa',
        'Kinshasa',
        ARRAY['Kinshasa'],
        'family',
        ARRAY['GPS', 'Climatisation', 'Siège enfant'],
        true,
        true,
        'approved'
      )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner2_id IS NOT NULL THEN
    INSERT INTO public.rental_vehicles (
      partner_user_id,
      category_id,
      name,
      brand,
      model,
      year,
      vehicle_type,
      fuel_type,
      transmission,
      seats,
      daily_rate,
      hourly_rate,
      weekly_rate,
      security_deposit,
      features,
      images,
      license_plate,
      location_address,
      city,
      available_cities,
      comfort_level,
      equipment,
      is_active,
      is_available,
      moderation_status
    ) VALUES 
      (
        partner2_id,
        (SELECT id FROM public.rental_vehicle_categories WHERE name ILIKE '%economique%' LIMIT 1),
        'Honda Civic Eco',
        'Honda',
        'Civic',
        2020,
        'sedan',
        'essence',
        'manuelle',
        5,
        20000,
        2800,
        120000,
        40000,
        ARRAY['Climatisation', 'Radio', 'Économique'],
        ARRAY['https://example.com/honda-civic-1.jpg'],
        'CD345678',
        'Avenue de la Libération, Kinshasa',
        'Kinshasa',
        ARRAY['Kinshasa'],
        'standard',
        ARRAY['Radio', 'Climatisation'],
        true,
        true,
        'approved'
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;