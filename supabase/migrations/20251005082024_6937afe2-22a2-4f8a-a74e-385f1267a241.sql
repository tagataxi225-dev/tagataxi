-- ============================================================
-- MIGRATION COMPLÈTE SYSTÈME DE TOMBOLA KWENDA
-- Phases 1-2-3: Extension DB + Sécurité RLS + Fonctions Admin
-- Date: 2025-01-05
-- ============================================================

-- ============================================================
-- PHASE 0: CRÉER L'ENUM lottery_win_status
-- ============================================================

-- Créer l'ENUM s'il n'existe pas
DO $$ BEGIN
  CREATE TYPE lottery_win_status AS ENUM ('pending', 'claimed', 'credited', 'expired', 'validated', 'in_delivery', 'delivered', 'cancelled', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN
    -- L'ENUM existe déjà, ajouter seulement les nouvelles valeurs
    ALTER TYPE lottery_win_status ADD VALUE IF NOT EXISTS 'validated';
    ALTER TYPE lottery_win_status ADD VALUE IF NOT EXISTS 'in_delivery';
    ALTER TYPE lottery_win_status ADD VALUE IF NOT EXISTS 'delivered';
    ALTER TYPE lottery_win_status ADD VALUE IF NOT EXISTS 'cancelled';
    ALTER TYPE lottery_win_status ADD VALUE IF NOT EXISTS 'disputed';
END $$;

-- ============================================================
-- PHASE 1: EXTENSION DE LA BASE DE DONNÉES
-- ============================================================

-- 1.1 Ajouter colonnes à lottery_wins pour gestion gains physiques
ALTER TABLE public.lottery_wins
ADD COLUMN IF NOT EXISTS delivery_method text CHECK (delivery_method IN ('wallet_credit', 'physical_pickup', 'home_delivery', 'partner_location')),
ADD COLUMN IF NOT EXISTS delivery_status text,
ADD COLUMN IF NOT EXISTS physical_delivery_info jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS recipient_signature text,
ADD COLUMN IF NOT EXISTS proof_of_delivery jsonb DEFAULT '{}'::jsonb;

-- 1.2 Créer table lottery_prize_deliveries pour tracking livraisons physiques
CREATE TABLE IF NOT EXISTS public.lottery_prize_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  win_id uuid NOT NULL REFERENCES public.lottery_wins(id) ON DELETE CASCADE,
  delivery_method text NOT NULL CHECK (delivery_method IN ('physical_pickup', 'home_delivery', 'partner_location')),
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'scheduled', 'in_transit', 'delivered', 'failed', 'cancelled')),
  
  -- Informations de livraison
  delivery_address text,
  delivery_contact_name text,
  delivery_contact_phone text,
  scheduled_date timestamp with time zone,
  delivered_at timestamp with time zone,
  
  -- Personnel de livraison
  delivery_person_id uuid REFERENCES public.chauffeurs(user_id),
  delivery_person_name text,
  
  -- Preuve de livraison
  recipient_signature text,
  delivery_photo_urls text[],
  delivery_notes text,
  
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 1.3 Créer table lottery_admin_actions pour audit actions admin
CREATE TABLE IF NOT EXISTS public.lottery_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL CHECK (action_type IN ('validate_win', 'reject_win', 'schedule_delivery', 'mark_delivered', 'cancel_win', 'edit_draw', 'cancel_draw', 'manual_draw')),
  target_type text NOT NULL CHECK (target_type IN ('lottery_win', 'lottery_draw', 'lottery_entry')),
  target_id uuid NOT NULL,
  
  -- Détails de l'action
  previous_data jsonb,
  new_data jsonb,
  reason text,
  notes text,
  
  -- Métadonnées
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- 1.4 Ajouter index pour performance
CREATE INDEX IF NOT EXISTS idx_lottery_wins_delivery_method ON public.lottery_wins(delivery_method);
CREATE INDEX IF NOT EXISTS idx_lottery_wins_delivery_status ON public.lottery_wins(delivery_status);
CREATE INDEX IF NOT EXISTS idx_lottery_wins_validated_by ON public.lottery_wins(validated_by);
CREATE INDEX IF NOT EXISTS idx_lottery_prize_deliveries_win_id ON public.lottery_prize_deliveries(win_id);
CREATE INDEX IF NOT EXISTS idx_lottery_prize_deliveries_status ON public.lottery_prize_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_lottery_admin_actions_admin_id ON public.lottery_admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_lottery_admin_actions_target ON public.lottery_admin_actions(target_type, target_id);

-- ============================================================
-- PHASE 2: SÉCURITÉ RLS AVANCÉE
-- ============================================================

-- 2.1 Supprimer anciennes policies sur lottery_wins
DROP POLICY IF EXISTS "lottery_wins_view_own" ON public.lottery_wins;
DROP POLICY IF EXISTS "lottery_wins_claim_own" ON public.lottery_wins;
DROP POLICY IF EXISTS "lottery_wins_admin_full" ON public.lottery_wins;
DROP POLICY IF EXISTS "Users can view their lottery wins" ON public.lottery_wins;

