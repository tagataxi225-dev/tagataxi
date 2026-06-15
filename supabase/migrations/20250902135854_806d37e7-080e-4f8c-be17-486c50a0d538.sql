-- CORRECTION FINALE - Problèmes de sécurité restants
-- Identifier et corriger toutes les fonctions sans search_path

-- Mise à jour de toutes les fonctions critiques restantes avec search_path
CREATE OR REPLACE FUNCTION public.calculate_waiting_fees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  pricing_rule RECORD;
  waiting_minutes INTEGER := 0;
  billable_minutes INTEGER := 0;
  waiting_fee NUMERIC := 0;
BEGIN
  -- Calcul seulement si on passe de driver_arrived à in_progress
  IF OLD.status = 'driver_arrived' AND NEW.status = 'in_progress' AND NEW.driver_arrived_at IS NOT NULL THEN
    -- Calculer le temps d'attente en minutes
    waiting_minutes := EXTRACT(EPOCH FROM (NEW.customer_boarded_at - NEW.driver_arrived_at)) / 60;
    
    -- Récupérer la règle de tarification
    SELECT * INTO pricing_rule
    FROM public.pricing_rules
    WHERE service_type = 'transport'
      AND vehicle_class = NEW.vehicle_class
      AND is_active = true
    LIMIT 1;
    
    IF pricing_rule IS NOT NULL THEN
      -- Calculer les minutes facturables (après le temps gratuit)
      billable_minutes := GREATEST(0, waiting_minutes - pricing_rule.free_waiting_time_minutes);
      
      -- Calculer les frais d'attente
      waiting_fee := billable_minutes * pricing_rule.waiting_fee_per_minute;
      
      -- Mettre à jour les valeurs
      NEW.waiting_time_minutes := waiting_minutes;
      NEW.waiting_fee_amount := waiting_fee;
      
      -- Mettre à jour le prix final
      NEW.actual_price := COALESCE(NEW.actual_price, NEW.estimated_price) + waiting_fee;
    END IF;
  END IF;
  
  -- Auto-définir driver_arrived_at si le statut devient driver_arrived
  IF NEW.status = 'driver_arrived' AND OLD.status != 'driver_arrived' AND NEW.driver_arrived_at IS NULL THEN
    NEW.driver_arrived_at := now();
  END IF;
  
  -- Auto-définir customer_boarded_at si le statut devient in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.customer_boarded_at IS NULL THEN
    NEW.customer_boarded_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_driver_challenges_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_marketplace_order_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Set appropriate timestamps based on status changes
  CASE NEW.status
    WHEN 'confirmed' THEN
      IF OLD.status != 'confirmed' THEN
        NEW.confirmed_at = NOW();
      END IF;
    WHEN 'preparing' THEN
      IF OLD.status != 'preparing' THEN
        NEW.preparing_at = NOW();
      END IF;
    WHEN 'ready_for_pickup' THEN
      IF OLD.status != 'ready_for_pickup' THEN
        NEW.ready_for_pickup_at = NOW();
      END IF;
    WHEN 'assigned_to_driver' THEN
      IF OLD.status != 'assigned_to_driver' THEN
        NEW.assigned_to_driver_at = NOW();
      END IF;
    WHEN 'picked_up_by_driver' THEN
      IF OLD.status != 'picked_up_by_driver' THEN
        NEW.picked_up_by_driver_at = NOW();
      END IF;
    WHEN 'in_transit' THEN
      IF OLD.status != 'in_transit' THEN
        NEW.in_transit_at = NOW();
      END IF;
    WHEN 'delivered' THEN
      IF OLD.status != 'delivered' THEN
        NEW.delivered_at = NOW();
      END IF;
    WHEN 'completed' THEN
      IF OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_vendor_notification_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create notification for new order
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vendor_notifications (
      vendor_id,
      order_id,
      notification_type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.seller_id,
      NEW.id,
      'new_order',
      'Nouvelle commande reçue',
      'Vous avez reçu une nouvelle commande à confirmer',
      jsonb_build_object(
        'order_id', NEW.id,
        'buyer_id', NEW.buyer_id,
        'total_amount', NEW.total_amount,
        'product_id', NEW.product_id
      )
    );
    
    -- Create pending earnings record
    INSERT INTO public.vendor_earnings (
      vendor_id,
      order_id,
      amount,
      currency,
      status,
      earnings_type
    ) VALUES (
      NEW.seller_id,
      NEW.id,
      NEW.total_amount,
      'CDF',
      'pending',
      'sale'
    );
  END IF;
  
  -- Create notification for order confirmation
  IF TG_OP = 'UPDATE' AND OLD.vendor_confirmation_status = 'awaiting_confirmation' 
     AND NEW.vendor_confirmation_status = 'confirmed' THEN
    INSERT INTO public.vendor_notifications (
      vendor_id,
      order_id,
      notification_type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.buyer_id, -- Notify the buyer
      NEW.id,
      'order_confirmed',
      'Commande confirmée',
      'Votre commande a été confirmée par le vendeur',
      jsonb_build_object(
        'order_id', NEW.id,
        'seller_id', NEW.seller_id
      )
    );
    
    -- Update earnings status
    UPDATE public.vendor_earnings 
    SET status = 'confirmed', confirmed_at = now()
    WHERE order_id = NEW.id AND vendor_id = NEW.seller_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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