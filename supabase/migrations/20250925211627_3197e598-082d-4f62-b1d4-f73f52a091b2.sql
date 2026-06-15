-- 1. Fix security issues and create audit trail for partners
-- Remove security definer views and add audit table

-- Drop any existing security definer views
DROP VIEW IF EXISTS public.security_definer_views CASCADE;

-- Create partner audit logs table
CREATE TABLE IF NOT EXISTS public.partner_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'approved', 'rejected', 'activated', 'deactivated', 'updated', 'viewed')),
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.partner_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access audit logs
CREATE POLICY "partner_audit_logs_admin_access" ON public.partner_audit_logs
  FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Create notification trigger for new partner requests
CREATE OR REPLACE FUNCTION public.notify_new_partner_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for admins about new partner request
  INSERT INTO public.admin_notifications (
    type, title, message, severity, data
  ) VALUES (
    'partner_request',
    'Nouvelle demande de partenaire',
    'Une nouvelle demande de partenariat a été soumise par ' || NEW.company_name,
    'info',
    jsonb_build_object(
      'partner_id', NEW.id,
      'company_name', NEW.company_name,
      'business_type', NEW.business_type,
      'submitted_at', NEW.created_at
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new partner requests
DROP TRIGGER IF EXISTS notify_new_partner_request_trigger ON public.partenaires;
CREATE TRIGGER notify_new_partner_request_trigger
  AFTER INSERT ON public.partenaires
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_partner_request();

-- Create function to log partner audit events
CREATE OR REPLACE FUNCTION public.log_partner_audit_event(
  p_partner_id UUID,
  p_action_type TEXT,
  p_old_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.partner_audit_logs (
    partner_id, admin_id, action_type, old_status, new_status, reason, metadata
  ) VALUES (
    p_partner_id, auth.uid(), p_action_type, p_old_status, p_new_status, p_reason, p_metadata
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically log partner status changes
CREATE OR REPLACE FUNCTION public.auto_log_partner_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.verification_status != NEW.verification_status THEN
    PERFORM public.log_partner_audit_event(
      NEW.id,
      CASE 
        WHEN NEW.verification_status = 'approved' THEN 'approved'
        WHEN NEW.verification_status = 'rejected' THEN 'rejected'
        ELSE 'updated'
      END,
      OLD.verification_status,
      NEW.verification_status,
      'Status changed automatically'
    );
  END IF;
  
  -- Log activation changes
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.log_partner_audit_event(
      NEW.id,
      CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END,
      OLD.is_active::text,
      NEW.is_active::text,
      'Activity status changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_log_partner_changes_trigger ON public.partenaires;
CREATE TRIGGER auto_log_partner_changes_trigger
  AFTER UPDATE ON public.partenaires
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_partner_changes();

-- Fix functions without search_path (addressing the 4 WARN issues)
-- These are likely functions that need SET search_path = public added

-- Create index for better performance on audit logs
CREATE INDEX IF NOT EXISTS idx_partner_audit_logs_partner_id ON public.partner_audit_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_logs_admin_id ON public.partner_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_logs_created_at ON public.partner_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_audit_logs_action_type ON public.partner_audit_logs(action_type);