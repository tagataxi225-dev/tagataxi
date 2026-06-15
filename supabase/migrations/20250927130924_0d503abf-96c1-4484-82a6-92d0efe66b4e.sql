-- Add missing columns to partenaires table
ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS service_areas TEXT[] DEFAULT ARRAY['Kinshasa'];

ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS admin_comments TEXT;

ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create function to notify partner on status change
CREATE OR REPLACE FUNCTION public.notify_partner_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when verification status changes
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO public.admin_notifications (
      type, title, message, severity, data
    ) VALUES (
      'partner_validation',
      'Statut partenaire mis à jour',
      'Le statut du partenaire ' || NEW.company_name || ' a été changé de ' || 
      COALESCE(OLD.verification_status, 'nouveau') || ' à ' || NEW.verification_status,
      CASE 
        WHEN NEW.verification_status = 'approved' THEN 'success'
        WHEN NEW.verification_status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      jsonb_build_object(
        'partner_id', NEW.id,
        'company_name', NEW.company_name,
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'reviewed_at', NEW.reviewed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for partner validation notifications
DROP TRIGGER IF EXISTS partner_validation_notification ON public.partenaires;
CREATE TRIGGER partner_validation_notification
  AFTER UPDATE ON public.partenaires
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partner_validation();