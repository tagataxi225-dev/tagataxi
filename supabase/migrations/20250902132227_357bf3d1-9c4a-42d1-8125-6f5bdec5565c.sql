-- Corriger les avertissements de sécurité détectés

-- 1. Fixer les fonctions avec search_path mutable en ajoutant SET search_path = public
CREATE OR REPLACE FUNCTION public.generate_lottery_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_driver_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 2. Ajouter une fonction pour vérifier les accès aux données de localisation sensibles
CREATE OR REPLACE FUNCTION public.check_driver_location_access(target_driver_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_authorized boolean := false;
BEGIN
  -- Vérifier si l'utilisateur actuel a le droit d'accéder à cette localisation
  -- 1. Le chauffeur lui-même
  IF auth.uid() = target_driver_id THEN
    is_authorized := true;
  -- 2. Un admin actif
  ELSIF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    is_authorized := true;
    -- Logger l'accès admin
    PERFORM public.log_driver_location_access(target_driver_id, 'admin_access', 'Admin location access');
  END IF;
  
  RETURN is_authorized;
END;
$$;