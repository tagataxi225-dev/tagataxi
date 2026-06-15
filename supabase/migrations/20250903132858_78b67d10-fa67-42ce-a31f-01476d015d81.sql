-- Phase 1: Sécurisation Critique - RLS Policies pour tables sensibles

-- 1. Marketplace Products - Accès selon le vendeur
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active products" 
ON public.marketplace_products 
FOR SELECT 
USING (moderation_status = 'approved' AND status = 'active');

CREATE POLICY "Vendors can manage their products" 
ON public.marketplace_products 
FOR ALL 
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all products" 
ON public.marketplace_products 
FOR ALL 
USING (is_current_user_admin());

-- 2. Pricing Rules - Admin seulement
ALTER TABLE public.zone_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only pricing rules" 
ON public.zone_pricing_rules 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Public read pricing rules" 
ON public.zone_pricing_rules 
FOR SELECT 
USING (is_active = true);

-- 3. Zone Statistics - Admin et lecture publique limitée
ALTER TABLE public.zone_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access zone stats" 
ON public.zone_statistics 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Public read basic zone stats" 
ON public.zone_statistics 
FOR SELECT 
USING (true);

-- 4. Driver Locations - Accès sécurisé
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers manage own location" 
ON public.driver_locations 
FOR ALL 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins view all driver locations" 
ON public.driver_locations 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "Clients view nearby available drivers" 
ON public.driver_locations 
FOR SELECT 
USING (is_online = true AND is_available = true);

-- 5. Wallet Transactions - Accès personnel strict
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own wallet transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins access all wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (is_current_user_admin());

-- 6. Messages - Participants uniquement
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants access messages" 
ON public.messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- 7. Driver Challenges - Chauffeur personnel
ALTER TABLE public.driver_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers access own challenges" 
ON public.driver_challenges 
FOR ALL 
USING (auth.uid() = driver_id);

-- 8. Credit Transactions - Chauffeur personnel
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers access own credit transactions" 
ON public.credit_transactions 
FOR ALL 
USING (auth.uid() = driver_id);

-- 9. Partner Rental Vehicles - Partenaire propriétaire
ALTER TABLE public.partner_rental_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners manage own vehicles" 
ON public.partner_rental_vehicles 
FOR ALL 
USING (auth.uid() = partner_id);

CREATE POLICY "Public view available vehicles" 
ON public.partner_rental_vehicles 
FOR SELECT 
USING (is_active = true AND moderation_status = 'approved');

-- 10. Vendor Earnings - Vendeur personnel
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors access own earnings" 
ON public.vendor_earnings 
FOR ALL 
USING (auth.uid() = vendor_id);

-- 11. Product Categories - Lecture publique, écriture admin
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product categories" 
ON public.product_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins manage product categories" 
ON public.product_categories 
FOR ALL 
USING (is_current_user_admin());

-- 12. Service Zones - Lecture publique, écriture admin
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read service zones" 
ON public.service_zones 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins manage service zones" 
ON public.service_zones 
FOR ALL 
USING (is_current_user_admin());

-- 13. Vendor Financial Access Logs - Sécurité audit
ALTER TABLE public.vendor_financial_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own access logs" 
ON public.vendor_financial_access_logs 
FOR SELECT 
USING (auth.uid() = target_vendor_id);

CREATE POLICY "Admins view all access logs" 
ON public.vendor_financial_access_logs 
FOR ALL 
USING (is_current_user_admin());

-- 14. Profile Access Logs - Sécurité audit
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile access logs" 
ON public.profile_access_logs 
FOR SELECT 
USING (auth.uid() = target_user_id);

CREATE POLICY "Admins view all profile access logs" 
ON public.profile_access_logs 
FOR ALL 
USING (is_current_user_admin());

-- 15. Vendor Notifications - Vendeur personnel
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors access own notifications" 
ON public.vendor_notifications 
FOR ALL 
USING (auth.uid() = vendor_id);