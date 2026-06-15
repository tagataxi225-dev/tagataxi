-- ============================================
-- NETTOYAGE DES DONNÉES DEMO KWENDA JOB
-- ============================================

-- Supprimer les candidatures liées aux jobs demo
DELETE FROM job_applications 
WHERE job_id IN (
  SELECT id FROM jobs 
  WHERE company_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  )
);

-- Supprimer les jobs demo
DELETE FROM jobs 
WHERE company_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- Supprimer les entreprises demo
DELETE FROM job_companies 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- ============================================
-- MISE À JOUR DES RLS POLICIES
-- ============================================

-- Supprimer l'ancienne policy permissive pour la création d'offres
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des offres" ON jobs;

-- Créer la fonction pour vérifier les rôles autorisés (partenaire, restaurant, admin)
CREATE OR REPLACE FUNCTION public.can_post_jobs(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id 
    AND role IN ('partner', 'restaurant', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM partenaires
    WHERE user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_profiles
    WHERE user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = _user_id
    AND is_active = true
  )
$$;

-- Nouvelle policy : seuls partenaires, restaurants et admins peuvent créer des offres
CREATE POLICY "Partenaires restaurants et admins peuvent créer des offres"
ON jobs FOR INSERT TO authenticated
WITH CHECK (
  public.can_post_jobs(auth.uid())
  AND posted_by_user_id = auth.uid()
);

-- ============================================
-- AJOUTER UN INDEX POUR LES PERFORMANCES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by_user_id ON jobs(posted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_job_companies_owner_user_id ON job_companies(owner_user_id);