-- Permettre moderator_id NULL pour approbations automatiques
ALTER TABLE rental_moderation_logs 
ALTER COLUMN moderator_id DROP NOT NULL;

-- Corriger le trigger pour mapper correctement les statuts
CREATE OR REPLACE FUNCTION log_rental_moderation_change()
RETURNS TRIGGER AS $$
DECLARE
  action_value TEXT;
BEGIN
  -- Mapper moderation_status vers les valeurs action autorisées
  IF NEW.moderation_status = 'approved' THEN
    action_value := 'approve';
  ELSIF NEW.moderation_status = 'rejected' THEN
    action_value := 'reject';
  ELSIF NEW.moderation_status = 'pending' THEN
    action_value := 'pending';
  ELSE
    action_value := 'pending'; -- Fallback
  END IF;

  INSERT INTO public.rental_moderation_logs (
    vehicle_id,
    moderator_id,
    action,
    previous_status,
    new_status,
    rejection_reason,
    moderated_at
  ) VALUES (
    NEW.id,
    NEW.moderator_id,
    action_value,
    OLD.moderation_status,
    NEW.moderation_status,
    NEW.rejection_reason,
    COALESCE(NEW.moderated_at, now())
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approuver automatiquement tous les véhicules en attente
UPDATE rental_vehicles 
SET 
  moderation_status = 'approved',
  updated_at = NOW()
WHERE moderation_status = 'pending'
  AND is_active = true;