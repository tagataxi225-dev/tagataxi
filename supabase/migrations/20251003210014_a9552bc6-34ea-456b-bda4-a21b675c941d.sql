-- =====================================================
-- NETTOYAGE DES TRIGGERS EN CONFLIT
-- =====================================================

-- 1. Lister et supprimer tous les triggers sur auth.users qui créent automatiquement des chauffeurs
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    -- Supprimer les triggers d'auto-création de chauffeur
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        AND trigger_name ILIKE '%chauffeur%' OR trigger_name ILIKE '%driver%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_record.trigger_name);
        RAISE NOTICE 'Trigger supprimé: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 2. Supprimer les fonctions de trigger orphelines
DROP FUNCTION IF EXISTS public.handle_new_chauffeur CASCADE;
DROP FUNCTION IF EXISTS public.create_chauffeur_on_signup CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_driver_profile CASCADE;

-- =====================================================
-- FONCTION UNIFIÉE D'INSCRIPTION CHAUFFEUR
-- =====================================================

-- Cette fonction sera appelée EXPLICITEMENT depuis le code frontend
-- Elle ne sera PAS un trigger automatique
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
BEGIN
    -- Vérifier que l'utilisateur est bien authentifié
    IF auth.uid() != p_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Accès non autorisé'
        );
    END IF;

    -- Vérifier si le profil chauffeur existe déjà
    IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profil chauffeur déjà existant'
        );
    END IF;

    -- Créer le profil chauffeur avec les champs optionnels
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
        false, -- is_active par défaut false, l'admin doit approuver
        'pending', -- verification_status par défaut pending
        NOW(),
        NOW()
    )
    RETURNING id INTO v_driver_id;

    -- Créer un rôle utilisateur
    INSERT INTO public.user_roles (
        user_id,
        role,
        is_active
    ) VALUES (
        p_user_id,
        'driver',
        false -- Pas actif tant que non vérifié
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Logger l'événement
    PERFORM public.log_system_activity(
        'driver_registration',
        'Nouveau chauffeur inscrit',
        jsonb_build_object(
            'driver_id', v_driver_id,
            'user_id', p_user_id,
            'email', p_email
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'driver_id', v_driver_id,
        'message', 'Profil chauffeur créé avec succès'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- FONCTION UNIFIÉE D'INSCRIPTION PARTENAIRE
-- =====================================================

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
BEGIN
    -- Vérifier que l'utilisateur est bien authentifié
    IF auth.uid() != p_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Accès non autorisé'
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
        false, -- is_active par défaut false
        'pending', -- verification_status par défaut pending
        NOW(),
        NOW()
    )
    RETURNING id INTO v_partner_id;

    -- Créer un rôle utilisateur
    INSERT INTO public.user_roles (
        user_id,
        role,
        is_active
    ) VALUES (
        p_user_id,
        'partner',
        false -- Pas actif tant que non vérifié
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Logger l'événement
    PERFORM public.log_system_activity(
        'partner_registration',
        'Nouveau partenaire inscrit',
        jsonb_build_object(
            'partner_id', v_partner_id,
            'user_id', p_user_id,
            'company_name', p_company_name
        )
    );

    -- Notifier les admins
    INSERT INTO public.admin_notifications (
        type,
        title,
        message,
        severity,
        data
    ) VALUES (
        'partner_request',
        'Nouvelle demande de partenariat',
        'Une nouvelle demande de partenariat a été soumise par ' || p_company_name,
        'info',
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

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Logger la correction
INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'system_fix',
    'Unification de la logique d''inscription - Suppression triggers automatiques',
    jsonb_build_object(
        'timestamp', NOW(),
        'changes', jsonb_build_array(
            'Triggers automatiques supprimés',
            'Fonction create_driver_profile_secure créée',
            'Fonction create_partner_profile_secure créée'
        )
    )
);