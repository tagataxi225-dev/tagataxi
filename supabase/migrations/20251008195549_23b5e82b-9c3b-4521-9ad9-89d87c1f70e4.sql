-- ============================================================
-- PHASE 2: Nettoyage des données orphelines
-- ============================================================

-- 1. Supprimer les profils chauffeurs sans compte auth valide
DELETE FROM public.chauffeurs 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Supprimer les profils partenaires sans compte auth valide
DELETE FROM public.partenaires 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 3. Supprimer les rôles orphelins
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 4. Supprimer les requêtes de chauffeurs orphelines
DELETE FROM public.driver_requests
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ============================================================
-- PHASE 3: Améliorer la validation pour permettre réinscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  p_email text,
  p_phone_number text,
  p_license_number text,
  p_vehicle_plate text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_errors text[] := ARRAY[]::text[];
  v_email_count integer;
  v_phone_count integer;
  v_license_count integer;
  v_plate_count integer;
BEGIN
  -- ========================================
  -- VALIDATION FORMAT EMAIL
  -- ========================================
  IF p_email IS NULL OR p_email = '' THEN
    v_errors := array_append(v_errors, 'Email requis');
  ELSIF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    v_errors := array_append(v_errors, 'Format email invalide');
  END IF;

  -- ========================================
  -- VALIDATION FORMAT TÉLÉPHONE
  -- ========================================
  IF p_phone_number IS NULL OR p_phone_number = '' THEN
    v_errors := array_append(v_errors, 'Numéro de téléphone requis');
  ELSIF length(p_phone_number) < 9 THEN
    v_errors := array_append(v_errors, 'Numéro de téléphone trop court (min 9 chiffres)');
  END IF;

  -- ========================================
  -- VALIDATION PERMIS DE CONDUIRE
  -- ========================================
  IF p_license_number IS NULL OR p_license_number = '' THEN
    v_errors := array_append(v_errors, 'Numéro de permis de conduire requis');
  ELSIF length(p_license_number) < 5 THEN
    v_errors := array_append(v_errors, 'Numéro de permis invalide (trop court)');
  END IF;

  -- ========================================
  -- UNICITÉ EMAIL (seulement si auth.users existe)
  -- ✅ AMÉLIORATION: Ne bloque pas si email orphelin
  -- ========================================
  SELECT COUNT(*) INTO v_email_count FROM (
    SELECT c.email FROM public.clients c
    INNER JOIN auth.users au ON c.user_id = au.id
    WHERE c.email = p_email
    UNION ALL
    SELECT ch.email FROM public.chauffeurs ch
    INNER JOIN auth.users au ON ch.user_id = au.id
    WHERE ch.email = p_email
    UNION ALL
    SELECT a.email FROM public.admins a
    INNER JOIN auth.users au ON a.user_id = au.id
    WHERE a.email = p_email
    UNION ALL
    SELECT p.email FROM public.partenaires p
    INNER JOIN auth.users au ON p.user_id = au.id
    WHERE p.email = p_email
  ) AS all_emails;

  IF v_email_count > 0 THEN
    v_errors := array_append(v_errors, 'Email déjà utilisé par un compte actif');
  END IF;

  -- ========================================
  -- UNICITÉ TÉLÉPHONE (seulement si auth.users existe)
  -- ✅ AMÉLIORATION: Ne bloque pas si téléphone orphelin
  -- ========================================
  SELECT COUNT(*) INTO v_phone_count FROM (
    SELECT c.phone_number FROM public.clients c
    INNER JOIN auth.users au ON c.user_id = au.id
    WHERE c.phone_number = p_phone_number
    UNION ALL
    SELECT ch.phone_number FROM public.chauffeurs ch
    INNER JOIN auth.users au ON ch.user_id = au.id
    WHERE ch.phone_number = p_phone_number
    UNION ALL
    SELECT a.phone_number FROM public.admins a
    INNER JOIN auth.users au ON a.user_id = au.id
    WHERE a.phone_number = p_phone_number
    UNION ALL
    SELECT p.phone_number FROM public.partenaires p
    INNER JOIN auth.users au ON p.user_id = au.id
    WHERE p.phone_number = p_phone_number
  ) AS all_phones;

  IF v_phone_count > 0 THEN
    v_errors := array_append(v_errors, 'Numéro de téléphone déjà utilisé par un compte actif');
  END IF;

  -- ========================================
  -- UNICITÉ PERMIS (seulement si auth.users existe)
  -- ✅ AMÉLIORATION: Ne bloque pas si permis orphelin
  -- ========================================
  SELECT COUNT(*) INTO v_license_count
  FROM public.chauffeurs ch
  INNER JOIN auth.users au ON ch.user_id = au.id
  WHERE ch.license_number = p_license_number;

  IF v_license_count > 0 THEN
    v_errors := array_append(v_errors, 'Numéro de permis déjà enregistré sur un compte actif');
  END IF;

  -- ========================================
  -- UNICITÉ PLAQUE (si fournie, seulement si auth.users existe)
  -- ✅ AMÉLIORATION: Ne bloque pas si plaque orpheline
  -- ========================================
  IF p_vehicle_plate IS NOT NULL AND p_vehicle_plate != '' THEN
    SELECT COUNT(*) INTO v_plate_count
    FROM public.chauffeurs ch
    INNER JOIN auth.users au ON ch.user_id = au.id
    WHERE ch.vehicle_plate = p_vehicle_plate;

    IF v_plate_count > 0 THEN
      v_errors := array_append(v_errors, 'Plaque d''immatriculation déjà enregistrée sur un compte actif');
    END IF;
  END IF;

  -- ========================================
  -- RETOUR RÉSULTAT
  -- ========================================
  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(v_errors)
    );
  ELSE
    RETURN jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb
    );
  END IF;
