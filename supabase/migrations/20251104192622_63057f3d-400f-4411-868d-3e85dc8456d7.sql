-- Migration: fix_partner_registration_missing_fields
-- Date: 2025-11-04
-- Description: Ajouter display_name et address à create_partner_profile_secure

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
AS $$
DECLARE
    v_validation_result JSONB;
    v_partner_id UUID;
    v_user_exists BOOLEAN;
    v_display_name TEXT;
    v_address TEXT;
BEGIN
    -- Logs de démarrage
    RAISE NOTICE 'Starting create_partner_profile_secure for user: %', p_user_id;
    RAISE NOTICE 'Email: %, Company: %', p_email, p_company_name;
    
    -- Générer display_name si non fourni
    v_display_name := COALESCE(p_display_name, p_company_name);
    
    -- Générer address si non fourni (par défaut Kinshasa)
    v_address := CASE 
        WHEN p_address IS NULL OR p_address = '' 
        THEN 'Kinshasa, RDC' 
        ELSE p_address 
    END;
    
    RAISE NOTICE 'Generated display_name: %, address: %', v_display_name, v_address;
    
    -- Vérifier que l'utilisateur existe dans auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = p_user_id
    ) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'User does not exist in auth.users: %', p_user_id;
    END IF;
    
    -- Valider les données avec la fonction de validation
    SELECT public.validate_partner_data(
        p_email,
        p_phone_number,
        p_company_name,
        p_business_type
    ) INTO v_validation_result;
    
    -- Vérifier le résultat de validation
    IF NOT (v_validation_result->>'is_valid')::boolean THEN
        RAISE EXCEPTION 'Validation failed: %', v_validation_result->>'error';
    END IF;
    
    -- Vérifier que le partenaire n'existe pas déjà
    IF EXISTS(SELECT 1 FROM public.partenaires WHERE user_id = p_user_id) THEN
        RAISE NOTICE 'Partner already exists for user: %', p_user_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Un profil partenaire existe déjà pour cet utilisateur'
        );
    END IF;
    
    -- Log avant insertion
    RAISE NOTICE 'Inserting partner profile...';
    
    -- Créer le profil partenaire
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
    
    RAISE NOTICE 'Partner profile created with ID: %', v_partner_id;
    
    -- Logger l'activité
    INSERT INTO public.activity_logs (
        user_id,
        action_type,
        details
    ) VALUES (
        p_user_id,
        'partner_registration',
        jsonb_build_object(
            'partner_id', v_partner_id,
            'company_name', p_company_name,
            'business_type', p_business_type,
            'service_areas', p_service_areas
        )
    );
    
    RAISE NOTICE 'Activity logged successfully';
    
    RETURN jsonb_build_object(
        'success', true,
        'partner_id', v_partner_id,
        'message', 'Profil partenaire créé avec succès'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in create_partner_profile_secure: % %', SQLERRM, SQLSTATE;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;