-- ========================================
-- PHASE 1-4: Fix Partner Registration RLS
-- Nettoyer les politiques RLS + Fonction sécurisée + Logs
-- ========================================

-- ========================================
-- PHASE 1: Nettoyer les politiques RLS redondantes
-- ========================================

-- Supprimer TOUTES les politiques existantes sur partenaires
DROP POLICY IF EXISTS "partenaires_admin_access" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_admin_full_access" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_admin_read_access" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_admin_view" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_insert_own_data" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_own_data_only" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_own_profile_access" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_select_own_data" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_update_own_data" ON public.partenaires;

-- Créer 3 politiques PROPRES et CLAIRES

-- 1. Politique pour les partenaires (lecture/modification de leur propre profil)
CREATE POLICY "partenaires_own_profile"
ON public.partenaires
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Politique pour les admins (lecture de tous les profils)
CREATE POLICY "partenaires_admin_read"
ON public.partenaires
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- 3. Politique SPÉCIALE pour l'inscription initiale (SECURITY DEFINER bypass)
CREATE POLICY "partenaires_secure_registration"
ON public.partenaires
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permet l'insertion si auth.uid() correspond au user_id
  -- OU si c'est un admin qui crée manuellement
  -- Cette politique fonctionne avec SECURITY DEFINER functions
  auth.uid() = user_id OR is_current_user_admin()
);

-- ========================================
-- PHASE 2-3: Recréer la fonction d'inscription avec logs détaillés
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
            'timestamp', NOW()
        )
    );

    -- ========================================
    -- INSERTION DANS PARTENAIRES
    -- Utilise p_user_id (pas auth.uid()) pour contourner RLS via SECURITY DEFINER
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
        p_user_id,  -- ✅ Paramètre explicite, pas auth.uid()
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
    WHEN OTHERS THEN
        -- ========================================
        -- LOG 4: Erreur RLS ou autre
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
                'error_detail', SQLSTATE,
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

-- ========================================
-- PHASE 4: Créer une vue de monitoring pour les admins
-- ========================================

CREATE OR REPLACE VIEW public.partner_registration_monitoring AS
SELECT 
    al.created_at,
    al.user_id,
    al.activity_type,
    al.description,
    al.metadata->>'email' as email,
    al.metadata->>'company_name' as company_name,
    al.metadata->>'error_message' as error_message,
    al.metadata->>'error_code' as error_code
FROM activity_logs al
WHERE al.activity_type LIKE 'partner_registration%'
ORDER BY al.created_at DESC
LIMIT 100;

-- Permission admin pour la vue
GRANT SELECT ON public.partner_registration_monitoring TO authenticated;

-- Log de l'application de cette migration
INSERT INTO activity_logs (
    user_id, activity_type, description, metadata
) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'partner_rls_fix',
    'Application du fix RLS pour inscription partenaire',
    jsonb_build_object(
        'policies_dropped', 9,
        'policies_created', 3,
        'function_recreated', 'create_partner_profile_secure',
        'monitoring_view_created', 'partner_registration_monitoring',
        'timestamp', NOW()
    )
);