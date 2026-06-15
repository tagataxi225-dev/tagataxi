-- Migration des données partner_profiles vers partenaires (simplifiée)
INSERT INTO public.partenaires (
  user_id,
  company_name,
  phone,
  business_type,
  service_areas,
  is_active,
  created_at,
  updated_at
)
SELECT 
  pp.user_id,
  pp.company_name,
  pp.company_phone,
  'company',
  ARRAY['Kinshasa'],
  CASE WHEN pp.validation_status = 'approved' THEN true ELSE false END,
  pp.created_at,
  pp.updated_at
FROM public.partner_profiles pp
WHERE NOT EXISTS (
  SELECT 1 FROM public.partenaires p WHERE p.user_id = pp.user_id
)
ON CONFLICT (user_id) DO NOTHING;