-- ============================================
-- PHASE 3 : LOGS DIAGNOSTIC DÉTAILLÉS + VUE ADMIN DEBUG
-- ============================================

-- 1. Améliorer create_driver_profile_secure avec logs détaillés
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
    v_current_auth_uid UUID;
    v_step TEXT := 'init';
BEGIN
    -- ✅ PHASE 3: Logger l'état initial
    v_current_auth_uid := auth.uid();
    
    PERFORM log_system_activity(
        'driver_registration_start',
        'Début inscription chauffeur',
        jsonb_build_object(
            'p_user_id', p_user_id,
            'auth_uid', v_current_auth_uid,
            'auth_uid_is_null', (v_current_auth_uid IS NULL),
            'user_id_matches_auth', (v_current_auth_uid = p_user_id),
            'has_own_vehicle', p_has_own_vehicle,
            'timestamp', NOW()
        )
    );

    -- STEP: Validation
    v_step := 'validation';
    SELECT validate_driver_registration_data(
        p_email,
        p_phone_number,
        p_license_number,
        p_vehicle_plate
    ) INTO v_validation;
    
    IF NOT (v_validation->>'valid')::boolean THEN
        PERFORM log_system_activity(
            'driver_registration_failed',
            'Validation échouée à l''étape: ' || v_step,
            jsonb_build_object(
                'user_id', p_user_id,
                'step', v_step,
                'errors', v_validation->'errors',
                'auth_uid', v_current_auth_uid
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Validation échouée',
            'details', v_validation->'errors',
            'step', v_step
        );
    END IF;

    -- STEP: Vérification doublon
    v_step := 'duplicate_check';
    IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = p_user_id) THEN
        PERFORM log_system_activity(
            'driver_registration_failed',
            'Profil chauffeur déjà existant à l''étape: ' || v_step,
            jsonb_build_object(
                'user_id', p_user_id,
                'step', v_step,
                'auth_uid', v_current_auth_uid
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profil chauffeur déjà existant',
            'step', v_step
        );
    END IF;

    -- STEP: Insertion profil chauffeur
    v_step := 'insert_chauffeur';
    BEGIN
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

        PERFORM log_system_activity(
            'driver_profile_inserted',
            'Profil chauffeur inséré avec succès',
            jsonb_build_object(
                'driver_id', v_driver_id,
                'user_id', p_user_id,
                'step', v_step,
                'auth_uid', v_current_auth_uid
            )
        );
    EXCEPTION WHEN OTHERS THEN
        PERFORM log_system_activity(
            'driver_registration_failed',
            'Erreur insertion chauffeur à l''étape: ' || v_step,
            jsonb_build_object(
                'user_id', p_user_id,
                'step', v_step,
                'error', SQLERRM,
                'sqlstate', SQLSTATE,
                'auth_uid', v_current_auth_uid
            )
        );
        RAISE;
    END;

    -- STEP: Création rôle utilisateur
    v_step := 'insert_user_role';
    BEGIN
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

        PERFORM log_system_activity(
            'driver_role_created',
            'Rôle driver créé',
            jsonb_build_object(
                'user_id', p_user_id,
                'step', v_step,
                'auth_uid', v_current_auth_uid
            )
        );
    EXCEPTION WHEN OTHERS THEN
        PERFORM log_system_activity(
            'driver_registration_warning',
            'Erreur création rôle à l''étape: ' || v_step,
            jsonb_build_object(
                'user_id', p_user_id,
                'step', v_step,
                'error', SQLERRM,
                'note', 'Profil chauffeur créé mais rôle échoué'
            )
        );
        -- Ne pas lever d'exception, le profil est créé
    END;

    -- STEP: Finalisation
    v_step := 'success';
    PERFORM log_system_activity(
        'driver_registration_success',
        'Inscription chauffeur réussie',
        jsonb_build_object(
            'driver_id', v_driver_id,
            'user_id', p_user_id,
            'email', p_email,
            'has_own_vehicle', p_has_own_vehicle,
            'step', v_step,
            'auth_uid', v_current_auth_uid
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'driver_id', v_driver_id,
        'message', 'Profil chauffeur créé avec succès',
        'step', v_step
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_system_activity(
        'driver_registration_error',
        'Erreur critique lors de l''inscription à l''étape: ' || v_step,
        jsonb_build_object(
            'user_id', p_user_id,
            'step', v_step,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'auth_uid', v_current_auth_uid
        )
    );
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'step', v_step,
        'sqlstate', SQLSTATE
    );
END;
$$;

-- 2. Créer une vue admin pour déboguer les inscriptions échouées
CREATE OR REPLACE VIEW public.admin_registration_debug AS
SELECT 
    al.id,
    al.created_at,
    al.activity_type,
    al.description,
    al.user_id,
    al.metadata->>'p_user_id' as attempted_user_id,
    al.metadata->>'auth_uid' as auth_uid_at_time,
    al.metadata->>'step' as failed_step,
    al.metadata->>'error' as error_message,
    al.metadata->>'errors' as validation_errors,
    -- Vérifier si l'utilisateur existe dans auth.users
    EXISTS (SELECT 1 FROM auth.users WHERE id = (al.metadata->>'p_user_id')::uuid) as user_exists_in_auth,
    -- Vérifier si le profil chauffeur a été créé
    EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = (al.metadata->>'p_user_id')::uuid) as driver_profile_exists,
    -- Vérifier si le rôle a été créé
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (al.metadata->>'p_user_id')::uuid AND role = 'driver') as driver_role_exists,
    al.metadata
