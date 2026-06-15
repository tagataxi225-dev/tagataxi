-- Ajouter policy publique pour la consultation des véhicules approuvés
-- Permet aux utilisateurs NON connectés de voir les véhicules de location

-- Drop l'ancienne policy si elle existe pour éviter les conflits
DROP POLICY IF EXISTS "rental_vehicles_public_read_approved_anon" ON rental_vehicles;

-- Créer policy pour utilisateurs anonymes (non connectés)
CREATE POLICY "rental_vehicles_public_read_approved_anon"
ON rental_vehicles
FOR SELECT
TO anon
USING (
  moderation_status = 'approved' 
  AND is_active = true 
  AND is_available = true
);

-- Vérifier que la policy pour authentified existe toujours
-- (elle est déjà présente, pas besoin de la recréer)