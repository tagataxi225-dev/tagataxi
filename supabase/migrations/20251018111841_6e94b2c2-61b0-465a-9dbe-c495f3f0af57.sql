-- PHASE 2: Unifier tables location - Migration avec bons types JSONB

-- Migrer données de partner_rental_vehicles vers rental_vehicles
INSERT INTO public.rental_vehicles (
  partner_id, 
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
  is_active, 
  is_available, 
  moderation_status,
  rejection_reason,
  created_at,
  updated_at
)
SELECT 
  prv.partner_id,
  prv.category_id,
  prv.vehicle_name AS name,
  'Non spécifié' AS brand,
  'Standard' AS model,
  2020 AS year,
  'car' AS vehicle_type,
  'gasoline' AS fuel_type,
  'manual' AS transmission,
  5 AS seats,
  prv.daily_rate,
  ROUND(prv.daily_rate / 8, 0) AS hourly_rate,
  ROUND(prv.daily_rate * 6, 0) AS weekly_rate,
  50000 AS security_deposit,
  '[]'::jsonb AS features,
  '[]'::jsonb AS images,
  prv.license_plate,
  prv.location AS location_address,
  'Kinshasa' AS city,
  prv.is_active,
  true AS is_available,
  prv.moderation_status,
  prv.rejection_reason,
  prv.created_at,
  prv.updated_at
FROM public.partner_rental_vehicles prv
WHERE NOT EXISTS (
  SELECT 1 FROM public.rental_vehicles rv
  WHERE rv.license_plate = prv.license_plate
  AND rv.partner_id = prv.partner_id
);

-- Marquer ancienne table comme dépréciée
COMMENT ON TABLE public.partner_rental_vehicles IS 'DEPRECATED: Utilisez rental_vehicles. Table sera supprimée prochainement.';

-- Trigger de synchronisation temporaire
CREATE OR REPLACE FUNCTION sync_partner_rental_to_rental_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.rental_vehicles (
      partner_id, category_id, name, brand, model, year,
      vehicle_type, fuel_type, transmission, seats,
      daily_rate, hourly_rate, weekly_rate, security_deposit,
      features, images, license_plate, location_address, city,
      is_active, is_available, moderation_status, rejection_reason
    ) VALUES (
      NEW.partner_id, NEW.category_id, NEW.vehicle_name,
      'Non spécifié', 'Standard', 2020, 'car', 'gasoline', 'manual', 5,
      NEW.daily_rate, ROUND(NEW.daily_rate / 8, 0), ROUND(NEW.daily_rate * 6, 0),
      50000, '[]'::jsonb, '[]'::jsonb, NEW.license_plate,
      NEW.location, 'Kinshasa', NEW.is_active, true, 
      NEW.moderation_status, NEW.rejection_reason
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_partner_rental_vehicles_to_new_table ON public.partner_rental_vehicles;

CREATE TRIGGER sync_partner_rental_vehicles_to_new_table
AFTER INSERT ON public.partner_rental_vehicles
FOR EACH ROW
EXECUTE FUNCTION sync_partner_rental_to_rental_vehicles();
