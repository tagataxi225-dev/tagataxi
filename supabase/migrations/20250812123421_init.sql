-- Security Fix Phase 2: Fix remaining database functions with missing search_path settings

-- Fix function: bump_unified_conversation_last_message_at
CREATE OR REPLACE FUNCTION public.bump_unified_conversation_last_message_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.unified_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- Fix function: update_driver_challenges_on_booking
CREATE OR REPLACE FUNCTION public.update_driver_challenges_on_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  price numeric := COALESCE(NEW.actual_price, 0);
BEGIN
  -- Ensure we have a driver context
  IF NEW.driver_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Increment count-based challenges (rides/deliveries)
  UPDATE public.driver_challenges dc
  SET 
    current_progress = LEAST(dc.current_progress + 1, ch.target_value),
    is_completed = CASE WHEN dc.current_progress + 1 >= ch.target_value THEN true ELSE dc.is_completed END,
    completed_at = CASE WHEN dc.current_progress + 1 >= ch.target_value AND dc.is_completed = false THEN now() ELSE dc.completed_at END,
    updated_at = now()
  FROM public.challenges ch
  WHERE dc.challenge_id = ch.id
    AND dc.driver_id = NEW.driver_id
    AND ch.is_active = true
    AND ch.target_metric IN ('rides_completed','deliveries_completed');

  -- Increment amount-based challenges (earnings)
  UPDATE public.driver_challenges dc
  SET 
    current_progress = LEAST(dc.current_progress + price::int, ch.target_value),
    is_completed = CASE WHEN dc.current_progress + price::int >= ch.target_value THEN true ELSE dc.is_completed END,
    completed_at = CASE WHEN dc.current_progress + price::int >= ch.target_value AND dc.is_completed = false THEN now() ELSE dc.completed_at END,
    updated_at = now()
  FROM public.challenges ch
  WHERE dc.challenge_id = ch.id
    AND dc.driver_id = NEW.driver_id
    AND ch.is_active = true
    AND ch.target_metric = 'earnings_amount';

  RETURN NEW;
END;
$function$;

-- Fix function: get_notification_stats
CREATE OR REPLACE FUNCTION public.get_notification_stats(admin_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB := '{}';
  total_sent INTEGER;
  total_read INTEGER;
  total_pending INTEGER;
  total_failed INTEGER;
BEGIN
  -- Statistiques générales
  SELECT COUNT(*) INTO total_sent
  FROM public.admin_notifications
  WHERE (admin_id IS NULL OR sender_id = admin_id)
    AND status = 'sent';

  SELECT COUNT(*) INTO total_pending  
  FROM public.admin_notifications
  WHERE (admin_id IS NULL OR sender_id = admin_id)
    AND status IN ('draft', 'scheduled', 'sending');

  SELECT COUNT(*) INTO total_failed
  FROM public.admin_notifications
  WHERE (admin_id IS NULL OR sender_id = admin_id)
    AND status = 'failed';

  SELECT COUNT(*) INTO total_read
  FROM public.user_notifications un
  JOIN public.admin_notifications an ON un.admin_notification_id = an.id
  WHERE (admin_id IS NULL OR an.sender_id = admin_id)
    AND un.is_read = true;

  result := jsonb_build_object(
    'total_sent', total_sent,
    'total_read', total_read,
    'total_pending', total_pending,
    'total_failed', total_failed,
    'read_rate', CASE WHEN total_sent > 0 THEN ROUND((total_read::NUMERIC / total_sent) * 100, 2) ELSE 0 END
  );

  RETURN result;
END;
$function$;

-- Fix function: notify_order_status_change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  buyer_notification_type TEXT;
  seller_notification_type TEXT;
BEGIN
  -- Déterminer le type de notification basé sur le nouveau statut
  CASE NEW.status
    WHEN 'confirmed' THEN
      notification_title := 'Commande confirmée';
      notification_message := 'Votre commande a été confirmée par le vendeur';
      buyer_notification_type := 'order_confirmed';
      seller_notification_type := 'order_to_prepare';
    WHEN 'preparing' THEN
      notification_title := 'Commande en préparation';
      notification_message := 'Le vendeur prépare votre commande';
      buyer_notification_type := 'order_preparing';
    WHEN 'ready_for_pickup' THEN
      notification_title := 'Commande prête';
      notification_message := 'Votre commande est prête pour collecte/livraison';
      buyer_notification_type := 'order_ready';
    WHEN 'in_transit' THEN
      notification_title := 'Commande en livraison';
      notification_message := 'Votre commande est en route vers vous';
      buyer_notification_type := 'order_in_transit';
    WHEN 'delivered' THEN
      notification_title := 'Commande livrée';
      notification_message := 'Votre commande a été livrée avec succès';
      buyer_notification_type := 'order_delivered';
    WHEN 'completed' THEN
      notification_title := 'Commande terminée';
      notification_message := 'Transaction terminée avec succès';
      buyer_notification_type := 'order_completed';
      seller_notification_type := 'payment_released';
    ELSE
      RETURN NEW;
  END CASE;

  -- Créer notification pour l'acheteur
  IF buyer_notification_type IS NOT NULL THEN
    INSERT INTO public.order_notifications (
      order_id, user_id, notification_type, title, message, metadata
    ) VALUES (
      NEW.id, NEW.buyer_id, buyer_notification_type, 
      notification_title, notification_message,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  -- Créer notification pour le vendeur si nécessaire
  IF seller_notification_type IS NOT NULL THEN
    INSERT INTO public.order_notifications (
      order_id, user_id, notification_type, title, message, metadata
    ) VALUES (
      NEW.id, NEW.seller_id, seller_notification_type, 
      CASE seller_notification_type
        WHEN 'order_to_prepare' THEN 'Nouvelle commande à préparer'
        WHEN 'payment_released' THEN 'Paiement libéré'
        ELSE notification_title
      END,
      CASE seller_notification_type
        WHEN 'order_to_prepare' THEN 'Vous avez une nouvelle commande à préparer'
        WHEN 'payment_released' THEN 'Le paiement de votre vente a été libéré'
        ELSE notification_message
      END,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix function: calculate_delivery_estimate
CREATE OR REPLACE FUNCTION public.calculate_delivery_estimate(order_id_param uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  order_record RECORD;
  estimated_time TIMESTAMP WITH TIME ZONE;
  base_prep_time INTERVAL := '2 hours'::INTERVAL;
  delivery_time INTERVAL := '1 hour'::INTERVAL;
BEGIN
  -- Récupérer les détails de la commande
  SELECT * INTO order_record 
  FROM public.marketplace_orders 
  WHERE id = order_id_param;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculer l'estimation basée sur l'état actuel
  CASE order_record.status
    WHEN 'pending' THEN
      estimated_time := now() + base_prep_time + delivery_time;
    WHEN 'confirmed' THEN
      estimated_time := now() + base_prep_time + delivery_time;
    WHEN 'preparing' THEN
      estimated_time := now() + (base_prep_time / 2) + delivery_time;
    WHEN 'ready_for_pickup' THEN
      estimated_time := now() + delivery_time;
    WHEN 'in_transit' THEN
      estimated_time := now() + (delivery_time / 2);
    ELSE
      estimated_time := now();
  END CASE;
  
  RETURN estimated_time;
END;
$function$;

-- Fix function: link_payment_to_subscription
CREATE OR REPLACE FUNCTION public.link_payment_to_subscription(payment_id uuid, subscription_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.rental_subscription_payments 
  SET subscription_id = link_payment_to_subscription.subscription_id,
      updated_at = now()
  WHERE id = payment_id;
  
  RETURN FOUND;
END;
$function$;