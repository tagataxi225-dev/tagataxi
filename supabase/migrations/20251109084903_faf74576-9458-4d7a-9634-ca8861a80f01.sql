-- Vue sécurisée corrigée avec les bons noms de colonnes
DROP VIEW IF EXISTS public.user_profiles_unified CASCADE;
DROP VIEW IF EXISTS public.user_profiles_safe CASCADE;

CREATE OR REPLACE VIEW public.user_profiles_safe AS
SELECT 
  c.user_id,
  c.display_name as name,
  c.email,
  'client' as role,
  c.is_active
FROM public.clients c
UNION ALL
SELECT 
  p.user_id,
  p.company_name as name,
  p.email,
  'partner' as role,
  p.is_active
FROM public.partenaires p
UNION ALL
SELECT 
  dp.user_id,
  COALESCE(prof.display_name, 'Driver') as name,
  '' as email,
  'driver' as role,
  dp.is_active
FROM public.driver_profiles dp
LEFT JOIN public.profiles prof ON prof.user_id = dp.user_id;

GRANT SELECT ON public.user_profiles_safe TO authenticated;