FROM public.activity_logs al
WHERE al.activity_type IN (
    'driver_registration_start',
    'driver_registration_failed',
    'driver_registration_error',
    'driver_registration_warning',
    'driver_registration_success',
    'driver_profile_inserted',
    'driver_role_created'
)
ORDER BY al.created_at DESC;

-- 3. Créer une fonction helper pour les admins pour "réparer" les inscriptions orphelines
CREATE OR REPLACE FUNCTION public.admin_repair_orphan_driver(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_auth BOOLEAN;
    v_has_profile BOOLEAN;
    v_has_role BOOLEAN;
    v_result JSONB := jsonb_build_object('repairs', jsonb_build_array());
BEGIN
    -- Vérifier les permissions admin
    IF NOT is_current_user_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Admin privileges required');
    END IF;

    -- Vérifier l'état actuel
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_has_auth;
    SELECT EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = p_user_id) INTO v_has_profile;
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'driver') INTO v_has_role;

    v_result := jsonb_build_object(
        'user_id', p_user_id,
        'initial_state', jsonb_build_object(
            'has_auth', v_has_auth,
            'has_profile', v_has_profile,
            'has_role', v_has_role
        ),
        'repairs', jsonb_build_array()
    );

    -- Si pas de compte auth, impossible de réparer
    IF NOT v_has_auth THEN
        RETURN jsonb_set(v_result, '{error}', '"No auth account found - cannot repair"');
    END IF;

    -- Créer le rôle s'il manque
    IF NOT v_has_role THEN
        INSERT INTO public.user_roles (user_id, role, is_active)
        VALUES (p_user_id, 'driver', false)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        v_result := jsonb_set(
            v_result, 
            '{repairs}', 
            (v_result->'repairs')::jsonb || '["Created missing driver role"]'::jsonb
        );
    END IF;

    -- Logger la réparation
    PERFORM log_system_activity(
        'admin_orphan_repair',
        'Admin a réparé une inscription orpheline',
        jsonb_build_object(
            'user_id', p_user_id,
            'repaired_by', auth.uid(),
            'repairs', v_result->'repairs'
        )
    );

    RETURN jsonb_set(v_result, '{success}', 'true');
END;
$$;

-- 4. Policy RLS pour la vue admin
ALTER VIEW public.admin_registration_debug SET (security_invoker = on);

-- 5. Créer index pour améliorer les performances des requêtes de debug
CREATE INDEX IF NOT EXISTS idx_activity_logs_registration_debug 
ON public.activity_logs(created_at DESC, activity_type)
WHERE activity_type IN (
    'driver_registration_start',
    'driver_registration_failed',
    'driver_registration_error',
    'driver_registration_success'
);

COMMENT ON VIEW public.admin_registration_debug IS 
'Vue admin pour déboguer les inscriptions chauffeurs échouées. Affiche les logs détaillés et l''état des comptes orphelins.';

COMMENT ON FUNCTION public.admin_repair_orphan_driver IS 
'Fonction admin pour réparer les inscriptions partielles (compte auth créé mais profil incomplet).';
