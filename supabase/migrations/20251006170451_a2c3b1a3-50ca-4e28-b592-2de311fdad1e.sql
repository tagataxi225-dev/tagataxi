-- ========================================
-- PHASE 1: APPROBATION MANUELLE ADMIN POUR TEST
-- ========================================

-- Fonction pour approuver manuellement la vérification (mode test)
CREATE OR REPLACE FUNCTION public.admin_approve_verification_manual(
  p_user_id uuid,
  p_admin_notes text DEFAULT 'Approbation manuelle pour test marketplace'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_verification_id uuid;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  SELECT user_id INTO v_admin_id 
  FROM public.admins 
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Accès refusé : privilèges admin requis'
    );
  END IF;

  -- Mettre à jour ou créer l'enregistrement de vérification
  INSERT INTO public.user_verification (
    user_id,
    phone_verified,
    identity_verified,
    verification_level,
    verification_status,
    admin_notes,
    reviewed_by,
    reviewed_at,
    verified_at,
    updated_at
  ) VALUES (
    p_user_id,
    true,
    true,
    'verified',
    'approved',
    p_admin_notes,
    v_admin_id,
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    phone_verified = true,
    identity_verified = true,
    verification_level = 'verified',
    verification_status = 'approved',
    admin_notes = EXCLUDED.admin_notes,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = now(),
    verified_at = now(),
    updated_at = now()
  RETURNING id INTO v_verification_id;

  -- Logger l'action dans activity_logs
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    v_admin_id,
    'admin_manual_verification',
    'Approbation manuelle de vérification utilisateur (mode test)',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'verification_id', v_verification_id,
      'mode', 'manual_test_approval',
      'admin_notes', p_admin_notes
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'verification_id', v_verification_id,
    'message', 'Vérification approuvée avec succès'
  );
END;
$$;