-- Fix the handle_new_user function to include missing address field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_from_metadata text;
BEGIN
  -- Get the role from user metadata, default to 'client'
  user_role_from_metadata := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, user_role_from_metadata::user_role, true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Handle different user types
  IF user_role_from_metadata = 'client' THEN
    INSERT INTO public.clients (
      user_id, 
      display_name, 
      email, 
      phone_number,
      city,
      country
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'city', 'Kinshasa'),
      COALESCE(NEW.raw_user_meta_data ->> 'country', 'RDC')
    );
    
  ELSIF user_role_from_metadata = 'partner' THEN
    INSERT INTO public.partenaires (
      user_id,
      display_name,
      company_name,
      email,
      phone_number,
      business_type,
      service_areas,
      address,
      business_license,
      tax_number,
      verification_status,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Nouveau Partenaire'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'business_type', 'individual'),
      COALESCE(
        (NEW.raw_user_meta_data ->> 'service_areas')::text[], 
        ARRAY['Kinshasa']
      ),
      COALESCE(NEW.raw_user_meta_data ->> 'address', 'Adresse non spécifiée'),
      NEW.raw_user_meta_data ->> 'business_license',
      NEW.raw_user_meta_data ->> 'tax_number',
      'pending',
      false
    );
    
  ELSIF user_role_from_metadata = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id,
      display_name,
      email,
      phone_number,
      verification_status,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      'pending',
      false
    );
    
  ELSIF user_role_from_metadata = 'admin' THEN
    INSERT INTO public.admins (
      user_id,
      display_name,
      email,
      phone_number,
      admin_level,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      'moderator',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;