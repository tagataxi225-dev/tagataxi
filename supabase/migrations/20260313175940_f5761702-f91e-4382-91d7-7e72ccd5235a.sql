
-- Fix trigger: restore moderation_status on unarchive
CREATE OR REPLACE FUNCTION public.update_product_moderation_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Archivage : marquer comme inactive
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    NEW.moderation_status = 'inactive';
  END IF;
  
  -- Désarchivage : restaurer le statut approved
  IF OLD.status != 'active' AND NEW.status = 'active' 
     AND OLD.moderation_status = 'inactive' THEN
    NEW.moderation_status = 'approved';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Data fix: restore already broken products
UPDATE public.marketplace_products
SET moderation_status = 'approved', updated_at = now()
WHERE status = 'active' AND moderation_status = 'inactive';
