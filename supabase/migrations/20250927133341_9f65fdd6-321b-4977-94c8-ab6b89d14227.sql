-- Fix the handle_new_user function to properly handle partner registrations
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function for partner registration with proper metadata handling
CREATE OR REPLACE FUNCTION public.register_partner_with_metadata(
  p_email text,
  p_password text,
  p_company_name text,
  p_phone_number text,
  p_business_type text DEFAULT 'individual',
  p_service_areas text[] DEFAULT ARRAY['Kinshasa'],
  p_address text DEFAULT NULL,
  p_business_license text DEFAULT NULL,
  p_tax_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_result jsonb;
  new_user_id uuid;
BEGIN
  -- Create user with metadata in auth.users
  SELECT auth.signup(
    p_email,
    p_password,
    jsonb_build_object(
      'role', 'partner',
      'company_name', p_company_name,
      'phone_number', p_phone_number,
      'business_type', p_business_type,
      'service_areas', p_service_areas,
      'address', p_address,
      'business_license', p_business_license,
      'tax_number', p_tax_number
    )
  ) INTO signup_result;
  
  -- Extract user ID from signup result
  new_user_id := (signup_result->'user'->>'id')::uuid;
  
  -- If signup was successful, the trigger will have created the partner profile
  IF new_user_id IS NOT NULL THEN
    -- Update the partner profile with additional details
    UPDATE public.partenaires 
    SET 
      address = p_address,
      business_license = p_business_license,
      tax_number = p_tax_number,
      updated_at = now()
    WHERE user_id = new_user_id;
    
    -- Log the registration
    PERFORM public.log_system_activity(
      'partner_registration_success',
      'New partner registered via function',
      jsonb_build_object(
        'company_name', p_company_name,
        'business_type', p_business_type,
        'user_id', new_user_id
      )
    );
  END IF;
  
  RETURN signup_result;
END;
$$;