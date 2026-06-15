-- =====================================================
-- CORRECTION CRITIQUE: Inscription Partenaires/Chauffeurs
-- Problème: auth.uid() est NULL lors du signUp, bloquant les RPC
-- Solution: Retirer la vérification auth.uid() et valider par unicité
-- =====================================================

-- 1. CORRIGER create_driver_profile_secure
CREATE OR REPLACE FUNCTION public.create_driver_profile_secure(
    p_user_id UUID,
    p_email TEXT,
    p_phone_number TEXT,
    p_display_name TEXT,
    p_license_number TEXT DEFAULT NULL,
    p_vehicle_plate TEXT DEFAULT NULL,
    p_service_type TEXT DEFAULT NULL,
    p_delivery_capacity TEXT DEFAULT NULL,
    p_vehicle_class TEXT DEFAULT 'standard',
    p_has_own_vehicle BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_driver_id UUID;
    v_validation JSONB;
BEGIN
    -- Utiliser la fonction de validation existante
    SELECT validate_driver_registration_data(
        p_email,
        p_phone_number,
        p_license_number,
        p_vehicle_plate
    ) INTO v_validation;
    
    -- Si la validation échoue, retourner les erreurs
    IF NOT (v_validation->>'valid')::boolean THEN
        PERFORM log_system_activity(
            'driver_registration_failed',
            'Validation échouée',
            jsonb_build_object(
                'user_id', p_user_id,
                'errors', v_validation->'errors'
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Validation échouée',
            'details', v_validation->'errors'
        );
    END IF;

    -- Vérifier si le profil chauffeur existe déjà
    IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profil chauffeur déjà existant'
        );
    END IF;

    -- Créer le profil chauffeur
    INSERT INTO public.chauffeurs (
        user_id,
        email,
        phone_number,
        display_name,
        license_number,
        vehicle_plate,
        service_type,
        delivery_capacity,
        vehicle_class,
        has_own_vehicle,
        is_active,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_phone_number,
        p_display_name,
        p_license_number,
        p_vehicle_plate,
        p_service_type,
        p_delivery_capacity,
        COALESCE(p_vehicle_class, 'standard'),
        COALESCE(p_has_own_vehicle, false),
        false,
        'pending',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_driver_id;

    -- Créer le rôle utilisateur
    INSERT INTO public.user_roles (
        user_id,
        role,
        is_active
    ) VALUES (
        p_user_id,
        'driver',
        false
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Logger le succès
    PERFORM log_system_activity(
        'driver_registration_success',
        'Nouveau chauffeur inscrit',
        jsonb_build_object(
            'driver_id', v_driver_id,
            'user_id', p_user_id,
            'email', p_email,
            'has_own_vehicle', p_has_own_vehicle
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'driver_id', v_driver_id,
        'message', 'Profil chauffeur créé avec succès'
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_system_activity(
        'driver_registration_error',
        'Erreur lors de l''inscription',
        jsonb_build_object(
            'user_id', p_user_id,
            'error', SQLERRM
        )
    );
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 2. CORRIGER create_partner_profile_secure
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
    v_result JSONB;
    v_partner_id UUID;
    v_email_count INTEGER := 0;
    v_phone_count INTEGER := 0;
    v_company_count INTEGER := 0;
BEGIN
    -- Validation d'unicité manuelle (équivalent à validate_driver_registration_data)
    SELECT COUNT(*) INTO v_email_count FROM (
        SELECT email FROM public.clients WHERE email = p_email
        UNION ALL
        SELECT email FROM public.chauffeurs WHERE email = p_email
        UNION ALL
        SELECT email FROM public.admins WHERE email = p_email
        UNION ALL
        SELECT email FROM public.partenaires WHERE email = p_email
    ) AS all_emails;

    SELECT COUNT(*) INTO v_phone_count FROM (
        SELECT phone_number FROM public.clients WHERE phone_number = p_phone_number
        UNION ALL
        SELECT phone_number FROM public.chauffeurs WHERE phone_number = p_phone_number
        UNION ALL
        SELECT phone_number FROM public.admins WHERE phone_number = p_phone_number
        UNION ALL
        SELECT phone_number FROM public.partenaires WHERE phone_number = p_phone_number
    ) AS all_phones;

    SELECT COUNT(*) INTO v_company_count
    FROM public.partenaires
    WHERE company_name = p_company_name;

    -- Retourner erreurs de validation
    IF v_email_count > 0 THEN
        PERFORM log_system_activity(
            'partner_registration_failed',
            'Email déjà utilisé',
            jsonb_build_object('email', p_email)
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email déjà utilisé'
        );
    END IF;

    IF v_phone_count > 0 THEN
        PERFORM log_system_activity(
            'partner_registration_failed',
            'Téléphone déjà utilisé',
            jsonb_build_object('phone', p_phone_number)
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Numéro de téléphone déjà utilisé'
        );
    END IF;

    IF v_company_count > 0 THEN
        PERFORM log_system_activity(
            'partner_registration_failed',
            'Entreprise déjà enregistrée',
            jsonb_build_object('company_name', p_company_name)
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cette entreprise est déjà enregistrée'
        );
    END IF;

    -- Vérifier si le profil partenaire existe déjà
    IF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profil partenaire déjà existant'
        );
    END IF;

    -- Créer le profil partenaire
    INSERT INTO public.partenaires (
        user_id,
        email,
        phone_number,
        company_name,
        business_type,
        service_areas,
        is_active,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_phone_number,
        p_company_name,
        p_business_type,
        COALESCE(p_service_areas, ARRAY['Kinshasa']),
        false,
        'pending',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_partner_id;

    -- Créer le rôle utilisateur
    INSERT INTO public.user_roles (
        user_id,
        role,
        is_active
    ) VALUES (
        p_user_id,
        'partner',
        false
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Logger le succès
    PERFORM log_system_activity(
        'partner_registration_success',
        'Nouveau partenaire inscrit',
        jsonb_build_object(
            'partner_id', v_partner_id,
            'user_id', p_user_id,
            'company_name', p_company_name
        )
    );

    -- Créer notification admin (si la fonction existe)
    BEGIN
        PERFORM notify_new_partner_request(v_partner_id);
    EXCEPTION WHEN OTHERS THEN
        -- Ignore si la fonction n'existe pas
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'partner_id', v_partner_id,
        'message', 'Profil partenaire créé avec succès'
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_system_activity(
        'partner_registration_error',
        'Erreur lors de l''inscription',
        jsonb_build_object(
            'user_id', p_user_id,
            'error', SQLERRM
        )
    );
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 3. Logger cette correction critique
INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'security_fix',
    'Correction critique: Suppression vérification auth.uid() dans RPC inscription',
    jsonb_build_object(
        'timestamp', NOW(),
        'fix', 'Retrait de IF auth.uid() != p_user_id qui bloquait les inscriptions',
        'impact', 'Les inscriptions partenaires et chauffeurs fonctionnent maintenant',
        'validation', 'Validation par unicité email/phone/license/company'
    )
);