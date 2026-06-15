-- PHASE 1 FINALISATION: AJOUTER POLITIQUES MANQUANTES POUR AUTRES TABLES
-- Compléter la sécurisation de toutes les tables avec RLS

-- Tables importantes nécessitant des politiques

-- Transport bookings - accès restreint aux participants
CREATE POLICY "booking_participants_access" ON public.transport_bookings
FOR ALL USING (auth.uid() = user_id OR auth.uid() = driver_id OR is_current_user_admin());

-- Delivery orders - accès restreint aux participants 
CREATE POLICY "delivery_participants_access" ON public.delivery_orders
FOR ALL USING (auth.uid() = user_id OR auth.uid() = driver_id OR is_current_user_admin());

-- Marketplace orders - accès restreint aux participants
CREATE POLICY "marketplace_participants_access" ON public.marketplace_orders
FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_current_user_admin());

-- Driver profiles - accès restreint
CREATE POLICY "driver_profile_access" ON public.driver_profiles
FOR ALL USING (auth.uid() = user_id OR is_current_user_admin());

CREATE POLICY "public_view_verified_driver_profiles" ON public.driver_profiles
FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- Driver locations - accès ultra-restreint
CREATE POLICY "driver_location_self_access" ON public.driver_locations
FOR ALL USING (auth.uid() = driver_id);

CREATE POLICY "admin_view_driver_locations" ON public.driver_locations
FOR SELECT USING (is_current_user_admin());

-- User wallets - sécurité financière maximale
CREATE POLICY "wallet_self_access" ON public.user_wallets
FOR ALL USING (auth.uid() = user_id);

-- Wallet transactions - historique financier protégé
CREATE POLICY "wallet_transactions_self_access" ON public.wallet_transactions
FOR ALL USING (auth.uid() = user_id);

-- Driver credits - finances chauffeurs protégées
CREATE POLICY "driver_credits_self_access" ON public.driver_credits
FOR ALL USING (auth.uid() = driver_id);

-- Enhanced support tickets - support utilisateur
CREATE POLICY "support_ticket_self_access" ON public.enhanced_support_tickets
FOR ALL USING (auth.uid() = user_id OR is_current_user_admin());

-- Conversations marketplace - chat privé
CREATE POLICY "conversation_participants_access" ON public.conversations
FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Produits marketplace - accès vendeur et public
CREATE POLICY "product_seller_access" ON public.products
FOR ALL USING (auth.uid() = seller_id OR is_current_user_admin());

CREATE POLICY "public_view_active_products" ON public.products
FOR SELECT USING (status = 'active' AND moderation_status = 'approved');

-- Vendor earnings - revenus vendeurs sécurisés
CREATE POLICY "vendor_earnings_self_access" ON public.vendor_earnings
FOR ALL USING (auth.uid() = vendor_id OR is_current_user_admin());

-- Escrow transactions - transactions sécurisées
CREATE POLICY "escrow_participants_access" ON public.escrow_transactions
FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR auth.uid() = driver_id OR is_current_user_admin());

-- Lottery tickets - loterie utilisateur
CREATE POLICY "lottery_ticket_self_access" ON public.lottery_tickets
FOR ALL USING (auth.uid() = user_id);

-- Activity logs - logs utilisateur
CREATE POLICY "activity_logs_self_access" ON public.activity_logs
FOR SELECT USING (auth.uid() = user_id OR is_current_user_admin());

-- Driver requests - demandes chauffeurs
CREATE POLICY "driver_request_self_access" ON public.driver_requests
FOR ALL USING (auth.uid() = user_id OR is_current_user_admin());

-- Messages - conversations privées
CREATE POLICY "message_conversation_access" ON public.messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Referrals - système parrainage
CREATE POLICY "referral_access" ON public.referrals
FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Places database - données géographiques publiques (lecture seule)
CREATE POLICY "places_public_read" ON public.places_database
FOR SELECT USING (is_active = true);

-- Commission settings - lecture seule pour tous
CREATE POLICY "commission_public_read" ON public.commission_settings
FOR SELECT USING (is_active = true);

-- Service zones - informations publiques sur les zones
CREATE POLICY "service_zones_public_read" ON public.service_zones
FOR SELECT USING (is_active = true);

-- Dynamic pricing - tarification publique
CREATE POLICY "dynamic_pricing_public_read" ON public.dynamic_pricing
FOR SELECT USING (valid_until > now());