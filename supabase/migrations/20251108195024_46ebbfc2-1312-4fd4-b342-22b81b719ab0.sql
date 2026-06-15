-- ============================================================================
-- 🔧 CORRECTION COMPLÈTE DU SYSTÈME DE TRANSFERTS
-- Date: 2025-11-08
-- Problème: Noms NULL car display_name n'existe pas dans driver_profiles/partner_profiles
-- Solution: Fonction utilitaire + vue unifiée + correction execute_wallet_transfer
-- ============================================================================

-- ============================================================================
-- PHASE 1: Fonction utilitaire pour récupérer les noms d'utilisateurs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_display_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- 1. Chercher dans clients
  SELECT display_name INTO v_name
  FROM public.clients
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  
  -- 2. Chercher dans partner_profiles (company_name)
  SELECT company_name INTO v_name
  FROM public.partner_profiles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  
  -- 3. Chercher dans driver_profiles (utiliser auth.users.raw_user_meta_data)
  SELECT au.raw_user_meta_data->>'display_name' INTO v_name
  FROM auth.users au
  JOIN public.driver_profiles dp ON dp.user_id = au.id
  WHERE au.id = p_user_id
  LIMIT 1;
  
  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  
  -- 4. Fallback : auth.users.raw_user_meta_data directement
  SELECT raw_user_meta_data->>'display_name' INTO v_name
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  
  -- 5. Fallback ultime : partie avant @ de l'email
  SELECT SPLIT_PART(email, '@', 1) INTO v_name
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_name, 'Utilisateur');
END;
$$;

COMMENT ON FUNCTION public.get_user_display_name IS 
'Fonction utilitaire pour récupérer le nom d''affichage d''un utilisateur.
Recherche dans cet ordre: clients.display_name → partner_profiles.company_name → auth.users.raw_user_meta_data → email';

-- ============================================================================
-- PHASE 2: Vue unifiée des profils utilisateurs
-- ============================================================================

CREATE OR REPLACE VIEW public.user_profiles_unified AS
SELECT 
  au.id as user_id,
  au.email,
  COALESCE(
    c.display_name,
    pp.company_name,
    au.raw_user_meta_data->>'display_name',
    SPLIT_PART(au.email, '@', 1)
  ) as display_name,
  COALESCE(c.phone_number, pp.company_phone, au.phone) as phone_number,
  COALESCE(
    au.raw_user_meta_data->>'role',
    CASE 
      WHEN c.id IS NOT NULL THEN 'client'
      WHEN pp.id IS NOT NULL THEN 'partner'
      WHEN dp.id IS NOT NULL THEN 'driver'
      ELSE 'unknown'
    END
  ) as role,
  COALESCE(c.is_active, pp.validation_status = 'approved', dp.is_active, true) as is_active,
  au.created_at
FROM auth.users au
LEFT JOIN public.clients c ON c.user_id = au.id
LEFT JOIN public.partner_profiles pp ON pp.user_id = au.id
LEFT JOIN public.driver_profiles dp ON dp.user_id = au.id;

COMMENT ON VIEW public.user_profiles_unified IS 
'Vue unifiée de tous les profils utilisateurs pour simplifier les requêtes.
Combine clients, partner_profiles, driver_profiles et auth.users.';

-- ============================================================================
-- PHASE 3: Fonction RPC pour rechercher un utilisateur par email
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(p_email)
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_user_by_email IS 
'Fonction RPC pour rechercher un utilisateur par email dans auth.users.
Utilisée par validate-transfer-recipient pour trouver des utilisateurs sans profil complet.';

-- ============================================================================
-- PHASE 4: Correction de la fonction execute_wallet_transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_wallet_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_wallet RECORD;
  v_recipient_wallet RECORD;
  v_transfer_id UUID;
  v_sender_new_balance NUMERIC;
  v_recipient_new_balance NUMERIC;
  v_recipient_name TEXT;
  v_sender_name TEXT;
