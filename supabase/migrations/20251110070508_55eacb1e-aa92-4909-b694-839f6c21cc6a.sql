-- ============================================================================
-- AMÉLIORATION FONCTION INSCRIPTION RESTAURANT
-- ============================================================================
-- Note: Impossible de créer un trigger sur auth.users (permissions insuffisantes)
-- Cette migration améliore la fonction handle_new_restaurant_user existante
-- pour une utilisation manuelle ou via application

-- 1. Améliorer la fonction handle_new_restaurant_user avec logging détaillé
CREATE OR REPLACE FUNCTION public.handle_new_restaurant_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_name TEXT;
  v_phone TEXT;
  v_city TEXT;
  v_email TEXT;
  v_profile_id UUID;
BEGIN
  -- Log de début
  RAISE NOTICE '🍽️ [Restaurant] Traitement nouvelle inscription: %', NEW.id;
  
  -- Vérifier si c'est bien un utilisateur restaurant
  IF NEW.raw_user_meta_data->>'user_type' != 'restaurant' THEN
    RAISE NOTICE '⏭️  [Restaurant] Non-restaurant, skip: %', NEW.raw_user_meta_data->>'user_type';
    RETURN NEW;
  END IF;

  -- Extraire les métadonnées
  v_restaurant_name := COALESCE(NEW.raw_user_meta_data->>'restaurant_name', 'Restaurant ' || LEFT(NEW.id::TEXT, 8));
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
  v_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Kinshasa');
  v_email := COALESCE(NEW.email, '');

  RAISE NOTICE '📝 [Restaurant] Données: name=%, phone=%, city=%, email=%', 
    v_restaurant_name, v_phone, v_city, v_email;

  -- 1. Créer le profil restaurant
  BEGIN
    INSERT INTO public.restaurant_profiles (
      user_id,
      restaurant_name,
      phone_number,
      city,
      email,
      is_active,
      verification_status,
      address
    ) VALUES (
      NEW.id,
      v_restaurant_name,
      v_phone,
      v_city,
      v_email,
      true,
      'pending',
      ''
    )
    RETURNING id INTO v_profile_id;

    RAISE NOTICE '✅ [Restaurant] Profil créé: %', v_profile_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ [Restaurant] Erreur création profil: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
  END;

  -- 2. Assigner le rôle restaurant
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'restaurant')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ [Restaurant] Rôle assigné: restaurant';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ [Restaurant] Erreur assignation rôle: % %', SQLERRM, SQLSTATE;
  END;

  -- 3. Notifier les admins (non-bloquant)
  BEGIN
    INSERT INTO public.user_notifications (
      user_id,
      title,
      message,
      type,
      action_url
    )
    SELECT 
      ur.user_id,
      'Nouveau restaurant inscrit',
      'Le restaurant "' || v_restaurant_name || '" s''est inscrit et attend validation.',
      'admin',
      '/operatorx/admin?tab=moderation&subtab=restaurants'
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
    LIMIT 10;

    RAISE NOTICE '📬 [Restaurant] Notifications admin envoyées';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '⚠️  [Restaurant] Erreur notifications: % %', SQLERRM, SQLSTATE;
  END;

  RAISE NOTICE '🎉 [Restaurant] Inscription complétée pour: %', v_restaurant_name;
  RETURN NEW;
END;
$$;

-- 2. Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.handle_new_restaurant_user() IS 
'Fonction appelée pour créer le profil restaurant et assigner les rôles.
IMPORTANT: Le trigger automatique sur auth.users ne peut pas être créé 
car nous n''avons pas les permissions suffisantes. Cette fonction doit 
être appelée manuellement après création d''un utilisateur restaurant,
ou via l''application lors de l''inscription.';

-- 3. Créer une fonction helper pour l'inscription manuelle
CREATE OR REPLACE FUNCTION public.create_restaurant_profile_manual(
  p_user_id UUID,
  p_restaurant_name TEXT,
  p_phone TEXT,
  p_city TEXT,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur introuvable: %', p_user_id;
  END IF;

  -- Créer le profil
  INSERT INTO public.restaurant_profiles (
    user_id,
    restaurant_name,
    phone_number,
    city,
    email,
    is_active,
    verification_status,
    address
  ) VALUES (
    p_user_id,
    p_restaurant_name,
    p_phone,
    p_city,
    p_email,
    true,
    'pending',
    ''
  )
  RETURNING id INTO v_profile_id;

  -- Assigner le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'restaurant')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Notifier les admins
  INSERT INTO public.user_notifications (
    user_id,
    title,
    message,
    type,
    action_url
  )
  SELECT 
    ur.user_id,
    'Nouveau restaurant inscrit',
    'Le restaurant "' || p_restaurant_name || '" s''est inscrit et attend validation.',
    'admin',
    '/operatorx/admin?tab=moderation&subtab=restaurants'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  LIMIT 10;

  v_result := json_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'message', 'Profil restaurant créé avec succès'
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_restaurant_profile_manual IS
'Fonction helper pour créer manuellement un profil restaurant après inscription.
Utiliser cette fonction depuis l''application lors de l''inscription restaurant.';

-- 4. Log de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration restaurant terminée avec succès';
  RAISE NOTICE '📝 Fonction handle_new_restaurant_user améliorée';
  RAISE NOTICE '🔧 Fonction create_restaurant_profile_manual créée';
  RAISE NOTICE '⚠️  NOTE: Trigger automatique non créé (permissions auth.users insuffisantes)';
  RAISE NOTICE '💡 Solution: Appeler create_restaurant_profile_manual depuis l''app';
END $$;