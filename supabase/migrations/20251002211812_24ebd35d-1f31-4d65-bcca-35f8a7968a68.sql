-- Phase 1: Unification du système de vérification utilisateur

-- 1. Ajouter les colonnes manquantes à user_verification pour le workflow admin
ALTER TABLE public.user_verification 
ADD COLUMN IF NOT EXISTS identity_document_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.admins(user_id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Créer un index pour les recherches admin
CREATE INDEX IF NOT EXISTS idx_user_verification_status ON public.user_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_verification_reviewed_by ON public.user_verification(reviewed_by);

-- 3. Migrer les données de user_verifications vers user_verification (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_verifications') THEN
    -- Migrer les données
    INSERT INTO public.user_verification (
      user_id, 
      phone_verified, 
      identity_verified, 
      verification_level,
      identity_document_url,
      verification_status,
      created_at,
      updated_at,
      verified_at
    )
    SELECT 
      user_id,
      phone_verified,
      identity_verified,
      CASE 
        WHEN verification_status = 'approved' THEN 'verified'
        WHEN verification_status = 'rejected' THEN 'rejected'
        ELSE 'pending'
      END as verification_level,
      identity_document_url,
      verification_status,
      created_at,
      updated_at,
      CASE WHEN verification_status = 'approved' THEN updated_at ELSE NULL END
    FROM public.user_verifications
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_verification uv WHERE uv.user_id = user_verifications.user_id
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Supprimer l'ancienne table
    DROP TABLE IF EXISTS public.user_verifications CASCADE;
  END IF;
END $$;

-- 4. Ajouter une contrainte pour le statut de vérification
ALTER TABLE public.user_verification 
ADD CONSTRAINT check_verification_status 
CHECK (verification_status IN ('pending', 'pending_review', 'approved', 'rejected', 'info_requested'));

-- 5. Créer une fonction trigger pour mettre à jour verification_level automatiquement
CREATE OR REPLACE FUNCTION public.sync_verification_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le statut est approuvé, mettre à jour verification_level
  IF NEW.verification_status = 'approved' THEN
    NEW.verification_level := 'verified';
    NEW.verified_at := NOW();
    NEW.phone_verified := true;
    NEW.identity_verified := true;
  ELSIF NEW.verification_status = 'rejected' THEN
    NEW.verification_level := 'basic';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Créer le trigger
DROP TRIGGER IF EXISTS trigger_sync_verification_level ON public.user_verification;
CREATE TRIGGER trigger_sync_verification_level
  BEFORE UPDATE ON public.user_verification
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
  EXECUTE FUNCTION public.sync_verification_level();

-- 7. Logger les changements de statut dans activity_logs
CREATE OR REPLACE FUNCTION public.log_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'verification_status_change',
      'Statut de vérification changé de ' || COALESCE(OLD.verification_status, 'none') || ' à ' || NEW.verification_status,
      jsonb_build_object(
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'reviewed_by', NEW.reviewed_by,
        'admin_notes', NEW.admin_notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Créer le trigger de logging
DROP TRIGGER IF EXISTS trigger_log_verification_change ON public.user_verification;
CREATE TRIGGER trigger_log_verification_change
  AFTER UPDATE ON public.user_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_change();

-- 9. Mettre à jour les enregistrements existants qui ont des documents mais pas de statut
UPDATE public.user_verification
SET verification_status = 'pending_review'
WHERE identity_document_url IS NOT NULL 
  AND verification_status = 'pending'
  AND verified_at IS NULL;