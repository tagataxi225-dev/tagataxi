-- Phase 1: Corrections critiques de sécurité et structure

-- 1. Unification des tables de chauffeurs
-- Fusionner driver_profiles dans chauffeurs (chauffeurs est la table principale)

-- Ajouter les colonnes manquantes à chauffeurs depuis driver_profiles
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS vehicle_class text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS vehicle_photo_url text,
ADD COLUMN IF NOT EXISTS verification_level text DEFAULT 'basic';

-- Migrer les données de driver_profiles vers chauffeurs
INSERT INTO public.chauffeurs (
  user_id, license_number, license_expiry, vehicle_type, vehicle_make, 
  vehicle_model, vehicle_year, vehicle_plate, vehicle_color, 
  insurance_number, insurance_expiry, delivery_capacity,
  is_active, verification_status, rating_average, total_rides,
  vehicle_class, rating_count, documents, profile_photo_url, 
  vehicle_photo_url, verification_level, created_at, updated_at
)
SELECT 
  dp.user_id, dp.license_number, dp.license_expiry, 
  COALESCE(dp.vehicle_make, 'Non spécifié'), dp.vehicle_make,
  dp.vehicle_model, dp.vehicle_year, dp.vehicle_plate, dp.vehicle_color,
  dp.insurance_number, dp.insurance_expiry, dp.delivery_capacity,
  dp.is_active, dp.verification_status, dp.rating_average, dp.total_rides,
  dp.vehicle_class, dp.rating_count, dp.documents, dp.profile_photo_url,
  dp.vehicle_photo_url, dp.verification_level, dp.created_at, dp.updated_at
FROM public.driver_profiles dp
WHERE NOT EXISTS (
  SELECT 1 FROM public.chauffeurs c WHERE c.user_id = dp.user_id
);

-- 2. Améliorer la fonction de création automatique de profil chauffeur
CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Si l'utilisateur s'inscrit comme chauffeur, créer le profil automatiquement
  IF NEW.raw_user_meta_data->>'role' = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id,
      email,
      display_name,
      phone_number,
      is_active,
      verification_status,
      role,
      service_areas,
      vehicle_class
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
      false, -- Désactivé par défaut jusqu'à vérification
      'pending',
      CASE 
        WHEN NEW.raw_user_meta_data->>'service_category' = 'delivery' THEN 'livreur'
        ELSE 'chauffeur'
      END,
      ARRAY[COALESCE(NEW.raw_user_meta_data->>'city', 'Kinshasa')],
      'standard'
    );
    
    -- Créer aussi l'entrée dans user_roles
    INSERT INTO public.user_roles (
      user_id,
      role,
      is_active
    ) VALUES (
      NEW.id,
      'driver',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Corriger la fonction de validation des données d'inscription
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  license_number_param text,
  vehicle_plate_param text,
  phone_number_param text,
  email_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Vérifier l'unicité du numéro de permis
  IF license_number_param IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE license_number = license_number_param 
    AND license_number IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Ce numéro de permis est déjà utilisé');
  END IF;
  
  -- Vérifier l'unicité de la plaque d'immatriculation
  IF vehicle_plate_param IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE vehicle_plate = vehicle_plate_param 
    AND vehicle_plate IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Cette plaque d''immatriculation est déjà utilisée');
  END IF;
  
  -- Vérifier l'unicité du numéro de téléphone
  IF phone_number_param IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE phone_number = phone_number_param 
    AND phone_number IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Ce numéro de téléphone est déjà utilisé pour un autre chauffeur');
  END IF;
  
  -- Vérifier l'unicité de l'email dans la table chauffeurs
  IF email_param IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE email = email_param 
    AND email IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Cette adresse email est déjà utilisée pour un autre chauffeur');
  END IF;
  
  -- Construire le résultat
  IF array_length(errors, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', array_to_json(errors)
    );
  END IF;
  
  RETURN validation_result;
END;
$$;

-- 4. Nettoyer les vues SECURITY DEFINER problématiques (correction sécurité)
DO $$
DECLARE
    view_name text;
BEGIN
    -- Supprimer les vues avec SECURITY DEFINER
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    END LOOP;
END $$;

-- 5. Créer une vue sécurisée pour les statuts des chauffeurs en ligne
CREATE VIEW public.driver_online_status AS
SELECT 
    COALESCE(dl.vehicle_class, 'standard') as vehicle_class,
    COUNT(CASE WHEN dl.is_online = true AND dl.last_ping > now() - interval '10 minutes' THEN 1 END) as online_drivers,
    COUNT(*) as total_drivers
FROM public.driver_locations dl
JOIN public.chauffeurs c ON dl.driver_id = c.user_id
WHERE c.is_active = true
GROUP BY COALESCE(dl.vehicle_class, 'standard');

-- 6. Supprimer la table driver_profiles après migration (optionnel, à faire après tests)
-- DROP TABLE IF EXISTS public.driver_profiles CASCADE;