-- PHASE 1.1: Corriger le trigger d'inscription chauffeur
-- Objectif: Créer automatiquement un profil chauffeur ACTIF avec préférences de service

-- Remplacer la fonction handle_new_driver_user_direct pour activer par défaut
CREATE OR REPLACE FUNCTION public.handle_new_driver_user_direct(auth_user auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_phone TEXT;
  v_display_name TEXT;
  v_license_number TEXT;
  v_vehicle_plate TEXT;
  v_service_type TEXT;
BEGIN
  v_phone := auth_user.raw_user_meta_data->>'phone_number';
  v_display_name := COALESCE(
    auth_user.raw_user_meta_data->>'display_name',
    split_part(auth_user.email, '@', 1)
  );
  v_license_number := auth_user.raw_user_meta_data->>'license_number';
  v_vehicle_plate := auth_user.raw_user_meta_data->>'vehicle_plate';
  v_service_type := COALESCE(auth_user.raw_user_meta_data->>'service_type', 'delivery');
  
  IF v_phone IS NULL OR trim(v_phone) = '' THEN
    RAISE WARNING 'Missing driver phone: user_id=%', auth_user.id;
    RETURN;
  END IF;
  
  -- ✅ CORRECTION: Créer profil driver ACTIF par défaut
  INSERT INTO public.chauffeurs (
    user_id, email, phone_number, display_name,
    license_number, vehicle_plate, service_type,
    is_active, verification_status, role
  ) VALUES (
    auth_user.id, auth_user.email, v_phone, v_display_name,
    v_license_number, v_vehicle_plate, v_service_type,
    true, -- ✅ ACTIF PAR DÉFAUT (avant: false)
    'pending', 'chauffeur'
  ) ON CONFLICT (user_id) DO UPDATE SET is_active = true;
  
  -- ✅ NOUVEAU: Créer automatiquement les préférences de service
  INSERT INTO public.driver_service_preferences (
    driver_id,
    preferred_service_type,
    service_types,
    is_active
  ) VALUES (
    auth_user.id,
    v_service_type,
    ARRAY[v_service_type],
    true
  ) ON CONFLICT (driver_id) DO NOTHING;
  
  -- Créer wallet
  INSERT INTO public.user_wallets (
    user_id, balance, ecosystem_credits, kwenda_points, currency, status
  ) VALUES (
    auth_user.id, 0, 0, 0, 'CDF', 'active'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer rôle
  INSERT INTO public.user_roles (
    user_id, role, is_active
  ) VALUES (
    auth_user.id, 'driver', true
  ) ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;
  
  RAISE NOTICE 'Driver profile created and ACTIVATED: user_id=%, email=%', auth_user.id, auth_user.email;
END;
$function$;

-- PHASE 1.3: Activer tous les chauffeurs existants avec rôle actif
UPDATE public.chauffeurs
SET 
  is_active = true,
  updated_at = NOW()
WHERE is_active = false
  AND user_id IN (
    SELECT user_id 
    FROM public.user_roles 
    WHERE role = 'driver' AND is_active = true
  );

-- Logger l'opération
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
)
SELECT 
  user_id,
  'driver_activation',
  'Compte chauffeur activé automatiquement (Phase 1.3)',
  jsonb_build_object('activated_at', NOW())
FROM public.chauffeurs
WHERE is_active = true
  AND updated_at > NOW() - INTERVAL '1 minute';