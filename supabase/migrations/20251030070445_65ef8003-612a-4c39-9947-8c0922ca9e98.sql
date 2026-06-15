-- Sprint 4.1: Security Definer views & Optimisations
-- Migration pour corriger l'inscription partenaire et optimiser les requêtes

-- 1. Ajouter contrainte unique sur partenaires.user_id (vérifier d'abord si elle existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_partner_user_id'
  ) THEN
    ALTER TABLE partenaires ADD CONSTRAINT unique_partner_user_id UNIQUE (user_id);
  END IF;
END $$;

-- 2. Policy RLS pour empêcher doublons de profil partenaire
DROP POLICY IF EXISTS "Prevent duplicate partner registration" ON partenaires;
CREATE POLICY "Prevent duplicate partner registration"
ON partenaires
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM partenaires 
    WHERE user_id = auth.uid()
  )
);

-- 3. Supprimer la fonction existante puis la recréer avec le bon type de retour
DROP FUNCTION IF EXISTS add_partner_role_to_existing_user(UUID, TEXT, TEXT, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION add_partner_role_to_existing_user(
  p_user_id UUID,
  p_company_name TEXT,
  p_phone_number TEXT,
  p_business_type TEXT,
  p_service_areas TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_partner_id UUID;
  v_existing_role BOOLEAN;
BEGIN
  -- Vérifier si le rôle existe déjà
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = 'partner'
  ) INTO v_existing_role;

  -- Ajouter le rôle si nécessaire
  IF NOT v_existing_role THEN
    INSERT INTO user_roles (user_id, role, is_active)
    VALUES (p_user_id, 'partner', true);
  END IF;

  -- Vérifier si le profil partenaire existe déjà
  SELECT id INTO v_partner_id
  FROM partenaires
  WHERE user_id = p_user_id;

  -- Créer le profil partenaire si nécessaire
  IF v_partner_id IS NULL THEN
    INSERT INTO partenaires (
      user_id,
      company_name,
      phone_number,
      business_type,
      service_areas,
      is_verified,
      is_active,
      commission_rate
    ) VALUES (
      p_user_id,
      p_company_name,
      p_phone_number,
      p_business_type::partner_business_type,
      p_service_areas,
      false,
      true,
      0.15
    )
    RETURNING id INTO v_partner_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'message', 'Rôle partenaire ajouté avec succès'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 4. Commentaires pour documentation
COMMENT ON CONSTRAINT unique_partner_user_id ON partenaires IS 
'Empêche la création de doublons de profil partenaire pour un même utilisateur';

COMMENT ON POLICY "Prevent duplicate partner registration" ON partenaires IS 
'Policy RLS qui bloque les tentatives d''inscription en double';

COMMENT ON FUNCTION add_partner_role_to_existing_user IS 
'Ajoute le rôle et le profil partenaire à un utilisateur existant sans créer de doublon';