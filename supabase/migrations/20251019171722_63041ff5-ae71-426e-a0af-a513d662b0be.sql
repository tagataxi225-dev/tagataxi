-- ✅ PHASE 1: Correction complète du système buyer_phone

-- Étape 1.1: Forcer la mise à jour du phone_number dans clients depuis auth metadata
UPDATE clients c
SET phone_number = u.raw_user_meta_data->>'phone_number'
FROM auth.users u
WHERE c.user_id = u.id
  AND c.phone_number IS NULL
  AND u.raw_user_meta_data->>'phone_number' IS NOT NULL;

-- Étape 1.2: Re-exécuter la migration buyer_phone avec les nouvelles données
UPDATE marketplace_orders mo
SET buyer_phone = c.phone_number
FROM clients c
WHERE mo.buyer_id = c.user_id
  AND mo.buyer_phone IS NULL
  AND c.phone_number IS NOT NULL;

-- Étape 1.3: Améliorer le trigger fill_buyer_phone pour gérer le fallback metadata
CREATE OR REPLACE FUNCTION public.fill_buyer_phone()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Si buyer_phone est NULL, essayer plusieurs sources
  IF NEW.buyer_phone IS NULL AND NEW.buyer_id IS NOT NULL THEN
    -- Essayer d'abord depuis la table clients
    SELECT phone_number INTO NEW.buyer_phone
    FROM public.clients
    WHERE user_id = NEW.buyer_id
      AND phone_number IS NOT NULL;
    
    -- Si toujours NULL, essayer depuis auth.users metadata
    IF NEW.buyer_phone IS NULL THEN
      SELECT raw_user_meta_data->>'phone_number' INTO NEW.buyer_phone
      FROM auth.users
      WHERE id = NEW.buyer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;