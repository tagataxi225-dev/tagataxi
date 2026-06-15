-- Phase 1: Activer pg_net et créer le trigger automatique marketplace

-- Activer l'extension pg_net pour les appels HTTP asynchrones
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Fonction qui appelle automatiquement l'Edge Function d'assignation
CREATE OR REPLACE FUNCTION auto_assign_marketplace_driver()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup_lat NUMERIC;
  v_pickup_lng NUMERIC;
  v_city TEXT;
BEGIN
  -- Extraire les coordonnées de pickup
  v_pickup_lat := (NEW.pickup_coordinates->>'lat')::NUMERIC;
  v_pickup_lng := (NEW.pickup_coordinates->>'lng')::NUMERIC;
  v_city := COALESCE(NEW.city, 'Kinshasa');

  -- Vérifier que les coordonnées sont valides
  IF v_pickup_lat IS NULL OR v_pickup_lng IS NULL THEN
    RAISE WARNING 'Marketplace order % has invalid pickup coordinates', NEW.id;
    RETURN NEW;
  END IF;

  -- Appeler l'Edge Function via pg_net de manière asynchrone
  PERFORM net.http_post(
    url := 'https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/marketplace-driver-assignment',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU'
    ),
    body := jsonb_build_object(
      'action', 'auto_assign_marketplace_order',
      'order_id', NEW.id::text,
      'pickup_lat', v_pickup_lat,
      'pickup_lng', v_pickup_lng,
      'city', v_city,
      'delivery_type', 'marketplace'
    )
  );

  -- Logger l'appel
  INSERT INTO public.activity_logs (
    activity_type,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    'marketplace_auto_assign_triggered',
    'Recherche automatique de livreur déclenchée',
    'marketplace_order',
    NEW.id,
    jsonb_build_object(
      'pickup_lat', v_pickup_lat,
      'pickup_lng', v_pickup_lng,
      'city', v_city
    )
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger sur marketplace_orders
DROP TRIGGER IF EXISTS on_marketplace_order_created ON public.marketplace_orders;

CREATE TRIGGER on_marketplace_order_created
  AFTER INSERT ON public.marketplace_orders
  FOR EACH ROW
  WHEN (
    NEW.status IN ('pending', 'pending_payment', 'confirmed') 
    AND NEW.delivery_method != 'pickup'
    AND NEW.pickup_coordinates IS NOT NULL
  )
  EXECUTE FUNCTION auto_assign_marketplace_driver();

-- Ajouter un commentaire explicatif
COMMENT ON TRIGGER on_marketplace_order_created ON public.marketplace_orders IS 
  'Déclenche automatiquement la recherche de livreur pour les commandes marketplace nécessitant une livraison';