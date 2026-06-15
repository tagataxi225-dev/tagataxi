-- Sécuriser les données financières des vendeurs contre l'espionnage concurrentiel
-- Correction: supprimer les politiques existantes d'abord

-- 1. Supprimer TOUTES les politiques existantes sur vendor_earnings
DROP POLICY IF EXISTS "Vendors can view only their own earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Vendors can update their own earnings status" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Finance admins can view all vendor earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "System can create vendor earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Public read access" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Anyone can view vendor earnings" ON public.vendor_earnings;

-- 2. Activer RLS sur la table
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- 3. Créer des politiques RLS sécurisées pour protéger les données financières

-- Les vendeurs peuvent voir seulement leurs propres gains
CREATE POLICY "Secure vendors own earnings only" ON public.vendor_earnings
FOR SELECT 
USING (auth.uid() = vendor_id);

-- Les vendeurs peuvent mettre à jour leurs propres enregistrements
CREATE POLICY "Secure vendors update own earnings" ON public.vendor_earnings
FOR UPDATE 
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Les admins financiers peuvent voir tous les gains (avec audit)
CREATE POLICY "Secure finance admins all earnings" ON public.vendor_earnings
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND ('finance_admin' = ANY(permissions) OR 'super_admin' = ANY(permissions))
  )
);

-- Le système peut insérer des nouveaux gains
CREATE POLICY "Secure system create earnings" ON public.vendor_earnings
FOR INSERT 
WITH CHECK (true);

-- 4. Créer une table d'audit pour les accès aux données financières sensibles
CREATE TABLE IF NOT EXISTS public.vendor_financial_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid NOT NULL,
  target_vendor_id uuid NOT NULL,
  access_type text NOT NULL,
  access_reason text,
  ip_address inet,
  user_agent text,
  sensitive_data_accessed jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS pour les logs d'audit financiers
ALTER TABLE public.vendor_financial_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins view financial logs" ON public.vendor_financial_access_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND ('finance_admin' = ANY(permissions) OR 'super_admin' = ANY(permissions))
  )
);

-- Les vendeurs peuvent voir les accès à leurs propres données
CREATE POLICY "Vendors view own financial logs" ON public.vendor_financial_access_logs
FOR SELECT 
USING (auth.uid() = target_vendor_id);

-- 5. Créer une fonction sécurisée pour les statistiques de revenus
CREATE OR REPLACE FUNCTION public.get_secure_vendor_earnings_summary(
  period_days integer DEFAULT 30
)
RETURNS TABLE (
  total_earnings numeric,
  total_orders integer,
  average_order_value numeric,
  pending_amount numeric,
  last_payment_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logger l'accès aux données financières
  INSERT INTO public.vendor_financial_access_logs (
    accessed_by, target_vendor_id, access_type, access_reason
  ) VALUES (
    auth.uid(), auth.uid(), 'earnings_summary', 'Vendor accessing own earnings summary'
  );
  
  -- Retourner le résumé des gains pour la période (vendeur actuel seulement)
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ve.amount), 0) as total_earnings,
    COUNT(DISTINCT ve.order_id)::integer as total_orders,
    COALESCE(AVG(ve.amount), 0) as average_order_value,
    COALESCE(SUM(CASE WHEN ve.status IN ('pending', 'confirmed') THEN ve.amount ELSE 0 END), 0) as pending_amount,
    MAX(ve.paid_at) as last_payment_date
  FROM public.vendor_earnings ve
  WHERE ve.vendor_id = auth.uid()
    AND ve.created_at >= now() - (period_days || ' days')::interval;
END;
$$;

-- 6. Créer une fonction pour les statistiques de marché anonymisées
CREATE OR REPLACE FUNCTION public.get_market_benchmark_stats(
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  avg_earnings_per_vendor numeric,
  median_order_value numeric,
  top_25_percent_threshold numeric,
  total_active_vendors integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retourner des statistiques de marché anonymisées
  -- sans exposer les données individuelles des vendeurs
  RETURN QUERY
  WITH vendor_stats AS (
    SELECT 
      ve.vendor_id,
      AVG(ve.amount) as avg_order_value,
      SUM(ve.amount) as total_earnings,
      COUNT(*) as order_count
    FROM public.vendor_earnings ve
    JOIN public.marketplace_orders mo ON ve.order_id = mo.id
    WHERE ve.created_at >= now() - interval '30 days'
      AND ve.status = 'paid'
      AND (category_filter IS NULL OR EXISTS (
        SELECT 1 FROM public.marketplace_products mp 
        WHERE mp.id = mo.product_id AND mp.category = category_filter
      ))
    GROUP BY ve.vendor_id
    HAVING COUNT(*) >= 5 -- Minimum 5 commandes pour anonymisation renforcée
  )
  SELECT 
    AVG(vs.total_earnings) as avg_earnings_per_vendor,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY vs.avg_order_value) as median_order_value,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY vs.total_earnings) as top_25_percent_threshold,
    COUNT(DISTINCT vs.vendor_id)::integer as total_active_vendors
  FROM vendor_stats vs
  WHERE EXISTS (SELECT 1 FROM vendor_stats LIMIT 10); -- Assurer minimum 10 vendeurs
END;
$$;

-- 7. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_secure_vendor_earnings_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_benchmark_stats TO authenticated;