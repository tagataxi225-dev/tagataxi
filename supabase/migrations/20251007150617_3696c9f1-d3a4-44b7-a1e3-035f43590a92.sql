-- ========================================
-- FIX: Vérifier l'existence du user_id dans auth.users
-- avant insertion dans partenaires
-- ========================================

CREATE OR REPLACE FUNCTION public.create_partner_profile_secure(
    p_user_id UUID,
    p_email TEXT,
    p_phone_number TEXT,
    p_company_name TEXT,
    p_business_type TEXT,
    p_service_areas TEXT[] DEFAULT ARRAY['Kinshasa']
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_validation_result JSONB;
    v_partner_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- ========================================
    -- LOG 1: Début de la fonction
    -- ========================================
    INSERT INTO activity_logs (
        user_id, activity_type, description, metadata
    ) VALUES (
        p_user_id,
        'partner_registration_start',
        'Début d''inscription partenaire',
        jsonb_build_object(
            'email', p_email,
            'company_name', p_company_name,
            'business_type', p_business_type,
            'service_areas', p_service_areas,
            'timestamp', NOW()
        )
    );

    -- ========================================
    -- ✅ ROBUST FIX: Vérifier l'existence du user dans auth.users
    -- ========================================
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = p_user_id
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        -- Log de l'erreur
        INSERT INTO activity_logs (
            user_id, activity_type, description, metadata
        ) VALUES (
            p_user_id,
            'partner_registration_user_not_found',
            'User ID n''existe pas dans auth.users',
            jsonb_build_object(
                'user_id', p_user_id,
                'email', p_email,
                'error', 'User not found in auth.users',
                'timestamp', NOW()
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_not_found',
            'details', 'Le compte utilisateur n''existe pas encore. Veuillez réessayer dans quelques instants.'
        );
    END IF;

    -- ========================================
    -- VALIDATION DES DONNÉES
    -- ========================================
    SELECT validate_partner_registration_data(
        p_email,
        p_phone_number,
        p_company_name,
        p_business_type
    ) INTO v_validation_result;

    IF NOT (v_validation_result->>'valid')::BOOLEAN THEN
        -- Log de l'erreur de validation
        INSERT INTO activity_logs (
            user_id, activity_type, description, metadata
        ) VALUES (
            p_user_id,
            'partner_registration_validation_failed',
            'Échec validation données partenaire',
            jsonb_build_object(
                'errors', v_validation_result->'errors',
                'timestamp', NOW()
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'validation_failed',
            'details', v_validation_result->'errors'
        );
    END IF;

    -- ========================================
    -- LOG 2: Avant insertion dans partenaires
    -- ========================================
    INSERT INTO activity_logs (
        user_id, activity_type, description, metadata
    ) VALUES (
        p_user_id,
        'partner_registration_before_insert',
        'Validation OK, tentative d''insertion',
        jsonb_build_object(
            'user_id', p_user_id,
            'email', p_email,
            'user_exists_in_auth', v_user_exists,
            'timestamp', NOW()
        )
    );

    -- ========================================
    -- INSERTION DANS PARTENAIRES
    -- ========================================
    INSERT INTO public.partenaires (
        user_id,
        email,
        phone_number,
        company_name,
        business_type,
        service_areas,
        verification_status,
        is_active
    ) VALUES (
        p_user_id,
        p_email,
        p_phone_number,
        p_company_name,
        p_business_type,
        p_service_areas,
        'pending',
        false
    )
    RETURNING id INTO v_partner_id;

    -- ========================================
    -- LOG 3: Succès de l'insertion
    -- ========================================
    INSERT INTO activity_logs (
        user_id, activity_type, description, metadata
    ) VALUES (
        p_user_id,
        'partner_registration_success',
        'Profil partenaire créé avec succès',
        jsonb_build_object(
            'partner_id', v_partner_id,
            'company_name', p_company_name,
            'business_type', p_business_type,
            'timestamp', NOW()
        )
    );

    -- Créer le rôle utilisateur
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (p_user_id, 'partner', true)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'partner_id', v_partner_id,
        'message', 'Profil partenaire créé avec succès'
    );

EXCEPTION
    WHEN foreign_key_violation THEN
        -- ========================================
        -- LOG 4: Erreur de clé étrangère
        -- ========================================
        INSERT INTO activity_logs (
            user_id, activity_type, description, metadata
        ) VALUES (
            p_user_id,
            'partner_registration_fk_error',
            'Erreur de contrainte clé étrangère',
            jsonb_build_object(
                'error_code', SQLSTATE,
                'error_message', SQLERRM,
                'user_id', p_user_id,
                'email', p_email,
                'user_exists_check', v_user_exists,
                'timestamp', NOW()
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'foreign_key_violation',
            'details', 'Le compte utilisateur n''a pas été trouvé. Veuillez réessayer.'
        );
    
    WHEN OTHERS THEN
        -- ========================================
        -- LOG 5: Autres erreurs
        -- ========================================
        INSERT INTO activity_logs (
            user_id, activity_type, description, metadata
        ) VALUES (
            p_user_id,
            'partner_registration_error',
            'Erreur lors de l''inscription partenaire',
            jsonb_build_object(
                'error_code', SQLSTATE,
                'error_message', SQLERRM,
                'user_id', p_user_id,
                'email', p_email,
                'timestamp', NOW()
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;