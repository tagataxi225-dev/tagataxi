-- Créer une edge function pour recherche de livreurs marketplace
-- Cette fonction sera appelée par marketplace-driver-assignment

-- Assurer que la table driver_locations a les bonnes contraintes
ALTER TABLE public.driver_locations 
ADD COLUMN IF NOT EXISTS minimum_balance numeric DEFAULT 1000,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_driver_locations_search 
ON public.driver_locations (is_online, is_available, is_verified, last_ping)
WHERE is_online = true AND is_available = true;