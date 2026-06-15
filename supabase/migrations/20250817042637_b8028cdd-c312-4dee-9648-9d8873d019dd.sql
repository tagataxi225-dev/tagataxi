-- Fix security warnings by adding search_path to functions

-- Fix fonction get_user_role
CREATE OR REPLACE FUNCTION get_user_role(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT := NULL;
BEGIN
  -- Vérifier dans l'ordre de priorité: admin, partenaire, chauffeur, client
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'partenaire';
  ELSIF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'chauffeur';
  ELSIF EXISTS (SELECT 1 FROM public.clients WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'simple_user_client';
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix fonction check_global_email_phone_uniqueness
CREATE OR REPLACE FUNCTION check_global_email_phone_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
  email_count INTEGER := 0;
  phone_count INTEGER := 0;
BEGIN
  -- Vérifier l'unicité de l'email across toutes les tables
  SELECT COUNT(*) INTO email_count FROM (
    SELECT email FROM public.clients WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.chauffeurs WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.admins WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.partenaires WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS emails;

  -- Vérifier l'unicité du téléphone across toutes les tables
  SELECT COUNT(*) INTO phone_count FROM (
    SELECT phone_number FROM public.clients WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.chauffeurs WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.admins WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.partenaires WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS phones;

  IF email_count > 0 THEN
    RAISE EXCEPTION 'Email % déjà utilisé par un autre utilisateur', NEW.email;
  END IF;

  IF phone_count > 0 THEN
    RAISE EXCEPTION 'Numéro de téléphone % déjà utilisé par un autre utilisateur', NEW.phone_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;