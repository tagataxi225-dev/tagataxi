
-- FIX CRITIQUE : Permettre la lecture publique des pricing_rules actifs
-- Les tarifs sont des informations publiques que tous les utilisateurs doivent voir

-- Supprimer l'ancienne policy restrictive si elle existe
DROP POLICY IF EXISTS "pricing_rules_admin_access_admin_access" ON public.pricing_rules;

-- Policy 1 : Lecture publique des pricing_rules actifs (CRITIQUE pour l'app)
CREATE POLICY "pricing_rules_public_read"
ON public.pricing_rules
FOR SELECT
TO public
USING (is_active = true);

-- Policy 2 : CRUD complet pour les admins uniquement
CREATE POLICY "pricing_rules_admin_full_access"
ON public.pricing_rules
FOR ALL
TO public
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Vérification : Tester que les données sont maintenant lisibles
COMMENT ON POLICY "pricing_rules_public_read" ON public.pricing_rules IS 
'Permet à tous les utilisateurs (clients, chauffeurs) de lire les tarifs actifs - Information publique essentielle';
