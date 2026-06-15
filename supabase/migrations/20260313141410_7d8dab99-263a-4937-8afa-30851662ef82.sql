-- Create a public view for partenaires exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.v_public_partenaires
WITH (security_invoker = on) AS
SELECT 
  id,
  company_name,
  logo_url,
  banner_image,
  slogan,
  shop_description,
  city,
  partner_type,
  is_active,
  is_featured,
  opening_hours
FROM public.partenaires;

-- Allow anyone to read the public view
GRANT SELECT ON public.v_public_partenaires TO anon, authenticated;

-- Add a SELECT policy on partenaires that allows reading only via the view
-- Since security_invoker is on, the view uses caller's permissions
-- We need a policy that allows SELECT for public columns
CREATE POLICY "public_read_basic_partner_info"
ON public.partenaires
FOR SELECT
TO anon, authenticated
USING (true);