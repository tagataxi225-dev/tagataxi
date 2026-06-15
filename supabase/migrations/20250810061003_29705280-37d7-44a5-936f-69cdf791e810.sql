-- Création des tables pour la gestion admin de location

-- Table des catégories de véhicules
CREATE TABLE public.vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Car',
  color_class TEXT DEFAULT 'text-blue-600',
  base_price NUMERIC DEFAULT 0,
  recommended_price_range JSONB DEFAULT '{"min": 0, "max": 0}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des plans d'abonnement pour location
CREATE TABLE public.rental_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  vehicle_categories JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des abonnements des partenaires
CREATE TABLE public.partner_rental_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.rental_subscription_plans(id),
  vehicle_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_rental_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour vehicle_categories
CREATE POLICY "Everyone can view active categories" ON public.vehicle_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.vehicle_categories
  FOR ALL USING (has_permission(auth.uid(), 'transport_admin'::permission));

-- Policies pour rental_subscription_plans
CREATE POLICY "Everyone can view active plans" ON public.rental_subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.rental_subscription_plans
  FOR ALL USING (has_permission(auth.uid(), 'transport_admin'::permission));

-- Policies pour partner_rental_subscriptions
CREATE POLICY "Partners can view their subscriptions" ON public.partner_rental_subscriptions
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create subscriptions" ON public.partner_rental_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their subscriptions" ON public.partner_rental_subscriptions
  FOR UPDATE USING (auth.uid() = partner_id);

CREATE POLICY "Admins can view all subscriptions" ON public.partner_rental_subscriptions
  FOR SELECT USING (has_permission(auth.uid(), 'transport_admin'::permission));

-- Trigger pour updated_at
CREATE TRIGGER update_vehicle_categories_updated_at
  BEFORE UPDATE ON public.vehicle_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_subscription_plans_updated_at
  BEFORE UPDATE ON public.rental_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_rental_subscriptions_updated_at
  BEFORE UPDATE ON public.partner_rental_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer quelques catégories par défaut
INSERT INTO public.vehicle_categories (name, description, icon_name, color_class, base_price, recommended_price_range, sort_order) VALUES
('ECO', 'Véhicules économiques et écologiques', 'Car', 'text-green-600', 30000, '{"min": 25000, "max": 40000}', 1),
('PREMIUM', 'Véhicules haut de gamme avec confort supérieur', 'Car', 'text-purple-600', 60000, '{"min": 50000, "max": 80000}', 2),
('FIRST CLASS', 'Véhicules de luxe avec service VIP', 'Car', 'text-yellow-600', 100000, '{"min": 80000, "max": 150000}', 3),
('UTILITAIRES', 'Véhicules utilitaires pour transport de marchandises', 'Truck', 'text-blue-600', 45000, '{"min": 35000, "max": 60000}', 4);

-- Insérer quelques plans d'abonnement par défaut
INSERT INTO public.rental_subscription_plans (name, description, price, duration_days, features, vehicle_categories) VALUES
('Plan Starter', 'Plan de base pour commencer', 15000, 30, '["Publication de véhicule", "Photos standard", "Support par email"]', '["ECO"]'),
('Plan Business', 'Plan pour partenaires actifs', 35000, 30, '["Publication illimitée", "Photos HD", "Support prioritaire", "Statistiques avancées"]', '["ECO", "PREMIUM"]'),
('Plan Enterprise', 'Plan pour grandes flottes', 75000, 30, '["Tout inclus", "Gestion multi-véhicules", "Support 24/7", "API dédiée", "Manager personnel"]', '["ECO", "PREMIUM", "FIRST CLASS", "UTILITAIRES"]');