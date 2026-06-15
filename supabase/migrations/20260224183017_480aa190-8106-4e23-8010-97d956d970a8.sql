-- =============================================
-- FIX 1: Convert all views to SECURITY INVOKER
-- This fixes the "Security Definer View" linter error
-- =============================================

ALTER VIEW public.ab_experiment_metrics SET (security_invoker = on);
ALTER VIEW public.ai_performance_stats_secure SET (security_invoker = on);
ALTER VIEW public.assignment_conflicts_view SET (security_invoker = on);
ALTER VIEW public.driver_service_preferences_legacy SET (security_invoker = on);
ALTER VIEW public.heatmap_grid_density SET (security_invoker = on);
ALTER VIEW public.heatmap_top_elements SET (security_invoker = on);
ALTER VIEW public.partner_profiles SET (security_invoker = on);
ALTER VIEW public.partner_registration_monitoring SET (security_invoker = on);
ALTER VIEW public.rental_booking_stats_secure SET (security_invoker = on);
ALTER VIEW public.rental_subscription_stats_secure SET (security_invoker = on);
ALTER VIEW public.rental_vehicle_stats_secure SET (security_invoker = on);
ALTER VIEW public.subscription_stats_by_service SET (security_invoker = on);
ALTER VIEW public.user_profiles_safe SET (security_invoker = on);
ALTER VIEW public.user_profiles_view SET (security_invoker = on);
ALTER VIEW public.v_user_rating_stats SET (security_invoker = on);
ALTER VIEW public.vendor_stats SET (security_invoker = on);

-- =============================================
-- FIX 2: Restrict partenaires public read policy
-- Only expose non-sensitive fields publicly
-- =============================================

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "partenaires_public_read" ON public.partenaires;

-- Create a secure public view for partner listings (non-sensitive data only)
CREATE OR REPLACE VIEW public.partenaires_public_listing
WITH (security_invoker = on)
AS SELECT 
  id,
  company_name,
  city,
  banner_image,
  shop_description,
  is_active,
  loyalty_points,
  loyalty_tier,
  commission_rate,
  created_at
FROM public.partenaires
WHERE is_active = true;