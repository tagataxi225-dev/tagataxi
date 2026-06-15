-- Migration: Correction du système de vérification pour marketplace
-- Étape 1: Migrer les données existantes vers des valeurs valides

UPDATE public.user_verification 
SET verification_level = 'full' 
WHERE verification_level IN ('verified', 'premium');

-- Étape 2: Supprimer l'ancienne contrainte CHECK trop restrictive
ALTER TABLE public.user_verification 
DROP CONSTRAINT IF EXISTS user_verification_verification_level_check;

-- Étape 3: Créer une nouvelle contrainte CHECK acceptant les bonnes valeurs
ALTER TABLE public.user_verification 
ADD CONSTRAINT user_verification_verification_level_check 
CHECK (verification_level IN ('none', 'basic', 'full'));

-- Étape 4: Créer une fonction RPC pour l'approbation manuelle (mode test)
CREATE OR REPLACE FUNCTION public.admin_approve_verification_manual(
  p_user_id uuid,
  p_admin_notes text DEFAULT 'Approbation manuelle'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Vérifier que l'utilisateur est admin
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_admin_id
      AND role = 'admin'
      AND is_active = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Accès refusé: Privilèges admin requis'
    );
  END IF;

  -- Mettre à jour la vérification
  UPDATE public.user_verification
  SET 
    verification_status = 'approved',
    verification_level = 'full',
    phone_verified = true,
    identity_verified = true,
    verified_at = now(),
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Créer une notification pour l'utilisateur
  INSERT INTO public.delivery_notifications (
    user_id,
    notification_type,
    title,
    message,
    metadata
  ) VALUES (
    p_user_id,
    'account_verification',
    '✅ Compte vérifié (Mode Test)',
    'Votre compte a été approuvé manuellement. Vous pouvez maintenant vendre sur la marketplace.',
    jsonb_build_object(
      'verification_status', 'approved',
      'verification_level', 'full',
      'approved_by', v_admin_id,
      'manual_approval', true
    )
  );

  -- Logger l'action
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    v_admin_id,
    'admin_manual_approval',
    'Approbation manuelle de vérification',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'admin_notes', p_admin_notes,
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Compte approuvé manuellement'
  );
END;
$$;