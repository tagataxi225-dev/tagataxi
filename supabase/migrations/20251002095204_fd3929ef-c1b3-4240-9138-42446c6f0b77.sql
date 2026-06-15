-- Corriger le trigger handle_new_user pour résoudre l'erreur "database error saving new user"
-- PROBLÈME: ON CONFLICT (user_id, role) ne correspond pas à la contrainte UNIQUE (user_id, role, admin_role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_from_metadata text;
BEGIN
  -- Récupérer le rôle depuis les métadonnées utilisateur (par défaut 'client')
  user_role_from_metadata := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  
  -- FIX CRITIQUE: Ajouter admin_role NULL et utiliser la bonne contrainte UNIQUE
  INSERT INTO public.user_roles (user_id, role, admin_role, is_active)
  VALUES (NEW.id, user_role_from_metadata::user_role, NULL, true)
  ON CONFLICT (user_id, role, admin_role) DO NOTHING;
  
  -- Créer le profil correspondant selon le rôle
  IF user_role_from_metadata = 'client' THEN
    INSERT INTO public.clients (
      user_id, email, phone_number, display_name
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
    );
  ELSIF user_role_from_metadata = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id, email, phone_number, display_name, service_type
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data ->> 'service_type', 'taxi')
    );
  ELSIF user_role_from_metadata = 'partner' THEN
    INSERT INTO public.partenaires (
      user_id, email, phone_number, company_name
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Entreprise')
    );
  ELSIF user_role_from_metadata = 'admin' THEN
    INSERT INTO public.admins (
      user_id, email, phone_number, display_name
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
    );
  END IF;
  
  RETURN NEW;
END;
$$;