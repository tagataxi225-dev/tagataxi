-- ==========================================
-- PHASE 1 : Migration service_specialization
-- Correctif critique pour débloquer la sélection de service
-- ==========================================

-- 1. Ajouter la colonne service_specialization à chauffeurs
ALTER TABLE public.chauffeurs
ADD COLUMN IF NOT EXISTS service_specialization TEXT;

-- 2. Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_chauffeurs_service_specialization 
ON public.chauffeurs(service_specialization);

-- 3. Migrer les données existantes
-- Transformer les anciennes valeurs de service_type en format standardisé
UPDATE public.chauffeurs
SET 
  service_specialization = CASE
    -- Si service_type est déjà une spécialisation, on la garde
    WHEN service_type IN ('taxi_moto', 'taxi_eco', 'taxi_premium', 'taxi_confort', 'taxi_bus') THEN service_type
    WHEN service_type IN ('flash', 'flex', 'maxicharge') THEN service_type
    -- Si c'est un type générique, on dérive la spécialisation du vehicle_type
    WHEN service_type = 'transport' OR service_type = 'taxi' THEN 
      CASE
        WHEN vehicle_type = 'moto' THEN 'taxi_moto'
        WHEN vehicle_type = 'voiture' THEN 'taxi_eco'
        WHEN vehicle_type = 'bus' THEN 'taxi_bus'
        ELSE 'taxi_eco'
      END
    WHEN service_type = 'delivery' THEN 'flex'
    ELSE NULL
  END,
  service_type = CASE
    -- Normaliser tous les types de taxi vers 'taxi'
    WHEN service_type IN ('taxi_moto', 'taxi_eco', 'taxi_premium', 'taxi_confort', 'taxi_bus', 'transport', 'taxi') THEN 'taxi'
    -- Normaliser tous les types de livraison vers 'delivery'
    WHEN service_type IN ('flash', 'flex', 'maxicharge', 'delivery') THEN 'delivery'
    ELSE service_type
  END
WHERE service_specialization IS NULL;

-- 4. Créer la fonction RPC get_driver_service_info
CREATE OR REPLACE FUNCTION public.get_driver_service_info(driver_user_id UUID)
RETURNS TABLE (
  service_type TEXT,
  service_specialization TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.service_type, 'unknown'::TEXT) as service_type,
    c.service_specialization
  FROM public.chauffeurs c
  WHERE c.user_id = driver_user_id
  LIMIT 1;
END;
$$;

-- 5. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_driver_service_info(UUID) TO authenticated;

-- 6. Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.chauffeurs.service_specialization IS 'Spécialisation du service: taxi_moto, taxi_eco, flash, flex, maxicharge, etc.';
COMMENT ON FUNCTION public.get_driver_service_info(UUID) IS 'Retourne le service_type et service_specialization d''un chauffeur pour useDriverServiceInfo hook';