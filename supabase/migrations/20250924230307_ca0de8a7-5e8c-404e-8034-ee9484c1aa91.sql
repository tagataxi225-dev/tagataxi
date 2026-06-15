-- CORRECTION SÉCURITÉ - Syntaxe PostgreSQL corrigée
-- Corriger les politiques RLS avec la bonne syntaxe

-- Politique pour driver_online_status_table avec syntaxe correcte
DROP POLICY IF EXISTS "driver_status_admin_write" ON public.driver_online_status_table;
CREATE POLICY "driver_status_admin_write" ON public.driver_online_status_table
FOR ALL USING (is_current_user_admin());