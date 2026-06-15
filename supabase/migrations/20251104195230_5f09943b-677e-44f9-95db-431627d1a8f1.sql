-- Migration: fix_partner_rpc_complete
-- Description: Ajouter p_display_name et p_address à create_partner_profile_secure avec validation inline

DROP FUNCTION IF EXISTS public.create_partner_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_partner_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[]);

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
    -- Log début
    RAISE NOTICE '🔹 create_partner_profile_secure appelée pour user_id: %', p_user_id;
    
    -- ✅ VALIDATION INLINE EMAIL
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE NOTICE '❌ Validation échouée: email invalide %', p_email;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Format email invalide'
        );
    END IF;
    
    -- ✅ VALIDATION INLINE TÉLÉPHONE
    IF p_phone_number !~ '^\+?[0-9]{10,15}$' THEN
        RAISE NOTICE '❌ Validation échouée: téléphone invalide %', p_phone_number;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Format téléphone invalide (10-15 chiffres)'
        );
    END IF;
    
    -- ✅ VALIDATION INLINE NOM ENTREPRISE
    IF LENGTH(TRIM(p_company_name)) < 3 THEN
        RAISE NOTICE '❌ Validation échouée: nom entreprise trop court';
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nom entreprise trop court (minimum 3 caractères)'
        );
    END IF;
    
    -- ✅ VALIDATION BUSINESS TYPE
    IF p_business_type NOT IN ('transport', 'delivery', 'both') THEN
        RAISE NOTICE '❌ Validation échouée: business_type invalide %', p_business_type;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Type de service invalide'
        );
    END IF;
    
    -- ✅ GÉNÉRER VALEURS PAR DÉFAUT
    v_display_name := COALESCE(NULLIF(TRIM(p_display_name), ''), p_company_name);
    v_address := CASE 
        WHEN p_address IS NULL OR TRIM(p_address) = '' 
        THEN 'Kinshasa, RDC' 
        ELSE p_address 
    END;
    
    RAISE NOTICE '✅ Validation réussie. display_name: %, address: %', v_display_name, v_address;
    
    -- Vérification user_id dans auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = p_user_id
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        RAISE NOTICE '❌ User non trouvé dans auth.users: %', p_user_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Utilisateur non trouvé dans le système'
        );
    END IF;
    
    RAISE NOTICE '✅ User trouvé dans auth.users';
    
    -- ✅ INSERT COMPLET avec display_name et address
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
    
    RAISE NOTICE '✅ Profil partenaire créé avec succès. partner_id: %', v_partner_id;
    
    -- Log dans activity_logs
    INSERT INTO public.activity_logs (
        user_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        p_user_id,
        'partner_registration',
        'Profil partenaire créé via inscription sécurisée',
        jsonb_build_object(
            'partner_id', v_partner_id,
            'company_name', p_company_name,
            'business_type', p_business_type,
            'display_name', v_display_name,
            'address', v_address
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'partner_id', v_partner_id,
        'message', 'Profil partenaire créé avec succès'
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '❌ Profil partenaire existe déjà pour user_id: %', p_user_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Un profil partenaire existe déjà pour cet utilisateur'
        );
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur inattendue: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_profile_secure TO anon;

COMMENT ON FUNCTION public.create_partner_profile_secure IS 'Crée un profil partenaire sécurisé avec validation inline complète des données';