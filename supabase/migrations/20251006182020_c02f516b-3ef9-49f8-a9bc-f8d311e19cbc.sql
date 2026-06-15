-- ============================================
-- PHASE 1 : Table seller_profiles avec badges
-- ============================================

CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  seller_badge_level TEXT DEFAULT 'bronze' CHECK (seller_badge_level IN ('bronze', 'silver', 'gold', 'verified')),
  total_sales INTEGER DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  verified_seller BOOLEAN DEFAULT FALSE,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_seller_profiles_user_id ON public.seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_verified ON public.seller_profiles(verified_seller);
CREATE INDEX idx_seller_profiles_badge_level ON public.seller_profiles(seller_badge_level);

-- RLS Policies
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sellers"
  ON public.seller_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users manage own seller profile"
  ON public.seller_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all seller profiles"
  ON public.seller_profiles FOR ALL
  USING (is_current_user_admin());

-- ============================================
-- PHASE 2 : Fonction de mise à jour automatique du badge
-- ============================================

CREATE OR REPLACE FUNCTION public.update_seller_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE seller_profiles
  SET 
    total_sales = (
      SELECT COUNT(*)
      FROM marketplace_orders
      WHERE seller_id = NEW.seller_id AND status = 'delivered'
    ),
    seller_badge_level = CASE
      WHEN (SELECT COUNT(*) FROM marketplace_orders WHERE seller_id = NEW.seller_id AND status = 'delivered') >= 100 THEN 'gold'
      WHEN (SELECT COUNT(*) FROM marketplace_orders WHERE seller_id = NEW.seller_id AND status = 'delivered') >= 50 THEN 'silver'
      ELSE 'bronze'
    END,
    updated_at = NOW()
  WHERE user_id = NEW.seller_id;
  
  RETURN NEW;
END;
$$;

-- Trigger sur marketplace_orders pour mise à jour automatique
CREATE TRIGGER update_seller_badge_on_sale
  AFTER UPDATE OF status ON public.marketplace_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
  EXECUTE FUNCTION public.update_seller_badge();

-- ============================================
-- PHASE 3 : Trigger pour créer automatiquement un seller_profile
-- ============================================

CREATE OR REPLACE FUNCTION public.create_seller_profile_on_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- Vérifier si le seller_profile existe déjà
  IF NOT EXISTS (SELECT 1 FROM seller_profiles WHERE user_id = NEW.seller_id) THEN
    -- Récupérer le nom depuis clients ou profiles
    SELECT display_name INTO v_display_name
    FROM clients
    WHERE user_id = NEW.seller_id
    LIMIT 1;
    
    IF v_display_name IS NULL THEN
      SELECT display_name INTO v_display_name
      FROM profiles
      WHERE id = NEW.seller_id
      LIMIT 1;
    END IF;
    
    -- Créer le seller_profile
    INSERT INTO seller_profiles (user_id, display_name)
    VALUES (NEW.seller_id, COALESCE(v_display_name, 'Vendeur'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_seller_profile_on_new_product
  AFTER INSERT ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_seller_profile_on_product();

-- ============================================
-- PHASE 4 : Migration des vendeurs existants
-- ============================================

INSERT INTO public.seller_profiles (user_id, display_name, total_sales, verified_seller)
SELECT DISTINCT 
  mp.seller_id,
  COALESCE(c.display_name, p.display_name, 'Vendeur'),
  COALESCE(COUNT(DISTINCT mo.id) FILTER (WHERE mo.status = 'delivered'), 0),
  FALSE
FROM marketplace_products mp
LEFT JOIN clients c ON c.user_id = mp.seller_id
LEFT JOIN profiles p ON p.id = mp.seller_id
LEFT JOIN marketplace_orders mo ON mo.seller_id = mp.seller_id
GROUP BY mp.seller_id, c.display_name, p.display_name
ON CONFLICT (user_id) DO UPDATE SET
  total_sales = EXCLUDED.total_sales,
  updated_at = NOW();

-- Mettre à jour les badges initiaux basés sur les ventes
UPDATE public.seller_profiles
SET seller_badge_level = CASE
  WHEN total_sales >= 100 THEN 'gold'
  WHEN total_sales >= 50 THEN 'silver'
  ELSE 'bronze'
END;

-- ============================================
-- PHASE 5 : Fonction admin pour vérifier un vendeur
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_seller(p_user_id UUID, p_verified BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: Admin privileges required');
  END IF;

  -- Mettre à jour le statut de vérification
  UPDATE seller_profiles
  SET 
    verified_seller = p_verified,
    seller_badge_level = CASE WHEN p_verified THEN 'verified' ELSE seller_badge_level END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller profile not found');
  END IF;

  -- Logger l'action
  PERFORM log_system_activity(
    'seller_verification',
    format('Seller %s verification status changed to %s', p_user_id, p_verified),
    jsonb_build_object('seller_id', p_user_id, 'verified', p_verified)
  );

  RETURN jsonb_build_object('success', true, 'verified', p_verified);
END;
$$;