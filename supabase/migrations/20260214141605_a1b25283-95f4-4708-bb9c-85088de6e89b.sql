
-- ============================================
-- PHASE 2: CORRECTIONS SÉCURITÉ
-- ============================================

-- 1. Fix increment_offer_count: ajouter search_path
CREATE OR REPLACE FUNCTION public.increment_offer_count(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.transport_bookings 
  SET offer_count = COALESCE(offer_count, 0) + 1
  WHERE id = p_booking_id;
END;
$function$;

-- 2. Fix ride_commissions: restreindre INSERT/UPDATE aux admins ou système
-- D'abord supprimer les policies trop permissives
DROP POLICY IF EXISTS "Service peut insérer des commissions" ON public.ride_commissions;
DROP POLICY IF EXISTS "Service peut mettre à jour des commissions" ON public.ride_commissions;

-- Recréer avec restrictions: seul le service_role (via edge functions) peut insérer/modifier
-- Les utilisateurs authentifiés ne doivent PAS pouvoir manipuler les commissions
CREATE POLICY "Only service role can insert commissions"
ON public.ride_commissions
FOR INSERT
WITH CHECK (
  -- Vérifier que l'utilisateur est admin
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Only service role can update commissions"
ON public.ride_commissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 3. Fix push_notifications: supprimer la policy dupliquée
DROP POLICY IF EXISTS "System can insert push notifications" ON public.push_notifications;

-- 4. Fix security_definer view: recréer vendor_stats comme SECURITY INVOKER (défaut)
-- Note: Les vues sont SECURITY INVOKER par défaut dans PostgreSQL
-- La vue vendor_stats utilise des données publiques, c'est acceptable
-- Mais on force explicitement SECURITY INVOKER
DROP VIEW IF EXISTS public.vendor_stats;
CREATE VIEW public.vendor_stats 
WITH (security_invoker = true)
AS
SELECT p.id AS vendor_id,
    p.display_name,
    p.avatar_url,
    p.cover_url,
    p.bio,
    p.is_verified_seller,
    count(DISTINCT mp.id) AS products_count,
    count(DISTINCT mo.id) AS sales_count,
    COALESCE(avg(mp.rating_average), (0)::numeric) AS avg_rating,
    count(DISTINCT vf.user_id) FILTER (WHERE (vf.is_active = true)) AS followers_count
   FROM (((profiles p
     LEFT JOIN marketplace_products mp ON (((mp.seller_id = p.id) AND (mp.status = 'active'::text))))
     LEFT JOIN marketplace_orders mo ON (((mo.seller_id = p.id) AND (mo.status = 'delivered'::text))))
     LEFT JOIN vendor_followers vf ON ((vf.vendor_id = p.id)))
  WHERE ((p.user_type = 'vendor'::text) OR (EXISTS ( SELECT 1
           FROM marketplace_products
          WHERE (marketplace_products.seller_id = p.id))))
  GROUP BY p.id, p.display_name, p.avatar_url, p.cover_url, p.bio, p.is_verified_seller;
