-- Créer la table des comptes marchands pour les vendeurs
CREATE TABLE public.merchant_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  pending_withdrawals NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table merchant_accounts
ALTER TABLE public.merchant_accounts ENABLE ROW LEVEL SECURITY;

-- Politique pour que les vendeurs puissent voir et gérer leur propre compte
CREATE POLICY "Vendors can manage their own merchant account" 
ON public.merchant_accounts 
FOR ALL 
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Politique pour que les admins puissent voir tous les comptes marchands
CREATE POLICY "Admins can view all merchant accounts" 
ON public.merchant_accounts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admins 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Créer la table des transactions de compte marchand
CREATE TABLE public.merchant_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_account_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'sale_credit', 'withdrawal', 'fee_deduction'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT, -- 'marketplace_order', 'withdrawal_request'
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table merchant_transactions
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;

-- Politique pour que les vendeurs puissent voir leurs propres transactions
CREATE POLICY "Vendors can view their own merchant transactions" 
ON public.merchant_transactions 
FOR SELECT 
USING (auth.uid() = vendor_id);

-- Politique pour que le système puisse insérer des transactions
CREATE POLICY "System can insert merchant transactions" 
ON public.merchant_transactions 
FOR INSERT 
WITH CHECK (true);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_merchant_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_merchant_accounts_updated_at
  BEFORE UPDATE ON public.merchant_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_merchant_accounts_updated_at();

-- Mettre à jour la fonction process_escrow_release pour créditer le compte marchand
CREATE OR REPLACE FUNCTION public.process_escrow_release(escrow_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  escrow_record RECORD;
  merchant_account_id UUID;
  driver_wallet_id UUID;
BEGIN
  -- Get escrow transaction details
  SELECT * INTO escrow_record 
  FROM public.escrow_transactions 
  WHERE id = escrow_id AND status = 'held';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get or create vendor merchant account
  INSERT INTO public.merchant_accounts (vendor_id, balance, currency)
  VALUES (escrow_record.seller_id, 0, escrow_record.currency)
  ON CONFLICT (vendor_id) DO NOTHING;
  
  SELECT id INTO merchant_account_id 
  FROM public.merchant_accounts 
  WHERE vendor_id = escrow_record.seller_id;
  
  -- Update merchant account balance
  UPDATE public.merchant_accounts 
  SET balance = balance + escrow_record.seller_amount,
      total_earned = total_earned + escrow_record.seller_amount,
      updated_at = now()
  WHERE id = merchant_account_id;
  
  -- Create merchant transaction record
  INSERT INTO public.merchant_transactions (
    merchant_account_id, vendor_id, transaction_type, amount, currency,
    description, reference_id, reference_type,
    balance_before, balance_after
  ) 
  SELECT 
    merchant_account_id, escrow_record.seller_id, 'sale_credit', 
    escrow_record.seller_amount, escrow_record.currency,
    'Paiement de vente reçu', escrow_record.order_id, 'marketplace_order',
    ma.balance - escrow_record.seller_amount, ma.balance
  FROM public.merchant_accounts ma 
  WHERE ma.id = merchant_account_id;
  
  -- Process driver payment if exists (using regular wallet)
  IF escrow_record.driver_id IS NOT NULL AND escrow_record.driver_amount > 0 THEN
    -- Get or create driver wallet
    INSERT INTO public.user_wallets (user_id, balance, currency)
    VALUES (escrow_record.driver_id, 0, escrow_record.currency)
    ON CONFLICT (user_id, currency) DO NOTHING;
    
    SELECT id INTO driver_wallet_id 
    FROM public.user_wallets 
    WHERE user_id = escrow_record.driver_id AND currency = escrow_record.currency;
    
    -- Update driver wallet balance
    UPDATE public.user_wallets 
    SET balance = balance + escrow_record.driver_amount,
        updated_at = now()
    WHERE id = driver_wallet_id;
    
    -- Create driver transaction record
    INSERT INTO public.wallet_transactions (
      wallet_id, user_id, transaction_type, amount, currency,
      description, reference_id, reference_type
    ) VALUES (
      driver_wallet_id, escrow_record.driver_id, 'delivery_payment', 
      escrow_record.driver_amount, escrow_record.currency,
      'Paiement livraison', escrow_record.order_id, 'delivery_order'
    );
  END IF;
  
  -- Update escrow status
  UPDATE public.escrow_transactions 
  SET status = 'completed',
      released_at = now(),
      completed_at = now(),
      updated_at = now()
  WHERE id = escrow_id;
  
  -- Create notifications
  INSERT INTO public.escrow_notifications (user_id, escrow_transaction_id, notification_type, title, message)
  VALUES 
    (escrow_record.seller_id, escrow_id, 'payment_released', 'Paiement reçu', 'Votre paiement a été crédité sur votre Compte Marchand'),
    (escrow_record.buyer_id, escrow_id, 'payment_completed', 'Transaction terminée', 'La transaction a été finalisée avec succès');
  
  IF escrow_record.driver_id IS NOT NULL THEN
    INSERT INTO public.escrow_notifications (user_id, escrow_transaction_id, notification_type, title, message)
    VALUES (escrow_record.driver_id, escrow_id, 'delivery_payment', 'Paiement livraison', 'Votre paiement de livraison a été crédité');
  END IF;
  
  RETURN TRUE;
END;
$function$;