BEGIN
  -- Validation des paramètres
  IF p_sender_id IS NULL OR p_recipient_id IS NULL THEN
    RAISE EXCEPTION 'sender_id et recipient_id sont requis';
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Impossible de transférer vers soi-même';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;

  -- Récupérer les wallets avec verrouillage
  SELECT * INTO v_sender_wallet
  FROM public.user_wallets
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet expéditeur introuvable';
  END IF;

  SELECT * INTO v_recipient_wallet
  FROM public.user_wallets
  WHERE user_id = p_recipient_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet destinataire introuvable';
  END IF;

  -- Vérifier le solde
  IF v_sender_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  -- Générer l'ID du transfert
  v_transfer_id := gen_random_uuid();

  -- Calculer les nouveaux soldes
  v_sender_new_balance := v_sender_wallet.balance - p_amount;
  v_recipient_new_balance := v_recipient_wallet.balance + p_amount;

  -- ✅ Récupérer les noms avec la fonction utilitaire
  v_recipient_name := get_user_display_name(p_recipient_id);
  v_sender_name := get_user_display_name(p_sender_id);

  -- Mettre à jour les balances
  UPDATE public.user_wallets
  SET balance = v_sender_new_balance, updated_at = now()
  WHERE user_id = p_sender_id;

  UPDATE public.user_wallets
  SET balance = v_recipient_new_balance, updated_at = now()
  WHERE user_id = p_recipient_id;

  -- Créer l'entrée dans wallet_transfers
  INSERT INTO public.wallet_transfers (
    id, sender_id, recipient_id, amount, currency,
    description, status, created_at
  ) VALUES (
    v_transfer_id, p_sender_id, p_recipient_id, p_amount, 'CDF',
    COALESCE(p_description, 'Transfert KwendaPay'), 'completed', now()
  );

  -- Enregistrer dans wallet_transactions avec descriptions personnalisées
  INSERT INTO public.wallet_transactions (
    user_id, wallet_id, transaction_type, amount, currency,
    description, status, balance_before, balance_after,
    reference_type, reference_id
  ) VALUES
    -- Transaction pour l'expéditeur (débit)
    (
      p_sender_id, 
      v_sender_wallet.id, 
      'transfer_out', 
      -p_amount, 
      'CDF',
      'Transfert envoyé à ' || v_recipient_name, 
      'completed', 
      v_sender_wallet.balance, 
      v_sender_new_balance,
      'wallet_transfer', 
      v_transfer_id
    ),
    -- Transaction pour le destinataire (crédit)
    (
      p_recipient_id, 
      v_recipient_wallet.id, 
      'transfer_in', 
      p_amount, 
      'CDF',
      'Transfert reçu de ' || v_sender_name, 
      'completed', 
      v_recipient_wallet.balance, 
      v_recipient_new_balance,
      'wallet_transfer', 
      v_transfer_id
    );

  -- Retourner le résultat avec les noms
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'sender_new_balance', v_sender_new_balance,
    'recipient_new_balance', v_recipient_new_balance,
    'recipient_name', v_recipient_name,
    'sender_name', v_sender_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors du transfert: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.execute_wallet_transfer IS 
'Fonction de transfert de fonds entre wallets (CORRIGÉE).
✅ Utilise get_user_display_name() pour récupérer les noms correctement.
✅ Descriptions personnalisées : 
  - Expéditeur: "Transfert envoyé à [Nom]"
  - Destinataire: "Transfert reçu de [Nom]"
✅ Support tous types de profils: client, partner, driver';

-- ============================================================================
-- PHASE 5: Corriger les descriptions existantes avec noms NULL
-- ============================================================================

UPDATE public.wallet_transactions wt
SET description = CASE
  WHEN wt.transaction_type = 'transfer_out' THEN 
    'Transfert envoyé à ' || (
      SELECT get_user_display_name(wtr.recipient_id)
      FROM wallet_transfers wtr
      WHERE wtr.id = wt.reference_id::uuid
      LIMIT 1
    )
  WHEN wt.transaction_type = 'transfer_in' THEN 
    'Transfert reçu de ' || (
      SELECT get_user_display_name(wtr.sender_id)
      FROM wallet_transfers wtr
      WHERE wtr.id = wt.reference_id::uuid
      LIMIT 1
    )
  ELSE wt.description
END
WHERE wt.transaction_type IN ('transfer_out', 'transfer_in')
  AND wt.reference_type = 'wallet_transfer'
  AND (
    wt.description LIKE '%un utilisateur%' 
    OR wt.description = 'Transfert envoyé'
    OR wt.description = 'Transfert reçu'
    OR wt.description = 'Transfert KwendaPay'
  );

-- ============================================================================
-- PHASE 6: Grants et sécurité
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_display_name TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email TO authenticated;
GRANT SELECT ON public.user_profiles_unified TO authenticated;