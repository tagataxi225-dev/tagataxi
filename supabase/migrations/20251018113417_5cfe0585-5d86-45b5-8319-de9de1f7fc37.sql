-- ==========================================
-- ACTION 3 : Trigger Auto-Assign Partner ID
-- ==========================================
-- Synchronise automatiquement partner_drivers → driver_codes.partner_id

CREATE OR REPLACE FUNCTION public.assign_partner_to_driver_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un partner_driver est créé, mettre à jour driver_codes
  UPDATE public.driver_codes
  SET 
    partner_id = NEW.partner_id,
    updated_at = NOW()
  WHERE driver_id = NEW.driver_id
    AND partner_id IS NULL;  -- Ne pas écraser si déjà assigné
  
  -- Logger l'assignation
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.partner_id,
    'driver_partner_link',
    'Chauffeur automatiquement lié au partenaire',
    jsonb_build_object(
      'driver_id', NEW.driver_id,
      'partner_id', NEW.partner_id,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur INSERT dans partner_drivers
DROP TRIGGER IF EXISTS partner_driver_assign_code ON public.partner_drivers;

CREATE TRIGGER partner_driver_assign_code
AFTER INSERT ON public.partner_drivers
FOR EACH ROW
EXECUTE FUNCTION public.assign_partner_to_driver_code();

-- Vérification : afficher les triggers actifs
-- SELECT tgname, tgrelid::regclass, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname = 'partner_driver_assign_code';