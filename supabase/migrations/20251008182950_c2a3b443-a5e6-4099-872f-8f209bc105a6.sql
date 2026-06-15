-- Création de 3 comptes de test pour l'équipe Kwenda
-- ATTENTION: Ces comptes sont pour test/démo uniquement

-- 1. Compte CHAUFFEUR TEST
-- Email: chauffeur.test@kwenda.cd
-- Mot de passe: Kwenda2025!
-- User ID sera généré automatiquement par Supabase Auth

-- Note: Les mots de passe doivent être créés manuellement via Supabase Dashboard
-- ou via l'interface d'inscription car ils nécessitent un hachage bcrypt

-- 2. Compte PARTENAIRE TEST
-- Email: partenaire.test@kwenda.cd
-- Mot de passe: Kwenda2025!

-- 3. Compte MULTI-RÔLE (Driver + Partner)
-- Email: multi.test@kwenda.cd
-- Mot de passe: Kwenda2025!

-- Cette migration crée une fonction helper pour faciliter la création de comptes de test
-- Les administrateurs devront ensuite créer les comptes via Supabase Auth Dashboard

-- Fonction pour vérifier si un email de test existe déjà
CREATE OR REPLACE FUNCTION public.check_test_account_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Vérifier dans auth.users (note: accès limité en production)
  SELECT EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE email = p_email
    UNION
    SELECT 1 FROM public.partenaires WHERE email = p_email
    UNION
    SELECT 1 FROM public.clients WHERE email = p_email
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- Fonction pour créer un profil chauffeur de test (à appeler après création Auth)
CREATE OR REPLACE FUNCTION public.create_test_driver_profile(
  p_user_id UUID,
  p_email TEXT,
  p_display_name TEXT,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Créer le profil chauffeur
  INSERT INTO public.chauffeurs (
    user_id,
    email,
    display_name,
    phone_number,
    service_category,
    service_type,
    has_own_vehicle,
    vehicle_type,
    verification_status,
    is_active,
    availability_status,
    license_number,
    license_expiry
  ) VALUES (
    p_user_id,
    p_email,
    p_display_name,
    p_phone,
    'taxi',
    'eco',
    true,
    'sedan',
    'approved',
    true,
    'online',
    'TEST-DRV-001',
    CURRENT_DATE + INTERVAL '2 years'
  )
  RETURNING id INTO v_driver_id;
  
  RETURN v_driver_id;
END;
$$;

-- Fonction pour créer un profil partenaire de test
CREATE OR REPLACE FUNCTION public.create_test_partner_profile(
  p_user_id UUID,
  p_email TEXT,
  p_company_name TEXT,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_partner_id UUID;
BEGIN
  -- Créer le profil partenaire
  INSERT INTO public.partenaires (
    user_id,
    display_name,
    company_name,
    email,
    phone_number,
    business_type,
    address,
    verification_status,
    is_active,
    commission_rate,
    service_areas
  ) VALUES (
    p_user_id,
    p_company_name,
    p_company_name,
    p_email,
    p_phone,
    'company',
    'Adresse Test Kinshasa, RDC',
    'approved',
    true,
    15.00,
    ARRAY['Kinshasa']
  )
  RETURNING id INTO v_partner_id;
  
  RETURN v_partner_id;
END;
$$;

-- Commentaires pour les administrateurs
COMMENT ON FUNCTION public.create_test_driver_profile IS 'Crée un profil chauffeur de test après création du compte Auth. Appeler avec: SELECT create_test_driver_profile(user_id, email, nom, telephone)';
COMMENT ON FUNCTION public.create_test_partner_profile IS 'Crée un profil partenaire de test après création du compte Auth. Appeler avec: SELECT create_test_partner_profile(user_id, email, nom_entreprise, telephone)';

-- Instructions pour créer les comptes (à exécuter manuellement dans Supabase Dashboard)
/*
ÉTAPES POUR CRÉER LES COMPTES DE TEST:

1. CHAUFFEUR TEST
   - Aller dans Authentication > Users > Add User
   - Email: chauffeur.test@kwenda.cd
   - Password: Kwenda2025!
   - Confirm Email: OUI
   - Copier le User ID généré
   - Exécuter: SELECT create_test_driver_profile('USER_ID_ICI', 'chauffeur.test@kwenda.cd', 'Chauffeur Test', '+243900000001');

2. PARTENAIRE TEST
   - Add User
   - Email: partenaire.test@kwenda.cd
   - Password: Kwenda2025!
   - Confirm Email: OUI
   - Copier le User ID
   - Exécuter: SELECT create_test_partner_profile('USER_ID_ICI', 'partenaire.test@kwenda.cd', 'Transport Test SARL', '+243900000002');

3. MULTI-RÔLE TEST (Driver + Partner)
   - Add User
   - Email: multi.test@kwenda.cd
   - Password: Kwenda2025!
   - Confirm Email: OUI
   - Copier le User ID
   - Exécuter les DEUX fonctions:
     SELECT create_test_driver_profile('USER_ID_ICI', 'multi.test@kwenda.cd', 'Multi Test', '+243900000003');
     SELECT create_test_partner_profile('USER_ID_ICI', 'multi.test@kwenda.cd', 'Multi Test Fleet', '+243900000003');
*/