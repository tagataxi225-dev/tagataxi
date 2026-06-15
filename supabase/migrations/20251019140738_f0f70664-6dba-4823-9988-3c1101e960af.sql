-- ==========================================
-- FONCTIONS RPC POUR ACCÈS AUX MATERIALIZED VIEWS
-- ==========================================

-- Fonction pour récupérer vendor stats depuis la MV
CREATE OR REPLACE FUNCTION public.get_vendor_stats_optimized(vendor_user_id UUID)
RETURNS TABLE (
  seller_id UUID,
  active_products BIGINT,
  pending_products BIGINT,
  total_orders BIGINT,
  pending_orders BIGINT,
  escrow_balance NUMERIC,
  pending_escrow NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur accède à ses propres stats
  IF auth.uid() != vendor_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  RETURN QUERY
  SELECT 
    mv.seller_id,
    mv.active_products,
    mv.pending_products,
    mv.total_orders,
    mv.pending_orders,
    mv.escrow_balance,
    mv.pending_escrow
  FROM public.vendor_stats_mv mv
  WHERE mv.seller_id = vendor_user_id;
END;
$$;

-- Fonction pour récupérer partner stats depuis la MV
CREATE OR REPLACE FUNCTION public.get_partner_stats_optimized(partner_user_id UUID)
RETURNS TABLE (
  partner_id UUID,
  active_drivers BIGINT,
  subscribed_drivers BIGINT,
  total_commissions NUMERIC,
  monthly_commissions NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur accède à ses propres stats OU est admin
  IF auth.uid() != partner_user_id AND NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  RETURN QUERY
  SELECT 
    mv.partner_id,
    mv.active_drivers,
    mv.subscribed_drivers,
    mv.total_commissions,
    mv.monthly_commissions
  FROM public.partner_stats_mv mv
  WHERE mv.partner_id = partner_user_id;
END;
$$;