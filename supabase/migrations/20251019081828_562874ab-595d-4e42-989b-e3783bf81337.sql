-- ============================================
-- FONCTION RPC : Ajouter rôle partenaire à un utilisateur existant
-- ============================================
-- Permet à un utilisateur avec un compte existant (client, chauffeur, restaurant)
-- de devenir partenaire sans créer un nouveau compte email

CREATE OR REPLACE FUNCTION public.add_partner_role_to_existing_user(
  p_user_id uuid,
  p_company_name text,
  p_phone_number text,
  p_business_type text,
  p_service_areas text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_existing_partner uuid;
  v_user_email text;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  SELECT email INTO v_user_email
  FROM auth.users 
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;
  
  -- Vérifier qu'il n'est pas déjà partenaire
  SELECT id INTO v_existing_partner 
  FROM public.partenaires 
  WHERE user_id = p_user_id;
  
  IF v_existing_partner IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous êtes déjà partenaire avec ce compte'
    );
  END IF;
  
  -- Créer le profil partenaire
  INSERT INTO public.partenaires (
    user_id, 
    email, 
    company_name, 
    phone_number, 
    business_type, 
    service_areas, 
    verification_status, 
    is_active
  ) VALUES (
    p_user_id,
    v_user_email,
    p_company_name,
    p_phone_number,
    p_business_type,
    p_service_areas,
    'pending',
    true
  )
  RETURNING id INTO v_partner_id;
  
  -- Ajouter le rôle 'partner' dans user_roles
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (p_user_id, 'partner', true)
  ON CONFLICT (user_id, role) DO UPDATE 
  SET is_active = true;
  
  -- Logger l'activité
  INSERT INTO public.activity_logs (
    user_id, 
    activity_type, 
    description, 
    metadata
  ) VALUES (
    p_user_id,
    'partner_role_added',
    'Rôle partenaire ajouté à un compte existant',
    jsonb_build_object(
      'partner_id', v_partner_id, 
      'company_name', p_company_name,
      'email', v_user_email
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'message', 'Rôle partenaire ajouté avec succès',
    'email', v_user_email
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;