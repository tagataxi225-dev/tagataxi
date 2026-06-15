-- Enable Realtime for service_configurations
ALTER PUBLICATION supabase_realtime ADD TABLE service_configurations;

-- RLS Policies for service_configurations
ALTER TABLE service_configurations ENABLE ROW LEVEL SECURITY;

-- Public can view active services
CREATE POLICY "Public can view active services"
ON service_configurations
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can manage all services
CREATE POLICY "Admins can manage all services"
ON service_configurations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.is_active = true
  )
);

-- Log service configuration changes
CREATE OR REPLACE FUNCTION log_service_configuration_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when a service is activated or deactivated
  IF (TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active) THEN
    INSERT INTO activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'service_configuration_change',
      CASE 
        WHEN NEW.is_active THEN 'Service activé: ' || NEW.display_name
        ELSE 'Service désactivé: ' || NEW.display_name
      END,
      jsonb_build_object(
        'service_id', NEW.id,
        'service_type', NEW.service_type,
        'service_category', NEW.service_category,
        'was_active', OLD.is_active,
        'is_active', NEW.is_active,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for service configuration changes
DROP TRIGGER IF EXISTS service_configuration_changes_trigger ON service_configurations;
CREATE TRIGGER service_configuration_changes_trigger
AFTER UPDATE ON service_configurations
FOR EACH ROW
EXECUTE FUNCTION log_service_configuration_changes();

-- RLS Policies for service_pricing
ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing
CREATE POLICY "Public can view active pricing"
ON service_pricing
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can manage all pricing
CREATE POLICY "Admins can manage all pricing"
ON service_pricing
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.is_active = true
  )
);