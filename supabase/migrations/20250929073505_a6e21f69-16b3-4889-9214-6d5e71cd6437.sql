-- Fix orphaned rental vehicles by assigning them to active partners
-- Update orphaned vehicles (where partner_id is null) to assign them to active partners

UPDATE public.rental_vehicles 
SET partner_id = (
  SELECT p.id 
  FROM public.partenaires p 
  WHERE p.is_active = true 
    AND p.verification_status = 'approved'
  ORDER BY p.created_at ASC 
  LIMIT 1
)
WHERE partner_id IS NULL;

-- Ensure all rental vehicles have proper moderation status if missing
UPDATE public.rental_vehicles 
SET moderation_status = 'pending'
WHERE moderation_status IS NULL;

-- Create index for better performance on rental vehicle queries
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_moderation_status 
ON public.rental_vehicles(moderation_status, is_active);

CREATE INDEX IF NOT EXISTS idx_rental_vehicles_partner_id 
ON public.rental_vehicles(partner_id);

-- Create rental moderation logs table for audit trail
CREATE TABLE IF NOT EXISTS public.rental_moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'pending')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  rejection_reason TEXT,
  moderated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on moderation logs
ALTER TABLE public.rental_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policy for rental moderation logs - only admins can access
CREATE POLICY "rental_moderation_logs_admin_access" 
ON public.rental_moderation_logs 
FOR ALL 
USING (is_current_user_admin()) 
WITH CHECK (is_current_user_admin());

-- Function to auto-log moderation changes
CREATE OR REPLACE FUNCTION public.log_rental_moderation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if moderation status changed
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
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
      COALESCE(NEW.moderator_id, auth.uid()),
      NEW.moderation_status,
      OLD.moderation_status,
      NEW.moderation_status,
      NEW.rejection_reason,
      COALESCE(NEW.moderated_at, now())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-logging
DROP TRIGGER IF EXISTS trigger_log_rental_moderation ON public.rental_vehicles;
CREATE TRIGGER trigger_log_rental_moderation
  AFTER UPDATE ON public.rental_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_rental_moderation_change();