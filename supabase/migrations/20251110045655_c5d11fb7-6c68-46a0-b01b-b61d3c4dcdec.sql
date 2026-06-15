-- ============================================================================
-- FIX INSCRIPTION PARTENAIRE - Correction colonnes email/phone_number
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
  RAISE NOTICE '🔹 [PARTNER REG] Début inscription - user_id: %, email: %', p_user_id, p_email;
  
  -- Validation stricte des paramètres
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RAISE NOTICE '❌ [PARTNER REG] Email invalide: %', p_email;
    RETURN json_build_object('success', false, 'error', 'Format email invalide');
  END IF;

  IF LENGTH(p_phone_number) < 10 OR LENGTH(p_phone_number) > 15 THEN
    RAISE NOTICE '❌ [PARTNER REG] Téléphone invalide: %', p_phone_number;
    RETURN json_build_object('success', false, 'error', 'Format téléphone invalide (10-15 chiffres requis)');
  END IF;

  IF LENGTH(p_company_name) < 3 THEN
    RAISE NOTICE '❌ [PARTNER REG] Nom entreprise trop court: %', p_company_name;
    RETURN json_build_object('success', false, 'error', 'Nom entreprise trop court (minimum 3 caractères)');
  END IF;

  -- Vérifier profil partenaire existant
  IF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = p_user_id) THEN
    RAISE NOTICE '⚠️ [PARTNER REG] Profil existant pour user_id: %', p_user_id;
    RETURN json_build_object('success', false, 'error', 'Un profil partenaire existe déjà pour cet utilisateur');
  END IF;

  -- ✅ CORRECTION: Utiliser les BONS noms de colonnes (email et phone_number)
  RAISE NOTICE '📝 [PARTNER REG] Insertion dans partenaires...';
  INSERT INTO public.partenaires (
    user_id, 
    company_name, 
    email,              -- ✅ Corrigé: était contact_email
    phone_number,       -- ✅ Corrigé: était phone
    business_type,
    service_areas, 
    display_name, 
    address, 
    is_active, 
    verification_status,
    created_at, 
    updated_at
  ) VALUES (
    p_user_id, 
    p_company_name, 
    p_email, 
    p_phone_number, 
    p_business_type::TEXT,
    p_service_areas, 
    p_display_name, 
    COALESCE(p_address, 'Kinshasa, RDC'), 
    false,
    'pending',
    NOW(), 
    NOW()
  )
  RETURNING id INTO v_partner_id;

  RAISE NOTICE '✅ [PARTNER REG] Partenaire créé - ID: %', v_partner_id;

  -- Ajouter rôle partner
  RAISE NOTICE '📝 [PARTNER REG] Ajout rôle partner...';
  INSERT INTO public.user_roles (user_id, role, is_active, created_at)
  VALUES (p_user_id, 'partner', true, NOW())
  ON CONFLICT (user_id, role) DO UPDATE SET 
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE '✅ [PARTNER REG] Rôle partner ajouté';

  -- Créer/Mettre à jour profil utilisateur
  RAISE NOTICE '📝 [PARTNER REG] Création/MAJ profil...';
  INSERT INTO public.profiles (user_id, display_name, phone_number, created_at, updated_at)
  VALUES (p_user_id, p_display_name, p_phone_number, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    updated_at = NOW();

  RAISE NOTICE '✅ [PARTNER REG] Profil créé/mis à jour';

  -- ✅ CORRECTION: Utiliser user_notifications au lieu de notifications
  BEGIN
    RAISE NOTICE '📧 [PARTNER REG] Création notification admin...';
    INSERT INTO public.user_notifications (
      user_id,
      title,
      content,
      priority,
      category,
      action_url,
      created_at
    )
    SELECT 
      a.user_id,
      'Nouvelle inscription partenaire',
      'Nouveau partenaire à valider: ' || p_company_name,
      'high',
      'partner_management',
      '/admin/partners/' || v_partner_id,
      NOW()
    FROM public.admins a
    WHERE a.is_active = true;
    
    RAISE NOTICE '✅ [PARTNER REG] Notifications admin créées';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ [PARTNER REG] Notification admin échouée (non bloquant): %', SQLERRM;
  END;

  -- Log activité
  BEGIN
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata,
      created_at
    ) VALUES (
      p_user_id,
      'partner_registration',
      'Nouvelle inscription partenaire: ' || p_company_name,
      json_build_object(
        'partner_id', v_partner_id,
        'company_name', p_company_name,
        'business_type', p_business_type,
        'service_areas', p_service_areas
      ),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ [PARTNER REG] Log activité échoué (non bloquant): %', SQLERRM;
  END;

  RAISE NOTICE '✅ [PARTNER REG] Inscription complétée avec succès - partner_id: %', v_partner_id;
  
  RETURN json_build_object(
    'success', true, 
    'partner_id', v_partner_id, 
    'message', 'Profil partenaire créé avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ [PARTNER REG] ERREUR CRITIQUE: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Accorder permissions
GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO anon;

COMMENT ON FUNCTION public.create_partner_profile_secure IS 
'Crée un profil partenaire sécurisé avec correction des colonnes email/phone_number et logs détaillés';