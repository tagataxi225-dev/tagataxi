
-- Restaurer une policy SELECT publique restrictive pour les partenaires actifs
CREATE POLICY "partenaires_public_read_safe"
ON public.partenaires
FOR SELECT
USING (is_active = true);

-- Recréer la vue avec logo_url
DROP VIEW IF EXISTS public.partenaires_public_listing;
CREATE VIEW public.partenaires_public_listing
WITH (security_invoker = on)
AS SELECT
  id, company_name, city, logo_url, banner_image,
  shop_description, is_active, created_at
FROM public.partenaires
WHERE is_active = true;
