-- ✅ CORRECTION PRÉALABLE: Fixer le trigger update_marketplace_order_timestamps qui manque un ELSE
CREATE OR REPLACE FUNCTION public.update_marketplace_order_timestamps()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Gestion des timestamps selon le statut
  CASE NEW.status
    WHEN 'pending' THEN
      NEW.created_at = COALESCE(NEW.created_at, NOW());
    WHEN 'confirmed' THEN
      NEW.confirmed_at = COALESCE(NEW.confirmed_at, NOW());
    WHEN 'shipped' THEN
      NEW.shipped_at = COALESCE(NEW.shipped_at, NOW());
    WHEN 'delivered' THEN
      NEW.delivered_at = COALESCE(NEW.delivered_at, NOW());
    WHEN 'cancelled' THEN
      NEW.cancelled_at = COALESCE(NEW.cancelled_at, NOW());
    ELSE
      -- Ne rien faire pour les autres statuts
      NULL;
  END CASE;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ✅ CORRECTION 1: Remplir buyer_phone manquant dans marketplace_orders
UPDATE marketplace_orders mo
SET buyer_phone = c.phone_number
FROM clients c
WHERE mo.buyer_id = c.user_id
  AND mo.buyer_phone IS NULL;

-- ✅ Créer fonction pour auto-remplir buyer_phone
CREATE OR REPLACE FUNCTION public.fill_buyer_phone()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Si buyer_phone est NULL, le remplir depuis clients
  IF NEW.buyer_phone IS NULL AND NEW.buyer_id IS NOT NULL THEN
    SELECT phone_number INTO NEW.buyer_phone
    FROM public.clients
    WHERE user_id = NEW.buyer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ✅ Créer trigger pour auto-remplir sur INSERT
DROP TRIGGER IF EXISTS auto_fill_buyer_phone ON marketplace_orders;
CREATE TRIGGER auto_fill_buyer_phone
  BEFORE INSERT ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_buyer_phone();