-- 2.2 Nouvelles policies granulaires pour lottery_wins
CREATE POLICY "lottery_wins_view_own"
  ON public.lottery_wins
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_current_user_admin()
  );

CREATE POLICY "lottery_wins_claim_own"
  ON public.lottery_wins
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('claimed', 'pending')
  );

CREATE POLICY "lottery_wins_admin_full"
  ON public.lottery_wins
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- 2.3 Policies pour lottery_draws
DROP POLICY IF EXISTS "lottery_draws_public_view" ON public.lottery_draws;
DROP POLICY IF EXISTS "lottery_draws_admin_manage" ON public.lottery_draws;
DROP POLICY IF EXISTS "Users can view active lottery draws" ON public.lottery_draws;

CREATE POLICY "lottery_draws_public_view"
  ON public.lottery_draws
  FOR SELECT
  USING (
    status IN ('scheduled', 'active')
    OR is_current_user_admin()
  );

CREATE POLICY "lottery_draws_admin_manage"
  ON public.lottery_draws
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- 2.4 Policies pour lottery_prize_deliveries
CREATE POLICY "lottery_deliveries_view_own"
  ON public.lottery_prize_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lottery_wins
      WHERE lottery_wins.id = lottery_prize_deliveries.win_id
      AND lottery_wins.user_id = auth.uid()
    )
    OR auth.uid() = delivery_person_id
    OR is_current_user_admin()
  );

CREATE POLICY "lottery_deliveries_admin_manage"
  ON public.lottery_prize_deliveries
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- 2.5 Policies pour lottery_admin_actions
CREATE POLICY "lottery_admin_actions_view"
  ON public.lottery_admin_actions
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "lottery_admin_actions_insert"
  ON public.lottery_admin_actions
  FOR INSERT
  WITH CHECK (is_current_user_admin() AND auth.uid() = admin_id);

-- 2.6 Activer RLS sur nouvelles tables
ALTER TABLE public.lottery_prize_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PHASE 3: FONCTIONS SÉCURISÉES POUR ADMIN
-- ============================================================

-- 3.1 Fonction: Valider un gain (admin)
CREATE OR REPLACE FUNCTION public.validate_lottery_win(
  p_win_id uuid,
  p_delivery_method text,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_win RECORD;
  v_result jsonb;
BEGIN
  -- Vérifier permissions admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Accès refusé: Privilèges administrateur requis'
    );
  END IF;

  -- Récupérer le gain
  SELECT * INTO v_win
  FROM public.lottery_wins
  WHERE id = p_win_id;

  IF v_win IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Gain non trouvé'
    );
  END IF;

  -- Vérifier que le gain est en attente ou réclamé
  IF v_win.status NOT IN ('pending', 'claimed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le gain ne peut pas être validé (statut: ' || v_win.status || ')'
    );
  END IF;

  -- Mettre à jour le gain
  UPDATE public.lottery_wins
  SET 
    status = 'validated'::lottery_win_status,
    delivery_method = p_delivery_method,
    admin_notes = p_admin_notes,
    validated_by = auth.uid(),
    validated_at = now(),
    updated_at = now()
  WHERE id = p_win_id;

  -- Si crédit wallet, créditer directement
  IF p_delivery_method = 'wallet_credit' THEN
    -- Créer transaction wallet
    INSERT INTO public.wallet_transactions (
      user_id,
      wallet_id,
      transaction_type,
      amount,
      currency,
      description,
      reference_type,
      reference_id,
      status
    )
    SELECT 
      v_win.user_id,
      uw.id,
      'credit',
      v_win.prize_value,
      v_win.currency,
      'Gain tombola: ' || v_win.prize_details->>'name',
      'lottery_win',
      v_win.id,
      'completed'
    FROM public.user_wallets uw
    WHERE uw.user_id = v_win.user_id 
    AND uw.currency = v_win.currency
    LIMIT 1;

    -- Mettre à jour solde wallet
    UPDATE public.user_wallets
    SET 
      balance = balance + v_win.prize_value,
      updated_at = now()
    WHERE user_id = v_win.user_id 
    AND currency = v_win.currency;

    -- Marquer comme crédité
    UPDATE public.lottery_wins
    SET status = 'credited'::lottery_win_status
    WHERE id = p_win_id;
  END IF;

  -- Logger l'action admin
  INSERT INTO public.lottery_admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    new_data,
    reason,
    notes
  ) VALUES (
    auth.uid(),
    'validate_win',
    'lottery_win',
    p_win_id,
    jsonb_build_object(
      'delivery_method', p_delivery_method,
      'prize_value', v_win.prize_value,
      'currency', v_win.currency
    ),
    'Validation administrative',
    p_admin_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'win_id', p_win_id,
    'delivery_method', p_delivery_method,
    'status', CASE WHEN p_delivery_method = 'wallet_credit' THEN 'credited' ELSE 'validated' END
  );
END;
$$;

