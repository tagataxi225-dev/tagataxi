-- Clean orphaned partner_id references first
UPDATE rental_vehicles 
SET partner_id = NULL 
WHERE partner_id IS NOT NULL 
  AND partner_id NOT IN (SELECT id FROM partenaires);

-- Now add foreign key constraint
ALTER TABLE rental_vehicles
DROP CONSTRAINT IF EXISTS rental_vehicles_partner_id_fkey;

ALTER TABLE rental_vehicles
ADD CONSTRAINT rental_vehicles_partner_id_fkey 
FOREIGN KEY (partner_id) 
REFERENCES partenaires(id) 
ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_partner_id 
ON rental_vehicles(partner_id);

CREATE INDEX IF NOT EXISTS idx_rental_vehicles_moderation_status 
ON rental_vehicles(moderation_status);