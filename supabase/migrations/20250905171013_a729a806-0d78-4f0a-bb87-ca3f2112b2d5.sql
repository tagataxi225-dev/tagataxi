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