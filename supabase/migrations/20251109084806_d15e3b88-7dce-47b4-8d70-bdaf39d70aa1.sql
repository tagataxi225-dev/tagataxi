-- ============================================================================
-- FONCTION RPC: create_partner_profile_secure (avec DROP)
-- Crée un profil partenaire de manière sécurisée avec validation
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_partner_profile_secure(uuid,text,text,text,text,text[],text,text);

CREATE OR REPLACE FUNCTION public.create_partner_profile_secure(
  p_user_id UUID,
  p_email TEXT,
  p_company_name TEXT,
  p_phone_number TEXT,
  p_business_type TEXT,
  p_service_areas TEXT[],
  p_display_name TEXT,
  p_address TEXT DEFAULT 'Kinshasa, RDC'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id UUID;
BEGIN
  -- Validation des paramètres
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Format email invalide'
    );
  END IF;

  IF LENGTH(p_phone_number) < 10 OR LENGTH(p_phone_number) > 15 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Format téléphone invalide (10-15 chiffres requis)'
    );
  END IF;

  IF LENGTH(p_company_name) < 3 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Nom entreprise trop court (minimum 3 caractères)'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Un profil partenaire existe déjà pour cet utilisateur'
    );
  END IF;

  INSERT INTO public.partenaires (
    user_id, company_name, contact_email, phone, business_type,
    service_areas, display_name, address, is_active, created_at, updated_at
  ) VALUES (
    p_user_id, p_company_name, p_email, p_phone_number, p_business_type,
    p_service_areas, p_display_name, p_address, false, NOW(), NOW()
  )
  RETURNING id INTO v_partner_id;

  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (p_user_id, 'partner', true)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.profiles (user_id, display_name, phone_number, created_at, updated_at)
  VALUES (p_user_id, p_display_name, p_phone_number, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    phone_number = EXCLUDED.phone_number,
    updated_at = NOW();

  INSERT INTO public.notifications (user_type, title, message, type, created_at)
  VALUES ('admin', 'Nouvelle inscription partenaire', 'Nouveau partenaire à valider: ' || p_company_name, 'partner_registration', NOW());

  RETURN json_build_object('success', true, 'partner_id', v_partner_id, 'message', 'Profil partenaire créé avec succès');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO authenticated;