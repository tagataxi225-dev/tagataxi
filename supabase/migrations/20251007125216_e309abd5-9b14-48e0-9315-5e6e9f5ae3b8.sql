-- ====================================================================
-- PHASE 3 : AUDIT TRAIL COMPLET (CORRECTION FINALE)
-- ====================================================================

DROP FUNCTION IF EXISTS public.log_security_event(TEXT, TEXT, UUID, BOOLEAN, TEXT, JSONB);

CREATE TABLE IF NOT EXISTS public.sensitive_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL,
  target_user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  data_accessed JSONB,
  access_reason TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sensitive_access_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sensitive_audit_accessed_by ON public.sensitive_access_audit(accessed_by);
CREATE INDEX IF NOT EXISTS idx_sensitive_audit_target_user ON public.sensitive_access_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_audit_created_at ON public.sensitive_access_audit(created_at DESC);

CREATE POLICY "Only super admins view audit logs"
  ON public.sensitive_access_audit FOR SELECT
  TO authenticated USING (is_current_user_super_admin());

CREATE POLICY "System can insert audit logs"
  ON public.sensitive_access_audit FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_audit_id UUID;
BEGIN
  INSERT INTO public.sensitive_access_audit (
    accessed_by, target_user_id, table_name, operation,
    ip_address, user_agent, data_accessed, success, error_message
  ) VALUES (
    auth.uid(), p_resource_id, p_resource_type, p_action_type,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    p_metadata, p_success, p_error_message
  ) RETURNING id INTO v_audit_id;
  RETURN v_audit_id;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;$$;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_methods_strict_isolation"
  ON public.payment_methods FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_own_manage"
  ON public.payment_methods FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_verification_own_access"
  ON public.user_verification FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transport_participants_access" ON public.transport_bookings;

CREATE POLICY "transport_bookings_user_access"
  ON public.transport_bookings FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = driver_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = driver_id);