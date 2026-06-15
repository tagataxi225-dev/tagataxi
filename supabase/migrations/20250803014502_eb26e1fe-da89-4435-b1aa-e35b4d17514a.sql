-- Fix generate_driver_code function to use native PostgreSQL functions
CREATE OR REPLACE FUNCTION public.generate_driver_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  code TEXT;
  exists_check INTEGER;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code using native PostgreSQL functions
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM public.driver_codes WHERE code = code;
    
    -- If code doesn't exist, exit loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$