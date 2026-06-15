-- Migration corrigée pour le système de demandes de comptes équipe (sans triggers redondants)

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

-- 2. Activer RLS
ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS pour team_requests
CREATE POLICY "Users can create their own team requests"
ON public.team_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own team requests"
ON public.team_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Triggers pour team_requests
CREATE TRIGGER update_team_requests_updated_at
  BEFORE UPDATE ON public.team_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Fonction pour créer automatiquement un compte équipe après approbation
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