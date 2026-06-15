-- Cap partner commission at 2.5% and set defaults
-- 1) Normalize existing data
UPDATE public.partner_drivers SET commission_rate = 2.5 WHERE commission_rate > 2.5;
UPDATE public.partner_drivers SET commission_rate = 0 WHERE commission_rate < 0;

-- 2) Set sensible default
ALTER TABLE public.partner_drivers ALTER COLUMN commission_rate SET DEFAULT 2.5;

-- 3) Add range constraint (idempotent-safe)
ALTER TABLE public.partner_drivers DROP CONSTRAINT IF EXISTS partner_drivers_commission_rate_range;
ALTER TABLE public.partner_drivers
  ADD CONSTRAINT partner_drivers_commission_rate_range
  CHECK (commission_rate >= 0 AND commission_rate <= 2.5);
