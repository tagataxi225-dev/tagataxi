-- Création du système de rôles utilisateur sécurisé
-- Évite les problèmes de RLS récursif

-- 1. Création des énums pour les rôles
CREATE TYPE public.user_role AS ENUM ('admin', 'driver', 'partner', 'client');
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'content_moderator', 'finance_admin', 'support_agent');

-- 2. Table des rôles utilisateur
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    admin_role admin_role,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 3. Activer RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Fonction sécurisée pour vérifier les rôles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 5. Fonction pour vérifier les rôles admin
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _admin_role admin_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND admin_role = _admin_role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 6. Fonction pour obtenir le rôle principal d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'partner' THEN 2
      WHEN 'driver' THEN 3
      WHEN 'client' THEN 4
    END
  LIMIT 1;
$$;

-- 7. Policies RLS pour user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_admin_role(auth.uid(), 'super_admin'));

-- 8. Fonction pour créer un admin (temporaire pour vous donner accès)
CREATE OR REPLACE FUNCTION public.create_super_admin(_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _role_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur depuis l'email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec email % non trouvé', _email;
  END IF;
  
  -- Créer le rôle super admin
  INSERT INTO public.user_roles (user_id, role, admin_role, assigned_by)
  VALUES (_user_id, 'admin', 'super_admin', _user_id)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    admin_role = 'super_admin',
    is_active = true,
    updated_at = now()
  RETURNING id INTO _role_id;
  
  RETURN _role_id;
END;
$$;

-- 9. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_roles_update_timestamp
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_roles_updated_at();