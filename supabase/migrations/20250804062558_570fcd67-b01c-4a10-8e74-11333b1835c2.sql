-- Phase 1: Système de rôles et permissions hiérarchiques

-- Créer l'enum pour les rôles utilisateurs généraux
CREATE TYPE public.user_role AS ENUM (
  'client',
  'driver', 
  'partner',
  'admin'
);

-- Créer l'enum pour les rôles admin hiérarchiques
CREATE TYPE public.admin_role AS ENUM (
  'super_admin',
  'admin_financier',
  'admin_transport', 
  'admin_marketplace',
  'admin_support',
  'moderator'
);

-- Créer l'enum pour les permissions granulaires
CREATE TYPE public.permission AS ENUM (
  'users_read',
  'users_write',
  'users_delete',
  'drivers_read',
  'drivers_write', 
  'drivers_validate',
  'partners_read',
  'partners_write',
  'partners_validate',
  'finance_read',
  'finance_write',
  'finance_admin',
  'transport_read',
  'transport_write',
  'transport_admin',
  'marketplace_read',
  'marketplace_write', 
  'marketplace_moderate',
  'support_read',
  'support_write',
  'support_admin',
  'analytics_read',
  'analytics_admin',
  'system_admin'
);

-- Table des rôles utilisateurs (un utilisateur peut avoir plusieurs rôles)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  admin_role admin_role NULL,
  assigned_by UUID NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, admin_role)
);

-- Table de mapping des permissions par rôle
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  admin_role admin_role NULL,
  permission permission NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, admin_role, permission)
);

-- Activer RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies pour user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin' 
    AND ur.admin_role = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.is_active = true
  )
);

-- Policies pour role_permissions (lecture publique pour les utilisateurs authentifiés)
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Super admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin' 
    AND ur.admin_role = 'super_admin'
    AND ur.is_active = true
  )
);

-- Fonction pour vérifier les permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON (
      rp.role = ur.role 
      AND (rp.admin_role = ur.admin_role OR (rp.admin_role IS NULL AND ur.admin_role IS NULL))
    )
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND rp.permission = _permission
      AND rp.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$$;

-- Fonction pour obtenir tous les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(
  role user_role,
  admin_role admin_role,
  permissions permission[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    ur.role,
    ur.admin_role,
    ARRAY_AGG(rp.permission) as permissions
  FROM public.user_roles ur
  LEFT JOIN public.role_permissions rp ON (
    rp.role = ur.role 
    AND (rp.admin_role = ur.admin_role OR (rp.admin_role IS NULL AND ur.admin_role IS NULL))
    AND rp.is_active = true
  )
  WHERE ur.user_id = _user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  GROUP BY ur.role, ur.admin_role
$$;

-- Trigger pour updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les permissions par défaut pour chaque rôle

-- Client permissions
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('client', NULL, 'transport_read'),
('client', NULL, 'marketplace_read');

-- Driver permissions  
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('driver', NULL, 'transport_read'),
('driver', NULL, 'transport_write'),
('driver', NULL, 'marketplace_read');

-- Partner permissions
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('partner', NULL, 'drivers_read'),
('partner', NULL, 'drivers_write'),
('partner', NULL, 'drivers_validate'),
('partner', NULL, 'transport_read'),
('partner', NULL, 'finance_read'),
('partner', NULL, 'analytics_read');

-- Super Admin permissions (toutes)
INSERT INTO public.role_permissions (role, admin_role, permission) 
SELECT 'admin', 'super_admin', unnest(enum_range(NULL::permission));

-- Admin Financier permissions
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('admin', 'admin_financier', 'users_read'),
('admin', 'admin_financier', 'drivers_read'),
('admin', 'admin_financier', 'partners_read'),
('admin', 'admin_financier', 'finance_read'),
('admin', 'admin_financier', 'finance_write'),
('admin', 'admin_financier', 'finance_admin'),
('admin', 'admin_financier', 'analytics_read');

-- Admin Transport permissions
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('admin', 'admin_transport', 'users_read'),
('admin', 'admin_transport', 'drivers_read'),
('admin', 'admin_transport', 'drivers_write'),
('admin', 'admin_transport', 'drivers_validate'),
('admin', 'admin_transport', 'transport_read'),
('admin', 'admin_transport', 'transport_write'),
('admin', 'admin_transport', 'transport_admin'),
('admin', 'admin_transport', 'analytics_read');

-- Admin Marketplace permissions
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('admin', 'admin_marketplace', 'users_read'),
('admin', 'admin_marketplace', 'marketplace_read'),
('admin', 'admin_marketplace', 'marketplace_write'),
('admin', 'admin_marketplace', 'marketplace_moderate'),
('admin', 'admin_marketplace', 'analytics_read');

-- Admin Support permissions  
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('admin', 'admin_support', 'users_read'),
('admin', 'admin_support', 'users_write'),
('admin', 'admin_support', 'drivers_read'),
('admin', 'admin_support', 'drivers_validate'),
('admin', 'admin_support', 'partners_read'),
('admin', 'admin_support', 'partners_validate'),
('admin', 'admin_support', 'support_read'),
('admin', 'admin_support', 'support_write'),
('admin', 'admin_support', 'support_admin');

-- Moderator permissions
INSERT INTO public.role_permissions (role, admin_role, permission) VALUES
('admin', 'moderator', 'users_read'),
('admin', 'moderator', 'marketplace_read'),
('admin', 'moderator', 'marketplace_moderate'),
('admin', 'moderator', 'support_read'),
('admin', 'moderator', 'support_write');