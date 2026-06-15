-- Créer la table pour les récompenses utilisateur
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'discount', 'free_delivery', 'gift')),
  reward_value NUMERIC NOT NULL DEFAULT 0,
  points_required INTEGER DEFAULT NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  promo_code_id UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les points de fidélité
CREATE TABLE public.user_loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_points INTEGER NOT NULL DEFAULT 0,
  total_earned_points INTEGER NOT NULL DEFAULT 0,
  total_spent_points INTEGER NOT NULL DEFAULT 0,
  loyalty_level TEXT NOT NULL DEFAULT 'Bronze' CHECK (loyalty_level IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_points ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" 
ON public.user_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all rewards" 
ON public.user_rewards 
FOR ALL 
USING (is_current_user_admin());

-- Politiques RLS pour user_loyalty_points
CREATE POLICY "Users can view their own loyalty points" 
ON public.user_loyalty_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty points" 
ON public.user_loyalty_points 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all loyalty points" 
ON public.user_loyalty_points 
FOR ALL 
USING (is_current_user_admin());

-- Fonction pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION public.update_user_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_user_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers pour les timestamps
CREATE TRIGGER update_user_rewards_updated_at
BEFORE UPDATE ON public.user_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_user_rewards_updated_at();

CREATE TRIGGER update_user_loyalty_points_updated_at
BEFORE UPDATE ON public.user_loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_user_loyalty_points_updated_at();

-- Insérer des codes de parrainage de démonstration
INSERT INTO public.referral_system (user_id, code, status, bonus_amount) VALUES
  ('00000000-0000-0000-0000-000000000001', 'KWENDA2024', 'active', 5000),
  ('00000000-0000-0000-0000-000000000002', 'WELCOME50', 'active', 3000),
  ('00000000-0000-0000-0000-000000000003', 'FRIEND25', 'active', 2500)
ON CONFLICT (code) DO NOTHING;

-- Insérer quelques récompenses de démonstration
INSERT INTO public.user_rewards (user_id, title, description, reward_type, reward_value, points_required) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Réduction Bienvenue', '20% de réduction sur votre première course', 'discount', 20, NULL),
  ('00000000-0000-0000-0000-000000000001', 'Livraison Gratuite', 'Livraison gratuite pour votre prochaine commande', 'free_delivery', 1, 100),
  ('00000000-0000-0000-0000-000000000001', 'Bonus Fidélité', 'Bon de 10000 CDF à utiliser', 'gift', 10000, 250)
ON CONFLICT DO NOTHING;

-- Insérer des points de fidélité de démonstration
INSERT INTO public.user_loyalty_points (user_id, current_points, total_earned_points, loyalty_level) VALUES
  ('00000000-0000-0000-0000-000000000001', 150, 300, 'Silver'),
  ('00000000-0000-0000-0000-000000000002', 50, 50, 'Bronze'),
  ('00000000-0000-0000-0000-000000000003', 800, 1200, 'Gold')
ON CONFLICT (user_id) DO UPDATE SET
  current_points = EXCLUDED.current_points,
  total_earned_points = EXCLUDED.total_earned_points,
  loyalty_level = EXCLUDED.loyalty_level;

-- Fonction pour calculer et mettre à jour automatiquement les points de fidélité
CREATE OR REPLACE FUNCTION public.calculate_user_loyalty_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  total_orders INTEGER := 0;
  total_spent NUMERIC := 0;
  calculated_points INTEGER := 0;
  loyalty_level TEXT := 'Bronze';
  points_record RECORD;
BEGIN
  -- Calculer les statistiques utilisateur
  SELECT 
    COUNT(*) as order_count,
    COALESCE(SUM(actual_price), 0) as total_amount
  INTO total_orders, total_spent
  FROM public.transport_bookings
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Ajouter les commandes de livraison
  SELECT 
    COUNT(*) + total_orders as order_count,
    COALESCE(SUM(actual_price), 0) + total_spent as total_amount
  INTO total_orders, total_spent
  FROM public.delivery_orders
  WHERE user_id = p_user_id AND status = 'delivered';
  
  -- Calculer les points (10 points par 1000 CDF + 50 points par commande)
  calculated_points := FLOOR(total_spent / 1000) * 10 + total_orders * 50;
  
  -- Déterminer le niveau de fidélité
  IF calculated_points >= 1000 THEN loyalty_level := 'Platinum';
  ELSIF calculated_points >= 500 THEN loyalty_level := 'Gold';
  ELSIF calculated_points >= 200 THEN loyalty_level := 'Silver';
  ELSE loyalty_level := 'Bronze';
  END IF;
  
  -- Insérer ou mettre à jour les points
  INSERT INTO public.user_loyalty_points (
    user_id, current_points, total_earned_points, loyalty_level
  ) VALUES (
    p_user_id, calculated_points, calculated_points, loyalty_level
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_points = EXCLUDED.current_points,
    total_earned_points = EXCLUDED.total_earned_points,
    loyalty_level = EXCLUDED.loyalty_level,
    updated_at = now();
  
  -- Récupérer les données mises à jour
  SELECT * INTO points_record
  FROM public.user_loyalty_points
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'current_points', points_record.current_points,
    'total_earned_points', points_record.total_earned_points,
    'loyalty_level', points_record.loyalty_level,
    'total_orders', total_orders,
    'total_spent', total_spent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;