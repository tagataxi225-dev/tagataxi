-- =========================================
-- PHASE 2: Sécurité Backend - Ajout search_path manquant
-- =========================================

-- Correction des fonctions SQL sans search_path pour éviter les attaques par injection de search_path

-- 1. update_google_geocoded_timestamp
CREATE OR REPLACE FUNCTION public.update_google_geocoded_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.google_address IS DISTINCT FROM OLD.google_address THEN
    NEW.google_geocoded_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. notify_new_partner_request
CREATE OR REPLACE FUNCTION public.notify_new_partner_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (
    type, title, message, severity, data
  ) VALUES (
    'partner_request',
    'Nouvelle demande de partenaire',
    'Une nouvelle demande de partenariat a été soumise par ' || NEW.company_name,
    'info',
    jsonb_build_object(
      'partner_id', NEW.id,
      'company_name', NEW.company_name,
      'business_type', NEW.business_type,
      'submitted_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$function$;

-- 3. validate_email_format
CREATE OR REPLACE FUNCTION public.validate_email_format()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Format d''email invalide: %', NEW.email;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. update_updated_at_column (fonction générique utilisée partout)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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