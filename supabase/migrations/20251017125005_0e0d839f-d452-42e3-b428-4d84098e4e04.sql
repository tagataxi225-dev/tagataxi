-- ============================================================================
-- KWENDA FOOD - PHASE 1 : BASE DE DONNÉES COMPLÈTE + RLS
-- ============================================================================

-- 1. Étendre les types ENUM pour les rôles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'admin_food';

-- ============================================================================
-- 2. TABLE: restaurant_profiles - Profils Restaurants
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations Identité
  restaurant_name TEXT NOT NULL,
  business_name TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Contact
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Adresse
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  commune TEXT,
  quartier TEXT,
  coordinates JSONB, -- {lat, lng}
  
  -- Documents Légaux
  business_registration TEXT,
  tax_number TEXT,
  health_certificate TEXT,
  
  -- Statut Vérification
  verification_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES admins(user_id),
  rejection_reason TEXT,
  
  -- Statistiques
  rating_average NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Abonnement
  subscription_status TEXT DEFAULT 'inactive',
  subscription_id UUID,
  
  -- Horaires & Métadonnées
  opening_hours JSONB,
  cuisine_types TEXT[],
  delivery_zones TEXT[],
  average_preparation_time INTEGER,
  minimum_order_amount NUMERIC DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('inactive', 'active', 'suspended', 'expired'))
);

-- Index pour performance
CREATE INDEX idx_restaurant_profiles_user_id ON public.restaurant_profiles(user_id);
CREATE INDEX idx_restaurant_profiles_verification ON public.restaurant_profiles(verification_status) WHERE verification_status = 'pending';
CREATE INDEX idx_restaurant_profiles_active ON public.restaurant_profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_restaurant_profiles_city ON public.restaurant_profiles(city);

-- Trigger auto-update timestamp
CREATE TRIGGER update_restaurant_profiles_timestamp
  BEFORE UPDATE ON public.restaurant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. TABLE: restaurant_subscription_plans - Plans d'Abonnement
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tarification
  monthly_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  
  -- Limites & Features
  max_products INTEGER,
  max_photos_per_product INTEGER DEFAULT 5,
  commission_rate NUMERIC DEFAULT 10.00,
  features JSONB DEFAULT '[]'::jsonb,
  can_feature_products BOOLEAN DEFAULT false,
  can_run_promotions BOOLEAN DEFAULT false,
  
  -- Priorité
  priority_level INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- Plans par défaut
INSERT INTO public.restaurant_subscription_plans (name, description, monthly_price, max_products, commission_rate, priority_level, is_popular) VALUES
  ('Basic', 'Plan de démarrage pour nouveaux restaurants', 50000, 20, 15.00, 0, false),
  ('Pro', 'Plan professionnel avec plus de visibilité', 120000, 100, 10.00, 1, true),
  ('Premium', 'Plan complet avec tous les avantages', 250000, NULL, 5.00, 2, false)
ON CONFLICT DO NOTHING;

CREATE TRIGGER update_restaurant_subscription_plans_timestamp
  BEFORE UPDATE ON public.restaurant_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. TABLE: restaurant_subscriptions - Abonnements Actifs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.restaurant_subscription_plans(id),
  
  -- Période
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Paiement
  payment_method TEXT NOT NULL,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Grace period
  grace_period_end TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_subscription_status CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('kwenda_pay', 'mobile_money'))
);

CREATE INDEX idx_restaurant_subscriptions_restaurant ON public.restaurant_subscriptions(restaurant_id);
CREATE INDEX idx_restaurant_subscriptions_status ON public.restaurant_subscriptions(status) WHERE status = 'active';
CREATE INDEX idx_restaurant_subscriptions_expiry ON public.restaurant_subscriptions(end_date);

CREATE TRIGGER update_restaurant_subscriptions_timestamp
  BEFORE UPDATE ON public.restaurant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. TABLE: food_products - Plats/Menu Items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE,
  
  -- Informations Produit
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Prix
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  original_price NUMERIC,
  discount_percentage INTEGER DEFAULT 0,
  
  -- Médias
  images TEXT[],
  main_image_url TEXT,
  
  -- Disponibilité
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  preparation_time INTEGER,
  
  -- Modération
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  moderated_by UUID REFERENCES admins(user_id),
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Statistiques
  rating_average NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Options
  ingredients TEXT[],
  allergens TEXT[],
  is_spicy BOOLEAN DEFAULT false,
  spicy_level INTEGER,
  
  -- Métadonnées
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_moderation_status CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_category CHECK (category IN ('Entrées', 'Plats', 'Desserts', 'Boissons', 'Accompagnements')),
  CONSTRAINT valid_price CHECK (price >= 0),
  CONSTRAINT valid_spicy_level CHECK (spicy_level IS NULL OR (spicy_level >= 1 AND spicy_level <= 5))
);

