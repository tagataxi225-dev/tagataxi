-- 🔧 Correction des descriptions de transferts
-- Problème : Les transferts affichent "Transfert KwendaPay -933 CDF" pour le destinataire
-- Solution : Différencier "Transfert envoyé" vs "Transfert reçu"

-- 1️⃣ Mettre à jour la fonction execute_wallet_transfer
CREATE OR REPLACE FUNCTION public.execute_wallet_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_description TEXT
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

  -- Récupérer les noms pour personnaliser les descriptions
  SELECT display_name INTO v_recipient_name
  FROM public.clients
  WHERE user_id = p_recipient_id
  LIMIT 1;
  
  SELECT display_name INTO v_sender_name
  FROM public.clients
  WHERE user_id = p_sender_id
  LIMIT 1;

  -- Si pas trouvé dans clients, chercher dans driver_profiles
  IF v_recipient_name IS NULL THEN
    SELECT display_name INTO v_recipient_name
    FROM public.driver_profiles
    WHERE user_id = p_recipient_id
    LIMIT 1;
  END IF;

  IF v_sender_name IS NULL THEN
    SELECT display_name INTO v_sender_name
    FROM public.driver_profiles
    WHERE user_id = p_sender_id
    LIMIT 1;
  END IF;

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

  -- Enregistrer dans wallet_transactions avec descriptions différenciées
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
      'Transfert envoyé à ' || COALESCE(v_recipient_name, 'un utilisateur'), 
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
      'Transfert reçu de ' || COALESCE(v_sender_name, 'un utilisateur'), 
      'completed', 
      v_recipient_wallet.balance, 
      v_recipient_new_balance,
      'wallet_transfer', 
      v_transfer_id
    );

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'sender_new_balance', v_sender_new_balance,
    'recipient_new_balance', v_recipient_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors du transfert: %', SQLERRM;
END;
$$;

-- 2️⃣ Corriger l'historique des transactions existantes
UPDATE public.wallet_transactions
SET description = CASE
  WHEN transaction_type = 'transfer_out' THEN 'Transfert envoyé'
  WHEN transaction_type = 'transfer_in' THEN 'Transfert reçu'
  ELSE description
END
WHERE transaction_type IN ('transfer_out', 'transfer_in')
  AND (description = 'Transfert KwendaPay' OR description LIKE 'Transfert KwendaPay%');

-- 3️⃣ Ajouter un commentaire pour documenter la correction
COMMENT ON FUNCTION public.execute_wallet_transfer IS 
'Fonction de transfert de fonds entre wallets. 
Descriptions personnalisées : 
- Expéditeur: "Transfert envoyé à [Nom]"
- Destinataire: "Transfert reçu de [Nom]"';
