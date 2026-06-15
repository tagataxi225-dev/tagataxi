-- Fix delivery_orders status constraint to include 'assigned' status
ALTER TABLE public.delivery_orders DROP CONSTRAINT IF EXISTS delivery_orders_status_check;

ALTER TABLE public.delivery_orders ADD CONSTRAINT delivery_orders_status_check 
CHECK (status IN ('pending', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'));

-- Create escrow system tables
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  driver_id UUID,
  total_amount NUMERIC NOT NULL,
  seller_amount NUMERIC NOT NULL,
  driver_amount NUMERIC,
  platform_fee NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released_to_seller', 'released_to_driver', 'completed', 'disputed', 'refunded')),
  held_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('seller', 'driver')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  withdrawal_method TEXT NOT NULL DEFAULT 'kwenda_pay',
  kwenda_pay_phone TEXT,
  mobile_money_provider TEXT,
  mobile_money_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  transaction_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow notifications table
CREATE TABLE public.escrow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  escrow_transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow_transactions
CREATE POLICY "Users can view their escrow transactions" ON public.escrow_transactions
FOR SELECT USING (
  auth.uid() = buyer_id OR 
  auth.uid() = seller_id OR 
  auth.uid() = driver_id
);

CREATE POLICY "System can manage escrow transactions" ON public.escrow_transactions
FOR ALL USING (true);

-- RLS Policies for withdrawal_requests  
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawal requests" ON public.withdrawal_requests
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for escrow_notifications
CREATE POLICY "Users can view their own escrow notifications" ON public.escrow_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create escrow notifications" ON public.escrow_notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.escrow_notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_escrow_transactions_order_id ON public.escrow_transactions(order_id);
CREATE INDEX idx_escrow_transactions_buyer_id ON public.escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_transactions_seller_id ON public.escrow_transactions(seller_id);
CREATE INDEX idx_escrow_transactions_driver_id ON public.escrow_transactions(driver_id);
CREATE INDEX idx_escrow_transactions_status ON public.escrow_transactions(status);

CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

CREATE INDEX idx_escrow_notifications_user_id ON public.escrow_notifications(user_id);
CREATE INDEX idx_escrow_notifications_is_read ON public.escrow_notifications(is_read);

-- Create function to automatically release escrow funds
CREATE OR REPLACE FUNCTION public.process_escrow_release(escrow_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  escrow_record RECORD;
  seller_wallet_id UUID;
  driver_wallet_id UUID;
BEGIN
  -- Get escrow transaction details
  SELECT * INTO escrow_record 
  FROM public.escrow_transactions 
  WHERE id = escrow_id AND status = 'held';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get or create seller wallet
  INSERT INTO public.user_wallets (user_id, balance, currency)
  VALUES (escrow_record.seller_id, 0, escrow_record.currency)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  SELECT id INTO seller_wallet_id 
  FROM public.user_wallets 
  WHERE user_id = escrow_record.seller_id AND currency = escrow_record.currency;
  
  -- Update seller wallet balance
  UPDATE public.user_wallets 
  SET balance = balance + escrow_record.seller_amount,
      updated_at = now()
  WHERE id = seller_wallet_id;
  
  -- Create seller transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, transaction_type, amount, currency,
    description, reference_id, reference_type
  ) VALUES (
    seller_wallet_id, escrow_record.seller_id, 'escrow_release', 
    escrow_record.seller_amount, escrow_record.currency,
    'Paiement reçu de la vente', escrow_record.order_id, 'marketplace_order'
  );
  
  -- Process driver payment if exists
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
    (escrow_record.seller_id, escrow_id, 'payment_released', 'Paiement reçu', 'Votre paiement a été libéré et ajouté à votre portefeuille'),
    (escrow_record.buyer_id, escrow_id, 'payment_completed', 'Transaction terminée', 'La transaction a été finalisée avec succès');
  
  IF escrow_record.driver_id IS NOT NULL THEN
    INSERT INTO public.escrow_notifications (user_id, escrow_transaction_id, notification_type, title, message)
    VALUES (escrow_record.driver_id, escrow_id, 'delivery_payment', 'Paiement livraison', 'Votre paiement de livraison a été crédité');
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create trigger to automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_escrow()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_escrow_transactions_updated_at
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_escrow();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_escrow();