END;
$function$;

-- ============================================================
-- PHASE 5: Fonction pour compléter l'inscription après email
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_driver_registration_after_email(
  p_user_id uuid,
  p_registration_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_driver_id uuid;
  v_error text;
BEGIN
  -- Vérifier que le user existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Vérifier que le profil chauffeur n'existe pas déjà
  IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Driver profile already exists',
      'driver_id', (SELECT id FROM public.chauffeurs WHERE user_id = p_user_id)
    );
  END IF;

  -- Créer le profil chauffeur via la fonction RPC existante
  DECLARE
    v_result jsonb;
  BEGIN
    SELECT create_driver_profile_secure(
      p_user_id := p_user_id,
      p_email := p_registration_data->>'email',
      p_display_name := p_registration_data->>'display_name',
      p_phone_number := p_registration_data->>'phone_number',
      p_license_number := p_registration_data->>'license_number',
      p_vehicle_plate := p_registration_data->>'vehicle_plate',
      p_service_type := p_registration_data->>'service_type',
      p_delivery_capacity := p_registration_data->>'delivery_capacity',
      p_vehicle_class := COALESCE(p_registration_data->>'vehicle_class', 'standard'),
      p_has_own_vehicle := COALESCE((p_registration_data->>'has_own_vehicle')::boolean, false)
    ) INTO v_result;

    RETURN v_result;
  END;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- ============================================================
-- Fonction similaire pour les partenaires
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_partner_registration_after_email(
  p_user_id uuid,
  p_registration_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_partner_id uuid;
BEGIN
  -- Vérifier que le user existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Vérifier que le profil partenaire n'existe pas déjà
  IF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Partner profile already exists',
      'partner_id', (SELECT id FROM public.partenaires WHERE user_id = p_user_id)
    );
  END IF;

  -- Créer le profil partenaire via la fonction RPC existante
  DECLARE
    v_result jsonb;
  BEGIN
    SELECT create_partner_profile_secure(
      p_user_id := p_user_id,
      p_email := p_registration_data->>'email',
      p_company_name := p_registration_data->>'company_name',
      p_phone_number := p_registration_data->>'phone_number',
      p_business_type := p_registration_data->>'business_type',
      p_service_areas := ARRAY(SELECT jsonb_array_elements_text(p_registration_data->'service_areas'))
    ) INTO v_result;

    RETURN v_result;
  END;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;