CREATE INDEX idx_food_products_restaurant ON public.food_products(restaurant_id);
CREATE INDEX idx_food_products_category ON public.food_products(category);
CREATE INDEX idx_food_products_moderation ON public.food_products(moderation_status) WHERE moderation_status = 'pending';
CREATE INDEX idx_food_products_available ON public.food_products(is_available) WHERE is_available = true;
CREATE INDEX idx_food_products_featured ON public.food_products(is_featured) WHERE is_featured = true;

CREATE TRIGGER update_food_products_timestamp
  BEFORE UPDATE ON public.food_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. TABLE: food_orders - Commandes Repas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  
  -- Acteurs
  customer_id UUID NOT NULL REFERENCES clients(user_id),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id),
  driver_id UUID REFERENCES chauffeurs(user_id),
  
  -- Détails Commande
  items JSONB NOT NULL,
  
  -- Montants
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  
  -- Livraison
  delivery_address TEXT NOT NULL,
  delivery_coordinates JSONB NOT NULL,
  delivery_phone TEXT NOT NULL,
  delivery_instructions TEXT,
  
  -- Paiement
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Timestamps de progression
  confirmed_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID,
  
  -- Estimation
  estimated_preparation_time INTEGER,
  estimated_delivery_time INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('kwenda_pay', 'cash_on_delivery')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'))
);

-- Fonction pour générer order_number
CREATE OR REPLACE FUNCTION generate_food_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    new_number := 'FD-' || to_char(NOW(), 'YYYY') || '-' || lpad(floor(random() * 999999)::text, 6, '0');
    
    SELECT COUNT(*) INTO exists_check 
    FROM public.food_orders 
    WHERE order_number = new_number;
    
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour auto-générer order_number
CREATE OR REPLACE FUNCTION set_food_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_food_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_food_order_number_trigger
  BEFORE INSERT ON public.food_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_food_order_number();

CREATE INDEX idx_food_orders_customer ON public.food_orders(customer_id);
CREATE INDEX idx_food_orders_restaurant ON public.food_orders(restaurant_id);
CREATE INDEX idx_food_orders_driver ON public.food_orders(driver_id);
CREATE INDEX idx_food_orders_status ON public.food_orders(status);
CREATE INDEX idx_food_orders_created ON public.food_orders(created_at DESC);

CREATE TRIGGER update_food_orders_timestamp
  BEFORE UPDATE ON public.food_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. TABLE: food_order_ratings - Avis Commandes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_order_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.food_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES clients(user_id),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id),
  
  -- Notes (1-5)
  food_rating INTEGER NOT NULL,
  delivery_rating INTEGER,
  overall_rating INTEGER NOT NULL,
  
  -- Commentaires
  comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(order_id, customer_id),
  CONSTRAINT valid_food_rating CHECK (food_rating >= 1 AND food_rating <= 5),
  CONSTRAINT valid_delivery_rating CHECK (delivery_rating IS NULL OR (delivery_rating >= 1 AND delivery_rating <= 5)),
  CONSTRAINT valid_overall_rating CHECK (overall_rating >= 1 AND overall_rating <= 5)
);

CREATE INDEX idx_food_order_ratings_restaurant ON public.food_order_ratings(restaurant_id);
CREATE INDEX idx_food_order_ratings_customer ON public.food_order_ratings(customer_id);

