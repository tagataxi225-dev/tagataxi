-- Fix security issue: Function Search Path Mutable
-- Update function to set search_path explicitly
CREATE OR REPLACE FUNCTION update_product_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from active to something else, update moderation status
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    NEW.moderation_status = 'inactive';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';