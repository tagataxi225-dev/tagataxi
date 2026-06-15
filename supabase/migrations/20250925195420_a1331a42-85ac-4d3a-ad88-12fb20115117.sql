-- Create function to get user type for referral system
CREATE OR REPLACE FUNCTION public.get_user_type(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a driver/chauffeur
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE user_id = p_user_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.driver_profiles 
    WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RETURN 'driver';
  END IF;
  
  -- Check if user is a client
  IF EXISTS (
    SELECT 1 FROM public.clients 
    WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RETURN 'client';
  END IF;
  
  -- Check if user is an admin
  IF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RETURN 'admin';
  END IF;
  
  -- Check if user is a partner
  IF EXISTS (
    SELECT 1 FROM public.partenaires 
    WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RETURN 'partner';
  END IF;
  
  -- Default to client if no specific role found
  RETURN 'client';
END;
$$;

-- Create function to get referral reward amount based on user type
CREATE OR REPLACE FUNCTION public.get_referral_reward_amount(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type text;
BEGIN
  user_type := public.get_user_type(p_user_id);
  
  CASE user_type
    WHEN 'driver' THEN
      RETURN 2000;
    WHEN 'client' THEN
      RETURN 500;
    WHEN 'admin' THEN
      RETURN 2000;
    WHEN 'partner' THEN
      RETURN 2000;
    ELSE
      RETURN 500; -- Default to client reward
  END CASE;
END;
$$;

-- Generate unique referral codes function if not exists
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_code text;
  exists_check integer;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i integer;
BEGIN
  LOOP
    generated_code := '';
    FOR i IN 1..6 LOOP
      generated_code := generated_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT COUNT(*) INTO exists_check 
    FROM public.referrals 
    WHERE referral_code = generated_code;
    
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN generated_code;
END;
$$;