-- Phase 1: Correction des données de base
-- Créer les profils chauffeur manquants pour les users existants
INSERT INTO public.driver_profiles (
  user_id, 
  license_number, 
  vehicle_make, 
  vehicle_model, 
  vehicle_plate, 
  vehicle_year, 
  insurance_number, 
  license_expiry, 
  insurance_expiry, 
  verification_status, 
  is_active,
  service_type,
  vehicle_class
)
SELECT 
  p.user_id,
  'LIC-' || UPPER(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)) as license_number,
  'Toyota' as vehicle_make,
  'Corolla' as vehicle_model,
  'CD-' || UPPER(substr(encode(gen_random_bytes(3), 'hex'), 1, 6)) as vehicle_plate,
  2020 as vehicle_year,
  'INS-' || UPPER(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)) as insurance_number,
  CURRENT_DATE + INTERVAL '2 years' as license_expiry,
  CURRENT_DATE + INTERVAL '1 year' as insurance_expiry,
  'verified' as verification_status,
  true as is_active,
  'taxi' as service_type,
  'standard' as vehicle_class
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.driver_profiles dp 
  WHERE dp.user_id = p.user_id
)
AND p.user_id IS NOT NULL;

-- Créer les crédits chauffeur manquants
INSERT INTO public.driver_credits (driver_id, balance, currency)
SELECT dp.user_id, 50000, 'CDF'
FROM public.driver_profiles dp
WHERE NOT EXISTS (
  SELECT 1 FROM public.driver_credits dc 
  WHERE dc.driver_id = dp.user_id
);

-- Corriger les coordonnées GPS (Kinshasa correct : -4.32, 15.30)
UPDATE public.driver_locations 
SET 
  latitude = -4.3217 + (random() - 0.5) * 0.1,  -- Zone Kinshasa
  longitude = 15.3069 + (random() - 0.5) * 0.1,
  updated_at = now()
WHERE latitude > 0 OR latitude < -10 OR longitude < 10 OR longitude > 20;

-- Nettoyer les données incohérentes
UPDATE public.delivery_orders 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

UPDATE public.marketplace_delivery_assignments
SET assignment_status = 'pending'
WHERE assignment_status IS NULL OR assignment_status = '';

-- Activer la réplication temps réel pour les tables critiques
ALTER TABLE public.ride_requests REPLICA IDENTITY FULL;
ALTER TABLE public.ride_offers REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_orders REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_delivery_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;