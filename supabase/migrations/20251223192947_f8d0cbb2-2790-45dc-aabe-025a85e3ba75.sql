-- Phase 2: Renforcement sécurité RLS

-- 2.1 - Supprimer la policy profiles_public_read qui expose les données utilisateurs
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- 2.2 - Supprimer la policy commission_settings_public_read qui expose les taux de commission
DROP POLICY IF EXISTS "commission_settings_public_read" ON public.commission_settings;

-- 2.3 - Corriger la policy heatmap_clicks pour n'autoriser que les insertions par l'utilisateur authentifié
DROP POLICY IF EXISTS "Users create own clicks" ON public.heatmap_clicks;
CREATE POLICY "Users create own clicks" ON public.heatmap_clicks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);