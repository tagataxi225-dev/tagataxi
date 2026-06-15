-- ==========================================
-- SECURITY FIXES: Function search_path & RLS
-- ==========================================

-- 1. Fix is_current_user_admin() function with proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 2. Create atomic marketplace payment function
CREATE OR REPLACE FUNCTION public.process_marketplace_payment(
  p_user_id uuid,
  p_total_price numeric,
  p_cart_items jsonb,
  p_delivery_address text,
  p_delivery_zone text DEFAULT NULL,
  p_delivery_fee numeric DEFAULT 0,
  p_phone_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_current_balance numeric;
  v_transaction_id uuid;
  v_order_id uuid;
  v_item jsonb;
BEGIN
  -- Lock wallet row to prevent race conditions
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if wallet exists
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Verify sufficient balance
  IF v_current_balance < p_total_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Create wallet transaction
  INSERT INTO public.wallet_transactions (
    user_id,
    wallet_id,
    transaction_type,
    amount,
    description,
    reference_type,
    status,
    balance_before,
    balance_after,
    payment_method,
    currency
  ) VALUES (
    p_user_id,
    v_wallet_id,
    'debit',
    p_total_price,
    'Achat marketplace - ' || jsonb_array_length(p_cart_items) || ' article(s)',
    'marketplace_order',
    'completed',
    v_current_balance,
    v_current_balance - p_total_price,
    'kwenda_pay',
    'CDF'
  )
  RETURNING id INTO v_transaction_id;

  -- Update wallet balance atomically
  UPDATE public.user_wallets
  SET 
    balance = balance - p_total_price,
    updated_at = now()
  WHERE id = v_wallet_id;

  -- Create marketplace order
  INSERT INTO public.marketplace_orders (
    user_id,
    total_amount,
    status,
    delivery_address,
    delivery_zone,
    delivery_fee,
    phone_number,
    payment_method,
    payment_status
  ) VALUES (
    p_user_id,
    p_total_price,
    'pending',
    p_delivery_address,
    p_delivery_zone,
    p_delivery_fee,
    p_phone_number,
    'kwenda_pay',
    'completed'
  )
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    INSERT INTO public.marketplace_order_items (
      order_id,
      product_id,
      quantity,
      price_at_purchase,
      vendor_id
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price_at_purchase')::numeric,
      (v_item->>'vendor_id')::uuid
    );
  END LOOP;

  -- Return success with IDs
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- 3. Fix other functions with missing search_path
-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_marketplace_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated;
