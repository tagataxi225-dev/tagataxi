-- Ajouter la colonne self_drive_allowed pour la nouvelle logique
-- Par défaut TOUTES les locations sont avec chauffeur
-- self_drive_allowed = true signifie que le partenaire autorise AUSSI la location sans chauffeur

ALTER TABLE rental_vehicles 
ADD COLUMN IF NOT EXISTS self_drive_allowed BOOLEAN DEFAULT false;

-- Migrer les données existantes : 
-- Si driver_available = true ET driver_required = false → le client pouvait choisir sans chauffeur
UPDATE rental_vehicles 
SET self_drive_allowed = CASE 
  WHEN driver_available = true AND driver_required = false THEN true
  ELSE false
END
WHERE self_drive_allowed IS NULL OR self_drive_allowed = false;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN rental_vehicles.self_drive_allowed IS 
  'Si true, le partenaire autorise la location sans chauffeur (option). Par défaut false = avec chauffeur uniquement.';