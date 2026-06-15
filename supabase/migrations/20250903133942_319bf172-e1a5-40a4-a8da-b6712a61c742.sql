-- Phase 3: Final RLS Policies for remaining tables

-- driver_subscriptions table
CREATE POLICY "driver_subscriptions_self_access" ON public.driver_subscriptions
FOR ALL USING (auth.uid() = driver_id OR is_current_user_admin());

-- driver_requests table
CREATE POLICY "driver_requests_participants" ON public.driver_requests
FOR ALL USING (auth.uid() = user_id OR is_current_user_admin());

-- driver_codes table  
CREATE POLICY "driver_codes_self_access" ON public.driver_codes
FOR ALL USING (auth.uid() = driver_id OR is_current_user_admin());

-- admin_notification_templates table
CREATE POLICY "admin_notification_templates_admin_only" ON public.admin_notification_templates
FOR ALL USING (is_current_user_admin());

-- admin_notification_types table
CREATE POLICY "admin_notification_types_admin_only" ON public.admin_notification_types
FOR ALL USING (is_current_user_admin());

-- admin_access_logs table
CREATE POLICY "admin_access_logs_admin_only" ON public.admin_access_logs
FOR ALL USING (is_current_user_admin());

-- delivery_location_access_logs table
CREATE POLICY "delivery_location_access_logs_admin_only" ON public.delivery_location_access_logs
FOR ALL USING (is_current_user_admin());

-- delivery_fees table  
CREATE POLICY "delivery_fees_public_read" ON public.delivery_fees
FOR SELECT USING (is_active = true);

CREATE POLICY "delivery_fees_admin_manage" ON public.delivery_fees
FOR ALL USING (is_current_user_admin());

-- commission_settings table
CREATE POLICY "commission_settings_public_read" ON public.commission_settings
FOR SELECT USING (is_active = true);

CREATE POLICY "commission_settings_admin_manage" ON public.commission_settings
FOR ALL USING (is_current_user_admin());

-- Create generic policies for any remaining tables with RLS but no policies
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Find tables with RLS enabled but no policies
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables t
        WHERE schemaname = 'public'
        AND EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = t.schemaname
            AND c.relname = t.tablename
            AND c.relrowsecurity = true
        )
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = t.schemaname
            AND p.tablename = t.tablename
        )
    LOOP
        -- Create admin-only policies for tables without explicit policies
        EXECUTE format('CREATE POLICY "%s_admin_access" ON %I.%I FOR ALL USING (is_current_user_admin())',
                      table_record.tablename || '_admin_access',
                      table_record.schemaname,
                      table_record.tablename);
    END LOOP;
END $$;