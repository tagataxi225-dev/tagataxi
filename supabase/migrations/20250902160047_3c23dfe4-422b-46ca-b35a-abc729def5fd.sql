-- URGENT SECURITY FIXES - Phase 1 & 2
-- Protect business-critical configuration data and secure role management

-- =============================================================================
-- PHASE 1: PROTECT BUSINESS-CRITICAL DATA (URGENT)
-- =============================================================================

-- Secure commission_settings table - Admin access only
CREATE POLICY "admin_only_commission_settings_select" 
ON public.commission_settings 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "admin_only_commission_settings_insert" 
ON public.commission_settings 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "admin_only_commission_settings_update" 
ON public.commission_settings 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "admin_only_commission_settings_delete" 
ON public.commission_settings 
FOR DELETE 
USING (is_current_user_admin());

-- Secure delivery_fees table - Admin access only
CREATE POLICY "admin_only_delivery_fees_select" 
ON public.delivery_fees 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "admin_only_delivery_fees_insert" 
ON public.delivery_fees 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "admin_only_delivery_fees_update" 
ON public.delivery_fees 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "admin_only_delivery_fees_delete" 
ON public.delivery_fees 
FOR DELETE 
USING (is_current_user_admin());

-- =============================================================================
-- PHASE 2: SECURE ROLE MANAGEMENT SYSTEM (URGENT)
-- =============================================================================

-- Secure user_roles table with comprehensive policies
CREATE POLICY "user_roles_self_select" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "super_admin_roles_full_access" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.admin_role = 'super_admin' 
      AND ur.is_active = true
  )
);

CREATE POLICY "prevent_self_role_elevation" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() != user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.admin_role = 'super_admin' 
      AND ur.is_active = true
  )
);

CREATE POLICY "prevent_self_role_modification" 
ON public.user_roles 
FOR UPDATE 
USING (
  auth.uid() != user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.admin_role = 'super_admin' 
      AND ur.is_active = true
  )
);

-- =============================================================================
-- PHASE 3: PROTECT INTERNAL SYSTEMS
-- =============================================================================

-- Secure admin_notifications table
CREATE POLICY "admin_notifications_admin_access" 
ON public.admin_notifications 
FOR ALL 
USING (is_current_user_admin());

-- Secure admin_notification_templates table
CREATE POLICY "admin_notification_templates_admin_access" 
ON public.admin_notification_templates 
FOR ALL 
USING (is_current_user_admin());

-- Secure admin_notification_types table
CREATE POLICY "admin_notification_types_admin_access" 
ON public.admin_notification_types 
FOR ALL 
USING (is_current_user_admin());

-- =============================================================================
-- AUDIT LOGGING FOR ROLE CHANGES
-- =============================================================================

-- Create audit log for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role assignments/changes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      user_id, activity_type, description, 
      reference_id, reference_type, metadata
    ) VALUES (
      NEW.assigned_by, 'role_assigned', 
      'Role assigned: ' || NEW.role || COALESCE(' (' || NEW.admin_role || ')', ''),
      NEW.id, 'user_role',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role', NEW.role,
        'admin_role', NEW.admin_role,
        'assigned_by', NEW.assigned_by
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log role modifications
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      INSERT INTO public.activity_logs (
        user_id, activity_type, description,
        reference_id, reference_type, metadata
      ) VALUES (
        auth.uid(), 'role_revoked',
        'Role revoked: ' || OLD.role || COALESCE(' (' || OLD.admin_role || ')', ''),
        OLD.id, 'user_role',
        jsonb_build_object(
          'target_user_id', OLD.user_id,
          'role', OLD.role,
          'admin_role', OLD.admin_role,
          'revoked_by', auth.uid()
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
CREATE TRIGGER audit_user_role_changes
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- =============================================================================
-- SECURE LOTTERY SYSTEM
-- =============================================================================

-- Secure lottery_tickets table - users can only see their own tickets
CREATE POLICY "lottery_tickets_admin_access" 
ON public.lottery_tickets 
FOR ALL 
USING (is_current_user_admin());

-- Secure lottery_draws table - public read for active draws, admin write
CREATE POLICY "lottery_draws_public_read" 
ON public.lottery_draws 
FOR SELECT 
USING (status IN ('scheduled', 'active', 'completed'));

CREATE POLICY "lottery_draws_admin_write" 
ON public.lottery_draws 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "lottery_draws_admin_update" 
ON public.lottery_draws 
FOR UPDATE 
USING (is_current_user_admin());

-- Secure lottery_entries table - users see own entries, admin sees all
CREATE POLICY "lottery_entries_self_access" 
ON public.lottery_entries 
FOR ALL 
USING (auth.uid() = user_id OR is_current_user_admin());

-- Secure lottery_wins table - users see own wins, admin sees all
CREATE POLICY "lottery_wins_self_access" 
ON public.lottery_wins 
FOR ALL 
USING (auth.uid() = user_id OR is_current_user_admin());

-- Secure lottery_prize_types table - public read, admin write
CREATE POLICY "lottery_prize_types_public_read" 
ON public.lottery_prize_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "lottery_prize_types_admin_write" 
ON public.lottery_prize_types 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "lottery_prize_types_admin_update" 
ON public.lottery_prize_types 
FOR UPDATE 
USING (is_current_user_admin());