-- Corriger la table driver_requests pour supporter les chauffeurs sans véhicule propre
-- Rendre les colonnes véhicule NULLABLE
ALTER TABLE public.driver_requests 
  ALTER COLUMN vehicle_type DROP NOT NULL,
  ALTER COLUMN vehicle_model DROP NOT NULL,
  ALTER COLUMN vehicle_year DROP NOT NULL,
  ALTER COLUMN vehicle_plate DROP NOT NULL,
  ALTER COLUMN insurance_number DROP NOT NULL,
  ALTER COLUMN license_expiry DROP NOT NULL;

-- Ajouter une colonne pour tracker si le chauffeur a son propre véhicule
ALTER TABLE public.driver_requests 
  ADD COLUMN IF NOT EXISTS has_own_vehicle BOOLEAN DEFAULT false;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.driver_requests.has_own_vehicle IS 'Indique si le chauffeur possède son propre véhicule ou cherche un partenaire';
COMMENT ON TABLE public.driver_requests IS 'Demandes d''inscription chauffeur - supporte les chauffeurs avec ou sans véhicule propre';