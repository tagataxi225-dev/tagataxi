-- Corriger l'avertissement de sécurité sur la vue SECURITY DEFINER

-- 1. Supprimer la vue SECURITY DEFINER dangereuse
DROP VIEW IF EXISTS public.secure_vendor_earnings_view;

-- 2. Créer une fonction sécurisée à la place de la vue
CREATE OR REPLACE FUNCTION public.get_secure_vendor_earnings(
  vendor_filter uuid DEFAULT NULL,
  limit_records integer DEFAULT 100,
  offset_records integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  vendor_id uuid,
  order_id uuid,
  amount numeric,
  currency text,
  status text,
  earnings_type text,
  created_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  paid_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_finance_admin boolean := false;
  is_vendor_access boolean := false;
BEGIN
  -- Vérifier si l'utilisateur est admin financier
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND ('finance_admin' = ANY(permissions) OR 'super_admin' = ANY(permissions))
  ) INTO is_finance_admin;
  
  -- Vérifier si c'est un accès vendeur à ses propres données
  IF vendor_filter IS NOT NULL AND vendor_filter = auth.uid() THEN
    is_vendor_access := true;
  END IF;
  
  -- Autoriser seulement les admins financiers ou vendeurs pour leurs propres données
  IF NOT is_finance_admin AND NOT is_vendor_access THEN
    RAISE EXCEPTION 'Accès non autorisé aux données de gains des vendeurs';
  END IF;
  
  -- Logger l'accès
  INSERT INTO public.vendor_financial_access_logs (
    accessed_by, target_vendor_id, access_type, access_reason
  ) VALUES (
    auth.uid(), 
    COALESCE(vendor_filter, auth.uid()), 
    CASE WHEN is_finance_admin THEN 'admin_earnings_view' ELSE 'vendor_own_earnings' END,
    'Secure earnings data access'
  );
  
  -- Retourner les données autorisées
  RETURN QUERY
  SELECT 
    ve.id,
    ve.vendor_id,
    ve.order_id,
    -- Masquer les montants pour les accès non autorisés
    CASE 
      WHEN is_finance_admin OR is_vendor_access THEN ve.amount
      ELSE NULL
    END as amount,
    ve.currency,
    ve.status,
    ve.earnings_type,
    ve.created_at,
    ve.confirmed_at,
    ve.paid_at
  FROM public.vendor_earnings ve
  WHERE (vendor_filter IS NULL OR ve.vendor_id = vendor_filter)
    AND (is_finance_admin OR ve.vendor_id = auth.uid())
  ORDER BY ve.created_at DESC
  LIMIT limit_records
  OFFSET offset_records;
END;
$$;

-- 3. Accorder les permissions sur la nouvelle fonction
GRANT EXECUTE ON FUNCTION public.get_secure_vendor_earnings TO authenticated;

-- 4. Créer une fonction simplifiée pour les tableaux de bord vendeurs
CREATE OR REPLACE FUNCTION public.get_vendor_dashboard_data()
RETURNS TABLE (
  current_month_earnings numeric,
  last_month_earnings numeric,
  pending_payments numeric,
  total_orders_this_month integer,
  average_order_value numeric,
  top_selling_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est un vendeur authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;
  
  -- Retourner les données du tableau de bord pour le vendeur actuel
  RETURN QUERY
  WITH current_month AS (
    SELECT 
      COALESCE(SUM(amount), 0) as earnings,
      COUNT(*) as orders,
      COALESCE(AVG(amount), 0) as avg_value
    FROM public.vendor_earnings ve
    WHERE ve.vendor_id = auth.uid()
      AND DATE_TRUNC('month', ve.created_at) = DATE_TRUNC('month', now())
      AND ve.status IN ('confirmed', 'paid')
  ),
  last_month AS (
    SELECT COALESCE(SUM(amount), 0) as earnings
    FROM public.vendor_earnings ve
    WHERE ve.vendor_id = auth.uid()
      AND DATE_TRUNC('month', ve.created_at) = DATE_TRUNC('month', now() - interval '1 month')
      AND ve.status IN ('confirmed', 'paid')
  ),
  pending_data AS (
    SELECT COALESCE(SUM(amount), 0) as pending
    FROM public.vendor_earnings ve
    WHERE ve.vendor_id = auth.uid()
      AND ve.status IN ('pending', 'confirmed')
  ),
  top_category AS (
    SELECT mp.category
    FROM public.vendor_earnings ve
    JOIN public.marketplace_orders mo ON ve.order_id = mo.id
    JOIN public.marketplace_products mp ON mo.product_id = mp.id
    WHERE ve.vendor_id = auth.uid()
      AND DATE_TRUNC('month', ve.created_at) = DATE_TRUNC('month', now())
    GROUP BY mp.category
    ORDER BY SUM(ve.amount) DESC
    LIMIT 1
  )
  SELECT 
    cm.earnings as current_month_earnings,
    lm.earnings as last_month_earnings,
    pd.pending as pending_payments,
    cm.orders::integer as total_orders_this_month,
    cm.avg_value as average_order_value,
    COALESCE(tc.category, 'Aucune vente') as top_selling_category
  FROM current_month cm
  CROSS JOIN last_month lm
  CROSS JOIN pending_data pd
  LEFT JOIN top_category tc ON true;
END;
$$;

-- 5. Accorder les permissions sur la fonction dashboard
GRANT EXECUTE ON FUNCTION public.get_vendor_dashboard_data TO authenticated;