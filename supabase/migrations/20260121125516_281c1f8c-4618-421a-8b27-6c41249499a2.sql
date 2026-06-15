-- Activer la réplication complète pour les tables avec souscriptions Realtime user_id
-- Cela permet de filtrer par user_id dans les souscriptions

-- Vérifier et activer replica identity full pour les tables principales
ALTER TABLE IF EXISTS public.system_notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.push_notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.order_notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.driver_requests REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.transport_bookings REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.delivery_orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.delivery_notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.lottery_wins REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.rental_bookings REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.food_orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.wallet_transactions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.user_wallets REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.user_notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.user_places REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.driver_profiles REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.user_ratings REPLICA IDENTITY FULL;