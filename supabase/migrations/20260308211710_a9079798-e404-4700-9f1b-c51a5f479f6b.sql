CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_email text;
  clean_phone text;
BEGIN
  clean_phone := regexp_replace(p_phone, '[\s\-\(\)]', '', 'g');
  
  SELECT email INTO found_email FROM clients 
  WHERE regexp_replace(phone_number, '[\s\-\(\)]', '', 'g') = clean_phone 
    AND is_active = true 
  LIMIT 1;
  IF found_email IS NOT NULL THEN RETURN found_email; END IF;
  
  SELECT email INTO found_email FROM chauffeurs 
  WHERE regexp_replace(phone_number, '[\s\-\(\)]', '', 'g') = clean_phone 
    AND is_active = true 
  LIMIT 1;
  IF found_email IS NOT NULL THEN RETURN found_email; END IF;
  
  SELECT email INTO found_email FROM partenaires 
  WHERE (regexp_replace(phone_number, '[\s\-\(\)]', '', 'g') = clean_phone
    OR regexp_replace(COALESCE(phone, ''), '[\s\-\(\)]', '', 'g') = clean_phone)
    AND is_active = true 
  LIMIT 1;
  IF found_email IS NOT NULL THEN RETURN found_email; END IF;
  
  RETURN NULL;
END;
$$;