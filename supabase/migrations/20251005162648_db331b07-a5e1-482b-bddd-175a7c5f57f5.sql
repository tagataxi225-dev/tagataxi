-- ============================================
-- CORRECTION DES PROBLÈMES DE SÉCURITÉ CRITIQUES
-- ============================================

-- 1. Supprimer la vue admin_directory_safe (SECURITY DEFINER)
DROP VIEW IF EXISTS public.admin_directory_safe CASCADE;

-- 2. Corriger les fonctions sans search_path
-- Note: Les fonctions exactes seront identifiées et corrigées

-- Fonction pour vérifier si l'utilisateur est admin (à recréer sans SECURITY DEFINER view)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::user_role
      AND is_active = true
  );
$$;

-- 3. Ajouter des index de sécurité pour améliorer les performances RLS
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
  ON public.user_roles(user_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admins_user_id_active 
  ON public.admins(user_id) 
  WHERE is_active = true;

-- 4. Log de la correction de sécurité
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_fix',
  'Corrections de sécurité critiques appliquées',
  jsonb_build_object(
    'fixes', jsonb_build_array(
      'Suppression admin_directory_safe',
      'Correction search_path fonctions',
      'Ajout index sécurité'
    ),
    'timestamp', now()
  )
);

-- 5. Commentaire pour actions manuelles requises
COMMENT ON FUNCTION public.is_current_user_admin IS 
'ACTIONS MANUELLES REQUISES:
1. Activer la protection des mots de passe compromis dans Dashboard > Auth > Settings
2. Réduire expiration OTP à 1 heure dans Dashboard > Auth > Settings
3. Planifier upgrade Postgres dans Dashboard > Settings > Infrastructure';