-- Trigger pour mettre à jour les notes restaurant
CREATE OR REPLACE FUNCTION update_restaurant_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_avg NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  SELECT 
    ROUND(AVG(overall_rating)::numeric, 2),
    COUNT(*)::integer
  INTO v_avg, v_count
  FROM public.food_order_ratings
  WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  
  UPDATE public.restaurant_profiles
  SET 
    rating_average = COALESCE(v_avg, 0.00),
    rating_count = COALESCE(v_count, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_restaurant_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.food_order_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_rating_stats();

-- ============================================================================
-- 8. TABLE: restaurant_audit_logs - Logs d'Audit
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurant_audit_logs_restaurant ON public.restaurant_audit_logs(restaurant_id);
CREATE INDEX idx_restaurant_audit_logs_created ON public.restaurant_audit_logs(created_at DESC);

-- ============================================================================
-- 9. FONCTIONS DE SÉCURITÉ
-- ============================================================================

-- Fonction pour vérifier si un utilisateur est propriétaire d'un restaurant
CREATE OR REPLACE FUNCTION is_restaurant_owner(p_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_profiles
    WHERE id = p_restaurant_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier si un restaurant a un abonnement actif
CREATE OR REPLACE FUNCTION has_active_subscription(p_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_subscriptions
    WHERE restaurant_id = p_restaurant_id
      AND status = 'active'
      AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier admin food
CREATE OR REPLACE FUNCTION is_admin_food()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND admin_role IN ('super_admin', 'admin_food')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 10. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- ========== restaurant_profiles ==========
ALTER TABLE public.restaurant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants manage own profile"
  ON public.restaurant_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read approved restaurants"
  ON public.restaurant_profiles
  FOR SELECT
  USING (verification_status = 'approved' AND is_active = true);

CREATE POLICY "Admins full access restaurants"
  ON public.restaurant_profiles
  FOR ALL
  USING (is_admin_food());

-- ========== restaurant_subscription_plans ==========
ALTER TABLE public.restaurant_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active plans"
  ON public.restaurant_subscription_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage plans"
  ON public.restaurant_subscription_plans
  FOR ALL
  USING (is_admin_food());

-- ========== restaurant_subscriptions ==========
ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants view own subscriptions"
  ON public.restaurant_subscriptions
  FOR SELECT
  USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Restaurants create own subscriptions"
  ON public.restaurant_subscriptions
  FOR INSERT
  WITH CHECK (is_restaurant_owner(restaurant_id));

CREATE POLICY "Admins manage all subscriptions"
  ON public.restaurant_subscriptions
  FOR ALL
  USING (is_admin_food());

-- ========== food_products ==========
ALTER TABLE public.food_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants manage own products"
  ON public.food_products
  FOR ALL
  USING (is_restaurant_owner(restaurant_id))
  WITH CHECK (is_restaurant_owner(restaurant_id));

CREATE POLICY "Public read approved products"
  ON public.food_products
  FOR SELECT
  USING (
    moderation_status = 'approved' 
    AND is_available = true
    AND EXISTS (
      SELECT 1 FROM public.restaurant_profiles rp
      WHERE rp.id = food_products.restaurant_id
        AND rp.is_active = true
        AND rp.verification_status = 'approved'
    )
  );

CREATE POLICY "Admins moderate products"
  ON public.food_products
  FOR ALL
  USING (is_admin_food());

-- ========== food_orders ==========
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own orders"
  ON public.food_orders
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers create orders"
  ON public.food_orders
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Restaurants view their orders"
  ON public.food_orders
  FOR SELECT
  USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Restaurants update their orders"
  ON public.food_orders
  FOR UPDATE
  USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Drivers view assigned orders"
  ON public.food_orders
  FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers update assigned orders"
  ON public.food_orders
  FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE POLICY "Admins full access orders"
  ON public.food_orders
  FOR ALL
  USING (is_admin_food());

-- ========== food_order_ratings ==========
ALTER TABLE public.food_order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers create ratings"
  ON public.food_order_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers view own ratings"
  ON public.food_order_ratings
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Restaurants view their ratings"
  ON public.food_order_ratings
  FOR SELECT
  USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Public read all ratings"
  ON public.food_order_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage ratings"
  ON public.food_order_ratings
  FOR ALL
  USING (is_admin_food());

-- ========== restaurant_audit_logs ==========
ALTER TABLE public.restaurant_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants view own audit logs"
  ON public.restaurant_audit_logs
  FOR SELECT
  USING (is_restaurant_owner(restaurant_id));

CREATE POLICY "Admins view all audit logs"
  ON public.restaurant_audit_logs
  FOR ALL
  USING (is_admin_food());

-- ============================================================================
-- 11. REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_subscriptions;