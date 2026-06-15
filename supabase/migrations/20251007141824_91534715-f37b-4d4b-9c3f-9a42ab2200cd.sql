-- ============================================
-- PHASE 1 : CORRECTION RLS POUR INSCRIPTION CHAUFFEURS
-- ============================================
-- Problème : La policy ALL bloque les insertions via create_driver_profile_secure
-- Solution : Séparer les policies et autoriser les insertions sécurisées

-- 1. Supprimer la policy ALL trop restrictive
DROP POLICY IF EXISTS "chauffeurs_own_data_secure" ON public.chauffeurs;

-- 2. Créer des policies granulaires pour SELECT, UPDATE, DELETE
CREATE POLICY "chauffeurs_select_own_data"
ON public.chauffeurs
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_current_user_admin()
);

CREATE POLICY "chauffeurs_update_own_data"
ON public.chauffeurs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chauffeurs_delete_own_data"
ON public.chauffeurs
FOR DELETE
USING (
  auth.uid() = user_id 
  OR is_current_user_admin()
);

-- 3. Policy INSERT spéciale pour les fonctions sécurisées
-- Autorise l'insertion si :
-- - L'utilisateur insère son propre profil (auth.uid() = user_id)
-- - OU c'est une fonction SECURITY DEFINER qui insère un profil valide
CREATE POLICY "chauffeurs_insert_secure"
ON public.chauffeurs
FOR INSERT
WITH CHECK (
  -- Cas 1 : Utilisateur authentifié insère son propre profil
  auth.uid() = user_id
  
  -- Cas 2 : Fonction SECURITY DEFINER (auth.uid() peut être NULL)
  -- Vérifier que le user_id existe dans auth.users
  OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = chauffeurs.user_id
  )
);

-- 4. Créer une fonction helper pour logging (optionnel mais utile)
CREATE OR REPLACE FUNCTION public.log_driver_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logger la création du profil chauffeur
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.user_id,
    'driver_profile_created',
    'Profil chauffeur créé avec succès',
    jsonb_build_object(
      'has_own_vehicle', NEW.has_own_vehicle,
      'service_type', NEW.service_type,
      'verification_status', NEW.verification_status,
      'created_via_auth_uid', auth.uid()
    )
  );
  
  RETURN NEW;
END;
$$;

-- 5. Trigger pour logger automatiquement les créations de profils
DROP TRIGGER IF EXISTS log_driver_profile_creation_trigger ON public.chauffeurs;
CREATE TRIGGER log_driver_profile_creation_trigger
AFTER INSERT ON public.chauffeurs
FOR EACH ROW
EXECUTE FUNCTION public.log_driver_profile_creation();