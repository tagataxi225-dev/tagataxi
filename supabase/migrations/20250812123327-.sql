-- Security Fix: Add SET search_path to all database functions to prevent schema poisoning attacks

-- Fix function: handle_profile_deletion
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the deletion for audit purposes
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    OLD.user_id,
    'account_deletion',
    'User account deleted',
    jsonb_build_object('deleted_at', now(), 'profile_id', OLD.id)
  );
  
  RETURN OLD;
END;
$function$;

-- Fix function: generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    code := UPPER(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM public.referrals WHERE referral_code = code;
    
    -- If code doesn't exist, exit loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$;

-- Fix function: user_exists
CREATE OR REPLACE FUNCTION public.user_exists(user_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_id_param);
$function$;

-- Fix function: update_product_moderation_status
CREATE OR REPLACE FUNCTION public.update_product_moderation_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If status changed from active to something else, update moderation status
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    NEW.moderation_status = 'inactive';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix function: generate_lottery_ticket_number
CREATE OR REPLACE FUNCTION public.generate_lottery_ticket_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_ticket_number TEXT;
  exists_check INTEGER;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    -- Générer un code de 10 caractères (format: KWND-XXXXXX)
    new_ticket_number := 'KWND-';
    FOR i IN 1..6 LOOP
      new_ticket_number := new_ticket_number || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Vérifier si le numéro existe déjà (spécifier explicitement la table)
    SELECT COUNT(*) INTO exists_check 
    FROM public.lottery_tickets 
    WHERE lottery_tickets.ticket_number = new_ticket_number;
    
    -- Si le numéro n'existe pas, sortir de la boucle
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_ticket_number;
END;
$function$;

-- Fix function: create_team_account_from_request
CREATE OR REPLACE FUNCTION public.create_team_account_from_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_team_id UUID;
BEGIN
  -- Si la demande est approuvée
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Créer le compte équipe
    INSERT INTO public.team_accounts (
      owner_id,
      name,
      contact_email,
      industry,
      team_size,
      phone,
      status
    ) VALUES (
      NEW.user_id,
      NEW.company_name,
      NEW.contact_email,
      NEW.industry,
      NEW.team_size,
      NEW.phone,
      'active'
    ) RETURNING id INTO new_team_id;
    
    -- Ajouter le propriétaire comme admin de l'équipe
    INSERT INTO public.team_members (
      team_id,
      user_id,
      role,
      status,
      invited_by,
      joined_at
    ) VALUES (
      new_team_id,
      NEW.user_id,
      'admin',
      'active',
      NEW.reviewed_by,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix function: generate_ticket_number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ticket_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate format: TKT-YYYYMMDD-XXXX
    ticket_num := 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || 
                  LPAD(floor(random() * 9999 + 1)::text, 4, '0');
    
    SELECT COUNT(*) INTO exists_check FROM public.enhanced_support_tickets WHERE ticket_number = ticket_num;
    
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN ticket_num;
END;
$function$;

-- Fix function: calculate_rental_price
CREATE OR REPLACE FUNCTION public.calculate_rental_price(base_price numeric, city_name text, category_id_param uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  multiplier numeric := 1.0;
BEGIN
  SELECT rcp.multiplier INTO multiplier
  FROM rental_city_pricing rcp
  WHERE rcp.city = city_name
    AND (category_id_param IS NULL OR rcp.category_id = category_id_param)
  ORDER BY rcp.category_id NULLS LAST
  LIMIT 1;
  
  RETURN ROUND(base_price * COALESCE(multiplier, 1.0));
END;
$function$;

-- Fix function: create_vendor_notification_on_order
CREATE OR REPLACE FUNCTION public.create_vendor_notification_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Fix function: is_vehicle_subscription_active
CREATE OR REPLACE FUNCTION public.is_vehicle_subscription_active(vehicle_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  subscription_active BOOLEAN := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.partner_rental_subscriptions 
    WHERE vehicle_id = vehicle_id_param 
      AND status = 'active'
      AND end_date > now()
  ) INTO subscription_active;
  
  RETURN subscription_active;
END;
$function$;

-- Fix function: update_support_messages_updated_at
CREATE OR REPLACE FUNCTION public.update_support_messages_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function: update_marketplace_order_timestamps
CREATE OR REPLACE FUNCTION public.update_marketplace_order_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Fix function: generate_driver_code
CREATE OR REPLACE FUNCTION public.generate_driver_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  generated_code TEXT;
  exists_check INTEGER;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code using native PostgreSQL functions
    generated_code := '';
    FOR i IN 1..8 LOOP
      generated_code := generated_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists (fixed column ambiguity)
    SELECT COUNT(*) INTO exists_check FROM public.driver_codes WHERE code = generated_code;
    
    -- If code doesn't exist, exit loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN generated_code;
END;
$function$;