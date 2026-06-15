-- ========================================
-- FIX: Empêcher le trigger handle_new_user de créer les partenaires
-- Les partenaires seront créés uniquement via create_partner_profile_secure
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_from_metadata TEXT;
  user_display_name TEXT;
  user_phone TEXT;
BEGIN
  -- ========================================
  -- LOG 1: Trigger appelé
  -- ========================================
  INSERT INTO activity_logs (
    user_id, activity_type, description, metadata
  ) VALUES (
    NEW.id,
    'auth_trigger_handle_new_user_called',
    'Trigger handle_new_user appelé',
    jsonb_build_object(
      'email', NEW.email,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'timestamp', NOW()
    )
  );

  -- Récupérer le rôle depuis les métadonnées
  user_role_from_metadata := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  user_display_name := COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1));
  user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone_number');

  -- ========================================
  -- ✅ CRITICAL FIX: IGNORER LES PARTENAIRES
  -- Les partenaires sont créés via create_partner_profile_secure()
  -- ========================================
  IF user_role_from_metadata = 'partner' THEN
    INSERT INTO activity_logs (
      user_id, activity_type, description, metadata
    ) VALUES (
      NEW.id,
      'auth_trigger_partner_skipped',
      'Trigger ignore partner - géré par create_partner_profile_secure',
      jsonb_build_object(
        'email', NEW.email,
        'role', user_role_from_metadata,
        'timestamp', NOW()
      )
    );
    
    RETURN NEW;  -- Sortir immédiatement sans rien faire
  END IF;

  -- ========================================
  -- LOG 2: Rôle détecté (non-partner)
  -- ========================================
  INSERT INTO activity_logs (
    user_id, activity_type, description, metadata
  ) VALUES (
    NEW.id,
    'auth_trigger_role_detected',
    format('Rôle détecté: %s', user_role_from_metadata),
    jsonb_build_object(
      'role', user_role_from_metadata,
      'display_name', user_display_name,
      'phone', user_phone,
      'timestamp', NOW()
    )
  );

  -- ========================================
  -- CRÉER CLIENT
  -- ========================================
  IF user_role_from_metadata = 'client' THEN
    INSERT INTO public.clients (
      user_id, email, phone_number, display_name, is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(user_phone, '+243000000000'),
      user_display_name,
      true
    );
    
    INSERT INTO activity_logs (
      user_id, activity_type, description, metadata
    ) VALUES (
      NEW.id,
      'auth_trigger_client_created',
      'Profil client créé avec succès',
      jsonb_build_object('timestamp', NOW())
    );

  -- ========================================
  -- CRÉER CHAUFFEUR
  -- ========================================
  ELSIF user_role_from_metadata = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id,
      email,
      phone_number,
      display_name,
      license_number,
      vehicle_plate,
      is_active,
      verification_status
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(user_phone, '+243000000000'),
      user_display_name,
      COALESCE(NEW.raw_user_meta_data ->> 'license_number', 'PENDING'),
      COALESCE(NEW.raw_user_meta_data ->> 'vehicle_plate', 'PENDING'),
      false,
      'pending'
    );
    
    INSERT INTO activity_logs (
      user_id, activity_type, description, metadata
    ) VALUES (
      NEW.id,
      'auth_trigger_driver_created',
      'Profil chauffeur créé avec succès',
      jsonb_build_object('timestamp', NOW())
    );

  -- ========================================
  -- CRÉER ADMIN
  -- ========================================
  ELSIF user_role_from_metadata = 'admin' THEN
    INSERT INTO public.admins (
      user_id,
      email,
      phone_number,
      display_name,
      admin_level,
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(user_phone, '+243000000000'),
      user_display_name,
      'moderator',
      false
    );
    
    INSERT INTO activity_logs (
      user_id, activity_type, description, metadata
    ) VALUES (
      NEW.id,
      'auth_trigger_admin_created',
      'Profil admin créé avec succès',
      jsonb_build_object('timestamp', NOW())
    );
  END IF;

  -- ========================================
  -- CRÉER USER_ROLE
  -- ========================================
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, user_role_from_metadata::user_role, true)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO activity_logs (
    user_id, activity_type, description, metadata
  ) VALUES (
    NEW.id,
    'auth_trigger_completed',
    'Trigger handle_new_user terminé avec succès',
    jsonb_build_object(
      'role', user_role_from_metadata,
      'timestamp', NOW()
    )
  );

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO activity_logs (
      user_id, activity_type, description, metadata
    ) VALUES (
      NEW.id,
      'auth_trigger_error',
      'Erreur dans handle_new_user',
      jsonb_build_object(
        'error_code', SQLSTATE,
        'error_message', SQLERRM,
        'timestamp', NOW()
      )
    );
    
    RAISE;
END;
$$;