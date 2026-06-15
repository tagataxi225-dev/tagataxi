-- ==========================================
-- MIGRATION VENDOR SUBSCRIPTION COMPLETE V4
-- Correction contrainte duration_type
-- ==========================================

-- 1. Créer vendor_active_subscriptions
CREATE TABLE IF NOT EXISTS public.vendor_active_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.vendor_subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  payment_method TEXT NOT NULL DEFAULT 'free',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_vendor_subscription UNIQUE (vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_active_subs_vendor ON public.vendor_active_subscriptions(vendor_id);
ALTER TABLE public.vendor_active_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_view_own_subscription" ON public.vendor_active_subscriptions;
DROP POLICY IF EXISTS "admin_manage_subscriptions" ON public.vendor_active_subscriptions;

CREATE POLICY "vendor_view_own_subscription" ON public.vendor_active_subscriptions
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "admin_manage_subscriptions" ON public.vendor_active_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::user_role AND is_active = true
    )
  );

-- 2. Ajouter colonnes manquantes à vendor_subscription_plans
ALTER TABLE public.vendor_subscription_plans
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS priority_support BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN DEFAULT false;

-- 3. Insérer les 3 plans avec duration_type VALIDE
INSERT INTO public.vendor_subscription_plans (
  name, name_en, description, price, currency, duration_days, duration_type,
  max_products, commission_rate, priority_support, analytics_enabled, 
  verified_badge, features, is_active, is_popular
)
SELECT 
  'Gratuit', 'Free', 'Parfait pour débuter', 
  0, 'CDF', 365, 'yearly', 
  10, 10.00, false, false, false, 
  '["10 produits maximum", "Commission 10%", "Support standard"]'::jsonb,
  true, false
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_subscription_plans WHERE name = 'Gratuit'
)

UNION ALL

SELECT 
  'Standard', 'Standard', 'Pour vendeurs réguliers', 
  5000, 'CDF', 30, 'monthly', 
  50, 8.00, false, true, false, 
  '["50 produits", "Analytics avancées", "Commission 8%", "Support prioritaire"]'::jsonb,
  true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_subscription_plans WHERE name = 'Standard'
)

UNION ALL

SELECT 
  'Premium', 'Premium', 'Pour professionnels', 
  15000, 'CDF', 30, 'monthly', 
  -1, 5.00, true, true, true, 
  '["Produits illimités", "Support VIP 24/7", "Badge vérifié", "Commission 5%", "Analytics complètes"]'::jsonb,
  true, false
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_subscription_plans WHERE name = 'Premium'
);

-- 4. Auto-assigner plan gratuit aux vendeurs existants
INSERT INTO public.vendor_active_subscriptions (vendor_id, plan_id, status, payment_method, start_date, end_date, auto_renew)
SELECT 
  vp.user_id,
  (SELECT id FROM public.vendor_subscription_plans WHERE price = 0 LIMIT 1),
  'active',
  'free',
  NOW(),
  NOW() + INTERVAL '365 days',
  true
FROM public.vendor_profiles vp
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_active_subscriptions WHERE vendor_id = vp.user_id
)
ON CONFLICT (vendor_id) DO NOTHING;

-- 5. Ajouter buyer_phone à marketplace_orders
ALTER TABLE public.marketplace_orders 
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

-- 6. RLS policies pour marketplace_orders
DROP POLICY IF EXISTS "vendor_view_own_orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "vendor_update_own_orders" ON public.marketplace_orders;

CREATE POLICY "vendor_view_own_orders" ON public.marketplace_orders
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "vendor_update_own_orders" ON public.marketplace_orders
  FOR UPDATE USING (auth.uid() = seller_id);