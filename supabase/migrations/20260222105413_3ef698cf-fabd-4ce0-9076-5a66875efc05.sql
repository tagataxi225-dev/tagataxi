
-- ============================================================
-- RLS Policies pour team_accounts et team_members
-- Permettre aux propriétaires de gérer, et aux membres de lire
-- ============================================================

-- Fonction helper pour vérifier si un utilisateur est membre actif d'une équipe
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND status = 'active'
  )
$$;

-- Fonction helper pour vérifier si un utilisateur est propriétaire d'un team_account
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_accounts
    WHERE id = _team_id
      AND owner_id = _user_id
  )
$$;

-- Fonction pour obtenir le team_id d'un propriétaire
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.team_accounts
  WHERE owner_id = _user_id
  LIMIT 1
$$;

-- ── team_accounts policies ──

-- Owner peut lire son propre team_account
CREATE POLICY "Owner can view own team"
ON public.team_accounts FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Membre actif peut lire le team_account
CREATE POLICY "Active members can view team"
ON public.team_accounts FOR SELECT
TO authenticated
USING (
  public.is_team_member(auth.uid(), id)
);

-- Owner peut créer un team_account
CREATE POLICY "Owner can create team"
ON public.team_accounts FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Owner peut modifier son team_account
CREATE POLICY "Owner can update own team"
ON public.team_accounts FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- Owner peut supprimer son team_account
CREATE POLICY "Owner can delete own team"
ON public.team_accounts FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ── team_members policies ──

-- Owner peut voir les membres de son équipe
CREATE POLICY "Owner can view team members"
ON public.team_members FOR SELECT
TO authenticated
USING (
  public.is_team_owner(auth.uid(), team_id)
);

-- Membre peut voir les autres membres de son équipe
CREATE POLICY "Members can view own team members"
ON public.team_members FOR SELECT
TO authenticated
USING (
  public.is_team_member(auth.uid(), team_id)
);

-- Membre peut voir sa propre entrée (même si pending)
CREATE POLICY "User can view own membership"
ON public.team_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owner peut ajouter des membres
CREATE POLICY "Owner can add team members"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (
  public.is_team_owner(auth.uid(), team_id)
);

-- Owner peut modifier les membres
CREATE POLICY "Owner can update team members"
ON public.team_members FOR UPDATE
TO authenticated
USING (
  public.is_team_owner(auth.uid(), team_id)
);

-- Membre peut modifier sa propre entrée (accepter invitation)
CREATE POLICY "Member can update own membership"
ON public.team_members FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Owner peut supprimer des membres
CREATE POLICY "Owner can remove team members"
ON public.team_members FOR DELETE
TO authenticated
USING (
  public.is_team_owner(auth.uid(), team_id)
);
