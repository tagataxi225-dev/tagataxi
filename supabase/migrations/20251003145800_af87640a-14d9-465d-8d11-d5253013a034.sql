-- Créer une vue unifiée pour tous les profils utilisateurs avec un nom différent
CREATE OR REPLACE VIEW public.user_profiles_view AS
SELECT 
  c.user_id,
  c.id,
  c.display_name,
  c.email,
  c.phone_number,
  'client'::text as user_type,
  c.created_at,
  c.updated_at,
  c.is_active,
  NULL::text as verification_status,
  NULL::text as admin_level
FROM public.clients c
UNION ALL
SELECT 
  ch.user_id,
  ch.id,
  ch.display_name,
  ch.email,
  ch.phone_number,
  'driver'::text as user_type,
  ch.created_at,
  ch.updated_at,
  ch.is_active,
  ch.verification_status,
  NULL::text as admin_level
FROM public.chauffeurs ch
UNION ALL
SELECT 
  p.user_id,
  p.id,
  p.display_name,
  p.email,
  p.phone_number,
  'partner'::text as user_type,
  p.created_at,
  p.updated_at,
  p.is_active,
  p.verification_status,
  NULL::text as admin_level
FROM public.partenaires p
UNION ALL
SELECT 
  a.user_id,
  a.id,
  a.display_name,
  a.email,
  a.phone_number,
  'admin'::text as user_type,
  a.created_at,
  a.updated_at,
  a.is_active,
  NULL::text as verification_status,
  a.admin_level
FROM public.admins a;