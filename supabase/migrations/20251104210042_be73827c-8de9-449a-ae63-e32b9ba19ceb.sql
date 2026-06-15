-- FIX CRITIQUE: Corriger validation business_type pour accepter les bonnes valeurs
-- Le formulaire envoie: 'individual' | 'company' | 'cooperative' | 'association'
-- Mais la fonction attendait: 'transport' | 'delivery' | 'both'

DROP FUNCTION IF EXISTS public.create_partner_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_partner_profile_secure(
    p_user_id UUID,
    p_email TEXT,
    p_phone_number TEXT,
    p_company_name TEXT,
    p_business_type TEXT,
    p_service_areas TEXT[] DEFAULT ARRAY['Kinshasa'::TEXT],
    p_display_name TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_partner_id UUID;
    v_user_exists BOOLEAN;
    v_display_name TEXT;
    v_address TEXT;
BEGIN
    RAISE NOTICE '🔹 create_partner_profile_secure - user_id: %', p_user_id;
    
    -- ✅ VALIDATION EMAIL
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE NOTICE '❌ Email invalide: %', p_email;
        RETURN jsonb_build_object('success', false, 'error', 'Format email invalide');
    END IF;
    
    -- ✅ VALIDATION TÉLÉPHONE
    IF p_phone_number !~ '^\+?[0-9]{10,15}$' THEN
        RAISE NOTICE '❌ Téléphone invalide: %', p_phone_number;
        RETURN jsonb_build_object('success', false, 'error', 'Format téléphone invalide');
    END IF;
    
    -- ✅ VALIDATION NOM ENTREPRISE
    IF LENGTH(TRIM(p_company_name)) < 3 THEN
        RAISE NOTICE '❌ Nom entreprise trop court';
        RETURN jsonb_build_object('success', false, 'error', 'Nom entreprise trop court (min 3 caractères)');
    END IF;
    
    -- ✅ FIX: VALIDATION BUSINESS TYPE CORRIGÉE
    IF p_business_type NOT IN ('individual', 'company', 'cooperative', 'association') THEN
        RAISE NOTICE '❌ Business type invalide: %', p_business_type;
        RETURN jsonb_build_object('success', false, 'error', 'Type d''entreprise invalide');
    END IF;
    
    -- Valeurs par défaut
    v_display_name := COALESCE(NULLIF(TRIM(p_display_name), ''), p_company_name);
    v_address := COALESCE(NULLIF(TRIM(p_address), ''), 'Kinshasa, RDC');
    
    RAISE NOTICE '✅ Validation OK - display_name: %, address: %', v_display_name, v_address;
    
    -- Vérification user dans auth.users
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE NOTICE '❌ User introuvable: %', p_user_id;
        RETURN jsonb_build_object('success', false, 'error', 'Utilisateur introuvable');
    END IF;
    
    -- ✅ INSERTION
    INSERT INTO public.partenaires (
        user_id,
        email,
        phone_number,
        display_name,
        company_name,
        business_type,
        address,
        service_areas,
        verification_status,
        is_active
    ) VALUES (
        p_user_id,
        p_email,
        p_phone_number,
        v_display_name,
        p_company_name,
        p_business_type,
        v_address,
        p_service_areas,
        'pending',
        false
    )
    RETURNING id INTO v_partner_id;
    
    RAISE NOTICE '✅ Profil créé - partner_id: %', v_partner_id;
    
    -- Log activité
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
    VALUES (
        p_user_id,
        'partner_registration',
        'Inscription partenaire sécurisée',
        jsonb_build_object(
            'partner_id', v_partner_id,
            'company_name', p_company_name,
            'business_type', p_business_type
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'partner_id', v_partner_id,
        'message', 'Profil partenaire créé avec succès'
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '❌ Profil déjà existant pour user: %', p_user_id;
        RETURN jsonb_build_object('success', false, 'error', 'Profil partenaire déjà existant');
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO anon;