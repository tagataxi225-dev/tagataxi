-- Phase 1: Sécurisation Critique - RLS Policies pour tables existantes uniquement

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

-- 2. Zone Statistics - Admin et lecture publique limitée
ALTER TABLE public.zone_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access zone stats" 
ON public.zone_statistics 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Public read basic zone stats" 
ON public.zone_statistics 
FOR SELECT 
USING (true);

-- 3. Driver Locations - Accès sécurisé
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

-- 4. Wallet Transactions - Accès personnel strict
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own wallet transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins access all wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (is_current_user_admin());

-- 5. Messages - Participants uniquement
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

-- 6. Driver Challenges - Chauffeur personnel
ALTER TABLE public.driver_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers access own challenges" 
ON public.driver_challenges 
FOR ALL 
USING (auth.uid() = driver_id);

-- 7. Credit Transactions - Chauffeur personnel
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers access own credit transactions" 
ON public.credit_transactions 
FOR ALL 
USING (auth.uid() = driver_id);

-- 8. Product Categories - Lecture publique, écriture admin
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product categories" 
ON public.product_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins manage product categories" 
ON public.product_categories 
FOR ALL 
USING (is_current_user_admin());

-- 9. Service Zones - Lecture publique, écriture admin
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read service zones" 
ON public.service_zones 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins manage service zones" 
ON public.service_zones 
FOR ALL 
USING (is_current_user_admin());

-- 10. Driver Queue - Accès contrôlé
ALTER TABLE public.driver_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers access own queue position" 
ON public.driver_queue 
FOR ALL 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins access all queue positions" 
ON public.driver_queue 
FOR ALL 
USING (is_current_user_admin());

-- 11. Driver Zone Assignments - Accès contrôlé
ALTER TABLE public.driver_zone_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own zone assignments" 
ON public.driver_zone_assignments 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins manage zone assignments" 
ON public.driver_zone_assignments 
FOR ALL 
USING (is_current_user_admin());

-- 12. Dynamic Pricing - Lecture publique, écriture admin
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dynamic pricing" 
ON public.dynamic_pricing 
FOR SELECT 
USING (true);

CREATE POLICY "Admins manage dynamic pricing" 
ON public.dynamic_pricing 
FOR INSERT 
WITH CHECK (is_current_user_admin());

-- 13. Marketplace Delivery Assignments - Participants
ALTER TABLE public.marketplace_delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers access own assignments" 
ON public.marketplace_delivery_assignments 
FOR ALL 
USING (auth.uid() = driver_id);

CREATE POLICY "Order participants view assignments" 
ON public.marketplace_delivery_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_orders 
    WHERE id = order_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Admins access all assignments" 
ON public.marketplace_delivery_assignments 
FOR ALL 
USING (is_current_user_admin());