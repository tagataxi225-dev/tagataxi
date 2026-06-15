-- Sécuriser les données financières des vendeurs contre l'espionnage concurrentiel

-- 1. Vérifier si la table vendor_earnings existe et l'activer RLS si nécessaire
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer toute politique publique dangereuse existante
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Public read access" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Anyone can view vendor earnings" ON public.vendor_earnings;

-- 3. Créer des politiques RLS sécurisées pour protéger les données financières

-- Les vendeurs peuvent voir seulement leurs propres gains
CREATE POLICY "Vendors can view only their own earnings" ON public.vendor_earnings
FOR SELECT 
USING (auth.uid() = vendor_id);

-- Les vendeurs peuvent mettre à jour leurs propres enregistrements (pour confirmer réception)
CREATE POLICY "Vendors can update their own earnings status" ON public.vendor_earnings
FOR UPDATE 
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Les admins financiers peuvent voir tous les gains (avec audit)
CREATE POLICY "Finance admins can view all vendor earnings" ON public.vendor_earnings
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
CREATE POLICY "System can create vendor earnings" ON public.vendor_earnings
FOR INSERT 
WITH CHECK (true);

-- 4. Créer une fonction sécurisée pour obtenir des statistiques agrégées sans exposer les détails
CREATE OR REPLACE FUNCTION public.get_vendor_earnings_summary(
  vendor_id_param uuid DEFAULT NULL,
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
DECLARE
  target_vendor_id uuid;
BEGIN
  -- Si vendor_id n'est pas fourni, utiliser l'utilisateur actuel
  target_vendor_id := COALESCE(vendor_id_param, auth.uid());
  
  -- Vérifier l'autorisation
  IF target_vendor_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND ('finance_admin' = ANY(permissions) OR 'super_admin' = ANY(permissions))
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé aux données financières de ce vendeur';
  END IF;
  
  -- Logger l'accès aux données financières sensibles
  INSERT INTO public.vendor_financial_access_logs (
    accessed_by, target_vendor_id, access_type, access_reason
  ) VALUES (
    auth.uid(), target_vendor_id, 'earnings_summary', 
    CASE WHEN target_vendor_id = auth.uid() THEN 'Own data access' ELSE 'Admin financial review' END
  );
  
  -- Retourner le résumé des gains pour la période
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ve.amount), 0) as total_earnings,
    COUNT(DISTINCT ve.order_id)::integer as total_orders,
    COALESCE(AVG(ve.amount), 0) as average_order_value,
    COALESCE(SUM(CASE WHEN ve.status IN ('pending', 'confirmed') THEN ve.amount ELSE 0 END), 0) as pending_amount,
    MAX(ve.paid_at) as last_payment_date
  FROM public.vendor_earnings ve
  WHERE ve.vendor_id = target_vendor_id
    AND ve.created_at >= now() - (period_days || ' days')::interval;
END;
$$;

-- 5. Créer une fonction pour les statistiques de marché anonymisées (pour les vendeurs)
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
  -- Retourner des statistiques de marché anonymisées pour aider les vendeurs
  -- sans exposer les données individuelles
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
    HAVING COUNT(*) >= 3 -- Minimum 3 commandes pour anonymisation
  )
  SELECT 
    AVG(vs.total_earnings) as avg_earnings_per_vendor,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY vs.avg_order_value) as median_order_value,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY vs.total_earnings) as top_25_percent_threshold,
    COUNT(DISTINCT vs.vendor_id)::integer as total_active_vendors
  FROM vendor_stats vs;
END;
$$;

-- 6. Créer une table d'audit pour les accès aux données financières sensibles
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

CREATE POLICY "Only finance admins can view financial access logs" ON public.vendor_financial_access_logs
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
CREATE POLICY "Vendors can view access logs for their own data" ON public.vendor_financial_access_logs
FOR SELECT 
USING (auth.uid() = target_vendor_id);

-- 7. Créer une fonction pour masquer les données sensibles dans les rapports
CREATE OR REPLACE FUNCTION public.get_anonymized_vendor_performance()
RETURNS TABLE (
  performance_tier text,
  vendor_count integer,
  avg_monthly_earnings numeric,
  avg_orders_per_month numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retourner des données de performance anonymisées par tiers
  RETURN QUERY
  WITH vendor_monthly_stats AS (
    SELECT 
      ve.vendor_id,
      SUM(ve.amount) as monthly_earnings,
      COUNT(*) as monthly_orders
    FROM public.vendor_earnings ve
    WHERE ve.created_at >= date_trunc('month', now()) - interval '1 month'
      AND ve.status = 'paid'
    GROUP BY ve.vendor_id
  ),
  vendor_tiers AS (
    SELECT 
      vendor_id,
      monthly_earnings,
      monthly_orders,
      CASE 
        WHEN monthly_earnings >= PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY monthly_earnings) OVER () THEN 'Top Performers'
        WHEN monthly_earnings >= PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monthly_earnings) OVER () THEN 'Mid Performers'
        ELSE 'New/Growing'
      END as performance_tier
    FROM vendor_monthly_stats
  )
  SELECT 
    vt.performance_tier,
    COUNT(*)::integer as vendor_count,
    AVG(vt.monthly_earnings) as avg_monthly_earnings,
    AVG(vt.monthly_orders) as avg_orders_per_month
  FROM vendor_tiers vt
  GROUP BY vt.performance_tier
  ORDER BY avg_monthly_earnings DESC;
END;
$$;

-- 8. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_vendor_earnings_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_benchmark_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_anonymized_vendor_performance TO authenticated;

-- 9. Créer une vue sécurisée pour les rapports d'administration
CREATE OR REPLACE VIEW public.secure_vendor_earnings_view AS
SELECT 
  ve.id,
  ve.vendor_id,
  ve.order_id,
  -- Masquer les montants exacts pour les non-admins
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND ('finance_admin' = ANY(permissions) OR 'super_admin' = ANY(permissions))
    ) THEN ve.amount
    WHEN auth.uid() = ve.vendor_id THEN ve.amount
    ELSE NULL
  END as amount,
  ve.currency,
  ve.status,
  ve.earnings_type,
  ve.created_at,
  ve.confirmed_at,
  ve.paid_at
FROM public.vendor_earnings ve;

-- 10. Ajouter une politique pour la vue sécurisée
GRANT SELECT ON public.secure_vendor_earnings_view TO authenticated;

-- 11. Créer un trigger pour auditer automatiquement les accès directs
CREATE OR REPLACE FUNCTION public.audit_vendor_earnings_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auditer les accès aux données financières sensibles
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.vendor_id THEN
    INSERT INTO public.vendor_financial_access_logs (
      accessed_by, target_vendor_id, access_type, access_reason,
      sensitive_data_accessed
    ) VALUES (
      auth.uid(), NEW.vendor_id, 'direct_table_access', 'Direct query to vendor_earnings',
      jsonb_build_object(
        'amount', NEW.amount,
        'order_id', NEW.order_id,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: Trigger après SELECT n'est pas supporté, utiliser les fonctions sécurisées