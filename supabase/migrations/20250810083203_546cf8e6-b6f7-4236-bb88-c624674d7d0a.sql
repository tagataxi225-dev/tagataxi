-- Ajouter la permission teams_admin si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission') THEN
    -- Si le type permission n'existe pas du tout, le créer avec teams_admin
    CREATE TYPE permission AS ENUM ('teams_admin');
  ELSE
    -- Ajouter teams_admin au type existant s'il n'y est pas déjà
    BEGIN
      ALTER TYPE permission ADD VALUE 'teams_admin';
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- La valeur existe déjà, ignorer
    END;
  END IF;
END $$;

-- Migration pour le système de demandes de comptes équipe (version corrigée)

-- 1. Créer la table des demandes de comptes équipe
CREATE TABLE public.team_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  team_size TEXT,
  contact_email TEXT NOT NULL,
  phone TEXT,
  request_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Vérifier et créer les tables principales si elles n'existent pas
CREATE TABLE IF NOT EXISTS public.team_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  industry TEXT,
  team_size TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  member_count INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  subscription_plan TEXT DEFAULT 'basic',
  billing_cycle TEXT DEFAULT 'monthly',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.team_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 3. Activer RLS sur toutes les tables
ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour team_requests (version simplifiée d'abord)
-- Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Users can create their own team requests"
ON public.team_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own team requests"
ON public.team_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politiques temporaires pour les admins (à remplacer plus tard avec has_permission)
CREATE POLICY "Temporary admin access to team requests"
ON public.team_requests
FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' AND is_active = true
));

-- 5. Politiques RLS pour team_accounts
-- Les propriétaires peuvent voir leurs comptes équipe
CREATE POLICY "Owners can view their team accounts"
ON public.team_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Les membres d'équipe peuvent voir leur compte équipe
CREATE POLICY "Team members can view their team account"
ON public.team_accounts
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.team_members 
  WHERE team_id = team_accounts.id 
  AND user_id = auth.uid() 
  AND status = 'active'
));

-- Politiques temporaires pour les admins
CREATE POLICY "Temporary admin access to team accounts"
ON public.team_accounts
FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' AND is_active = true
));

-- Le système peut créer des comptes équipe
CREATE POLICY "System can create team accounts"
ON public.team_accounts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Les propriétaires peuvent mettre à jour leurs comptes équipe
CREATE POLICY "Owners can update their team accounts"
ON public.team_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- 6. Politiques RLS pour team_members
-- Les membres peuvent voir les autres membres de leur équipe
CREATE POLICY "Team members can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.team_members tm 
  WHERE tm.team_id = team_members.team_id 
  AND tm.user_id = auth.uid() 
  AND tm.status = 'active'
));

-- Les admins d'équipe peuvent gérer les membres
CREATE POLICY "Team admins can manage members"
ON public.team_members
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.team_members tm 
  WHERE tm.team_id = team_members.team_id 
  AND tm.user_id = auth.uid() 
  AND tm.role = 'admin' 
  AND tm.status = 'active'
));

-- Les administrateurs système peuvent voir tous les membres
CREATE POLICY "System admins can view all team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles 
  WHERE role = 'admin' AND is_active = true
));

-- Le système peut créer des membres d'équipe
CREATE POLICY "System can create team members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. Triggers pour mise à jour automatique
CREATE TRIGGER update_team_requests_updated_at
  BEFORE UPDATE ON public.team_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_accounts_updated_at
  BEFORE UPDATE ON public.team_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Fonction pour compter les membres d'une équipe
CREATE OR REPLACE FUNCTION public.update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.team_accounts
    SET member_count = (
      SELECT COUNT(*) FROM public.team_members 
      WHERE team_id = NEW.team_id AND status = 'active'
    )
    WHERE id = NEW.team_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.team_accounts
    SET member_count = (
      SELECT COUNT(*) FROM public.team_members 
      WHERE team_id = NEW.team_id AND status = 'active'
    )
    WHERE id = NEW.team_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.team_accounts
    SET member_count = (
      SELECT COUNT(*) FROM public.team_members 
      WHERE team_id = OLD.team_id AND status = 'active'
    )
    WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_member_count();

-- 9. Fonction pour créer automatiquement un compte équipe après approbation
CREATE OR REPLACE FUNCTION public.create_team_account_from_request()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Si la demande est approuvée
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Créer le compte équipe
    INSERT INTO public.team_accounts (
      owner_id,
      name,
      contact_email,
      industry,
      team_size,
      phone,
      status
    ) VALUES (
      NEW.user_id,
      NEW.company_name,
      NEW.contact_email,
      NEW.industry,
      NEW.team_size,
      NEW.phone,
      'active'
    ) RETURNING id INTO new_team_id;
    
    -- Ajouter le propriétaire comme admin de l'équipe
    INSERT INTO public.team_members (
      team_id,
      user_id,
      role,
      status,
      invited_by,
      joined_at
    ) VALUES (
      new_team_id,
      NEW.user_id,
      'admin',
      'active',
      NEW.reviewed_by,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_team_account_on_approval
  AFTER UPDATE ON public.team_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_team_account_from_request();