-- 3.2 Fonction: Marquer un gain physique comme livré
CREATE OR REPLACE FUNCTION public.mark_prize_delivered(
  p_win_id uuid,
  p_recipient_signature text DEFAULT NULL,
  p_delivery_notes text DEFAULT NULL,
  p_delivery_photo_urls text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_win RECORD;
  v_delivery_id uuid;
BEGIN
  -- Vérifier permissions admin
  IF NOT is_current_user_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Accès refusé: Privilèges administrateur requis'
    );
  END IF;

  -- Récupérer le gain
  SELECT * INTO v_win
  FROM public.lottery_wins
  WHERE id = p_win_id;

  IF v_win IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gain non trouvé');
  END IF;

  -- Vérifier que c'est un gain physique validé
  IF v_win.delivery_method NOT IN ('physical_pickup', 'home_delivery', 'partner_location') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ce gain ne nécessite pas de livraison physique'
    );
  END IF;

  IF v_win.status NOT IN ('validated', 'in_delivery') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le gain doit être validé avant livraison'
    );
  END IF;

  -- Mettre à jour le gain
  UPDATE public.lottery_wins
  SET 
    status = 'delivered'::lottery_win_status,
    delivery_status = 'delivered',
    recipient_signature = p_recipient_signature,
    proof_of_delivery = jsonb_build_object(
      'signature', p_recipient_signature,
      'notes', p_delivery_notes,
      'photos', COALESCE(p_delivery_photo_urls, ARRAY[]::text[]),
      'delivered_at', now(),
      'delivered_by', auth.uid()
    ),
    updated_at = now()
  WHERE id = p_win_id;

  -- Mettre à jour la livraison si elle existe
  UPDATE public.lottery_prize_deliveries
  SET 
    delivery_status = 'delivered',
    delivered_at = now(),
    recipient_signature = p_recipient_signature,
    delivery_notes = p_delivery_notes,
    delivery_photo_urls = p_delivery_photo_urls,
    updated_by = auth.uid(),
    updated_at = now()
  WHERE win_id = p_win_id
  RETURNING id INTO v_delivery_id;

  -- Logger l'action
  INSERT INTO public.lottery_admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    new_data,
    notes
  ) VALUES (
    auth.uid(),
    'mark_delivered',
    'lottery_win',
    p_win_id,
    jsonb_build_object(
      'delivery_id', v_delivery_id,
      'delivered_at', now()
    ),
    p_delivery_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'win_id', p_win_id,
    'delivery_id', v_delivery_id,
    'delivered_at', now()
  );
END;
$$;

-- 3.3 Fonction: Statistiques tombola pour admin
CREATE OR REPLACE FUNCTION public.get_lottery_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Vérifier permissions admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Accès refusé: Privilèges administrateur requis';
  END IF;

  SELECT jsonb_build_object(
    'total_tickets', (SELECT COUNT(*) FROM public.lottery_tickets),
    'active_tickets', (SELECT COUNT(*) FROM public.lottery_tickets WHERE status = 'available'),
    'total_draws', (SELECT COUNT(*) FROM public.lottery_draws),
    'scheduled_draws', (SELECT COUNT(*) FROM public.lottery_draws WHERE status = 'scheduled'),
    'completed_draws', (SELECT COUNT(*) FROM public.lottery_draws WHERE status = 'completed'),
    'total_wins', (SELECT COUNT(*) FROM public.lottery_wins),
    'pending_wins', (SELECT COUNT(*) FROM public.lottery_wins WHERE status = 'pending'),
    'claimed_wins', (SELECT COUNT(*) FROM public.lottery_wins WHERE status IN ('claimed', 'validated')),
    'delivered_wins', (SELECT COUNT(*) FROM public.lottery_wins WHERE status = 'delivered'),
    'total_prize_value', (SELECT COALESCE(SUM(prize_value), 0) FROM public.lottery_wins WHERE status != 'expired'),
    'pending_deliveries', (SELECT COUNT(*) FROM public.lottery_prize_deliveries WHERE delivery_status IN ('pending', 'scheduled', 'in_transit')),
    'total_participants', (SELECT COUNT(DISTINCT user_id) FROM public.lottery_tickets),
    'recent_actions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'action_type', action_type,
          'created_at', created_at,
          'admin_id', admin_id
        ) ORDER BY created_at DESC
      )
      FROM public.lottery_admin_actions
      LIMIT 10
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- ============================================================
-- TRIGGERS & MISE À JOUR AUTOMATIQUE
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_lottery_deliveries_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_lottery_prize_deliveries_updated_at ON public.lottery_prize_deliveries;
CREATE TRIGGER update_lottery_prize_deliveries_updated_at
  BEFORE UPDATE ON public.lottery_prize_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lottery_deliveries_timestamp();

-- ============================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.lottery_prize_deliveries IS 'Suivi des livraisons de gains physiques de la tombola';
COMMENT ON TABLE public.lottery_admin_actions IS 'Journal d''audit des actions administratives sur la tombola';
COMMENT ON FUNCTION public.validate_lottery_win IS 'Valide un gain tombola et initialise la livraison (admin uniquement)';
COMMENT ON FUNCTION public.mark_prize_delivered IS 'Marque un gain physique comme livré avec preuve (admin uniquement)';
COMMENT ON FUNCTION public.get_lottery_admin_stats IS 'Récupère les statistiques complètes de la tombola (admin uniquement)';