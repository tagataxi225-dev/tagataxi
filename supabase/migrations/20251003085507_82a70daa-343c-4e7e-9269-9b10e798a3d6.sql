-- Fix partner registration trigger to handle missing fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_from_metadata text;
  service_areas_array text[];
BEGIN
  user_role_from_metadata := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, user_role_from_metadata::user_role, true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  IF user_role_from_metadata = 'client' THEN
    INSERT INTO public.clients (
      user_id,
      display_name,
      email,
      phone_number,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      true
    );
    
  ELSIF user_role_from_metadata = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id,
      display_name,
      email,
      phone_number,
      license_number,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_plate,
      vehicle_color,
      service_type,
      has_own_vehicle,
      delivery_capacity,
      verification_status,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data ->> 'license_number', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'vehicle_make', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'vehicle_model', ''),
      COALESCE((NEW.raw_user_meta_data ->> 'vehicle_year')::integer, 2020),
      COALESCE(NEW.raw_user_meta_data ->> 'vehicle_plate', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'vehicle_color', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'service_type', 'taxi'),
      COALESCE((NEW.raw_user_meta_data ->> 'has_own_vehicle')::boolean, false),
      COALESCE(NEW.raw_user_meta_data ->> 'delivery_capacity', 'small'),
      'pending',
      false
    );
    
  ELSIF user_role_from_metadata = 'partner' THEN
    -- Parse service_areas from JSON string to PostgreSQL array
    IF NEW.raw_user_meta_data ->> 'service_areas' IS NOT NULL THEN
      BEGIN
        service_areas_array := ARRAY(
          SELECT jsonb_array_elements_text(
            (NEW.raw_user_meta_data ->> 'service_areas')::jsonb
          )
        );
      EXCEPTION WHEN OTHERS THEN
        service_areas_array := ARRAY['Kinshasa'];
      END;
    ELSE
      service_areas_array := ARRAY['Kinshasa'];
    END IF;
    
    INSERT INTO public.partenaires (
      user_id,
      display_name,
      company_name,
      email,
      phone_number,
      business_type,
      service_areas,
      address,
      company_registration_number,
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
      service_areas_array,
      COALESCE(NEW.raw_user_meta_data ->> 'address', 'Adresse non spécifiée'),
      COALESCE(NEW.raw_user_meta_data ->> 'business_license', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'tax_number', ''),
      'pending',
      false
    );
    
  ELSIF user_role_from_metadata = 'admin' THEN
    INSERT INTO public.admins (
      user_id,
      display_name,
      email,
      phone_number,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', NEW.phone),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;