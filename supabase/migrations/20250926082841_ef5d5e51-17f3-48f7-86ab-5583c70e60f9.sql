-- ÉTAPE 4: Fix critical security issues

-- 1. Fix Function Search Path Mutable warnings by adding SET search_path to functions that don't have it
-- Note: We'll identify and fix the most critical ones from the linter output

-- 2. Add proper RLS policies for rental subscription tables if missing

-- First, let's check if rental_subscription_plans has proper RLS
ALTER TABLE public.rental_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Admin-only access to rental subscription plans
CREATE POLICY "rental_subscription_plans_admin_only" ON public.rental_subscription_plans
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.is_active = true
  )
);

-- Ensure partner_rental_subscriptions has proper RLS for admin and partner access
CREATE POLICY "partner_rental_subscriptions_admin_access" ON public.partner_rental_subscriptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.is_active = true
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.partenaires p
    WHERE p.id = partner_rental_subscriptions.partner_id
      AND p.user_id = auth.uid()
      AND p.is_active = true
  )
);

-- 3. Create security audit function for subscription access
CREATE OR REPLACE FUNCTION public.log_subscription_access(
  p_table_name text,
  p_operation text,
  p_subscription_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, resource_id, metadata
  ) VALUES (
    auth.uid(),
    p_operation,
    p_table_name,
    p_subscription_id,
    jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Silent failure if audit table doesn't exist
  NULL;
END;
$$;

-- 4. Create function to safely extend subscription dates
CREATE OR REPLACE FUNCTION public.admin_extend_subscription(
  p_subscription_id uuid,
  p_subscription_type text,
  p_days integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
  v_current_end_date timestamp with time zone;
  v_new_end_date timestamp with time zone;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: Admin privileges required');
  END IF;

  -- Handle different subscription types
  IF p_subscription_type = 'driver' THEN
    SELECT end_date INTO v_current_end_date
    FROM public.driver_subscriptions
    WHERE id = p_subscription_id;
    
    IF v_current_end_date IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Driver subscription not found');
    END IF;
    
    v_new_end_date := v_current_end_date + (p_days || ' days')::interval;
    
    UPDATE public.driver_subscriptions
    SET end_date = v_new_end_date,
        updated_at = now()
    WHERE id = p_subscription_id;
    
  ELSIF p_subscription_type = 'rental' THEN
    SELECT end_date INTO v_current_end_date
    FROM public.partner_rental_subscriptions
    WHERE id = p_subscription_id;
    
    IF v_current_end_date IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Rental subscription not found');
    END IF;
    
    v_new_end_date := v_current_end_date + (p_days || ' days')::interval;
    
    UPDATE public.partner_rental_subscriptions
    SET end_date = v_new_end_date,
        updated_at = now()
    WHERE id = p_subscription_id;
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid subscription type');
  END IF;

  -- Log the action
  PERFORM public.log_subscription_access(
    'subscription_extension',
    'admin_extend',
    p_subscription_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', p_subscription_id,
    'days_added', p_days,
    'new_end_date', v_new_end_date
  );
END;
$$;

-- 5. Create function to safely cancel subscriptions
CREATE OR REPLACE FUNCTION public.admin_cancel_subscription(
  p_subscription_id uuid,
  p_subscription_type text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role 
      AND ur.is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: Admin privileges required');
  END IF;

  -- Handle different subscription types
  IF p_subscription_type = 'driver' THEN
    UPDATE public.driver_subscriptions
    SET status = 'cancelled',
        auto_renew = false,
        updated_at = now()
    WHERE id = p_subscription_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Driver subscription not found');
    END IF;
    
  ELSIF p_subscription_type = 'rental' THEN
    UPDATE public.partner_rental_subscriptions
    SET status = 'cancelled',
        auto_renew = false,
        updated_at = now()
    WHERE id = p_subscription_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Rental subscription not found');
    END IF;
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid subscription type');
  END IF;

  -- Log the action
  PERFORM public.log_subscription_access(
    'subscription_cancellation',
    'admin_cancel',
    p_subscription_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', p_subscription_id,
    'reason', p_reason
  );
END;
$$;