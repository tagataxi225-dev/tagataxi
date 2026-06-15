-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('transport', 'delivery')),
  vehicle_class TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  price_per_km NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Deactivate duplicate active rules, keep the most recent active one per pair
WITH ranked AS (
  SELECT id, service_type, vehicle_class, is_active, created_at,
         ROW_NUMBER() OVER (PARTITION BY service_type, vehicle_class ORDER BY is_active DESC, created_at DESC) rn
  FROM public.pricing_rules
)
UPDATE public.pricing_rules pr
SET is_active = false
FROM ranked r
WHERE pr.id = r.id AND r.rn > 1 AND pr.is_active = true;

-- Create the unique partial index now that duplicates are resolved
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_pricing_rule
ON public.pricing_rules (service_type, vehicle_class)
WHERE is_active = true;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policies (drop/create)
DROP POLICY IF EXISTS "Everyone can view active pricing rules" ON public.pricing_rules;
CREATE POLICY "Everyone can view active pricing rules" ON public.pricing_rules FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can insert pricing rules" ON public.pricing_rules;
CREATE POLICY "Admins can insert pricing rules" ON public.pricing_rules FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.get_user_roles(auth.uid()) gr WHERE gr.admin_role IS NOT NULL));

DROP POLICY IF EXISTS "Admins can update pricing rules" ON public.pricing_rules;
CREATE POLICY "Admins can update pricing rules" ON public.pricing_rules FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.get_user_roles(auth.uid()) gr WHERE gr.admin_role IS NOT NULL));

DROP POLICY IF EXISTS "Admins can delete pricing rules" ON public.pricing_rules;
CREATE POLICY "Admins can delete pricing rules" ON public.pricing_rules FOR DELETE
USING (EXISTS (SELECT 1 FROM public.get_user_roles(auth.uid()) gr WHERE gr.admin_role IS NOT NULL));

-- Seed initial pricing rules (only if not exists active)
INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'transport', 'eco', 2500, 1500
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='transport' AND vehicle_class='eco' AND is_active=true);

INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'transport', 'premium', 3200, 1800
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='transport' AND vehicle_class='premium' AND is_active=true);

INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'transport', 'first_class', 4300, 2300
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='transport' AND vehicle_class='first_class' AND is_active=true);

INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'transport', 'standard', 2500, 1500
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='transport' AND vehicle_class='standard' AND is_active=true);

INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'delivery', 'flash', 5000, 1000
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='delivery' AND vehicle_class='flash' AND is_active=true);

INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'delivery', 'flex', 55000, 2500
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='delivery' AND vehicle_class='flex' AND is_active=true);

INSERT INTO public.pricing_rules (service_type, vehicle_class, base_price, price_per_km)
SELECT 'delivery', 'maxicharge', 100000, 5000
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE service_type='delivery' AND vehicle_class='maxicharge' AND is_active=true);
