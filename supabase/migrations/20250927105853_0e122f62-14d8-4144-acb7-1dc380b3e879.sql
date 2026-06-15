-- Approche simplifiée : créer l'admin et corriger les policies
-- 1. Temporairement désactiver RLS
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer s'il existe déjà puis insérer
DELETE FROM public.admins WHERE user_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335';
INSERT INTO public.admins (
  user_id, 
  email, 
  display_name, 
  phone_number, 
  admin_level, 
  permissions,
  is_active
) VALUES (
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  'admin-kwenda@kwenda.com',
  'Super Admin',
  '+243999999999',
  'super_admin',
  ARRAY['system_admin', 'user_management', 'content_moderation', 'financial_management'],
  true
);

-- 3. User roles
DELETE FROM public.user_roles WHERE user_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335';
INSERT INTO public.user_roles (
  user_id,
  role,
  admin_role,
  is_active
) VALUES (
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  'admin',
  'super_admin',
  true
);

-- 4. Créer policy simple pour éviter la récursion
DROP POLICY IF EXISTS "user_roles_secure_simple" ON public.user_roles;
CREATE POLICY "user_roles_admin_simple" ON public.user_roles
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid() = 'f15340e1-6c68-4306-b13a-e0c372b1b335'::uuid
);

-- 5. Réactiver RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;