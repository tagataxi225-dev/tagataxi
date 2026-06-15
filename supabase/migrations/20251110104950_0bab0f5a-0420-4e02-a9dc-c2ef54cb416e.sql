-- Ajouter policies publiques pour les tables liées à la location (SANS les vues)

-- Policy pour partenaires (lecture publique des profils actifs)
DROP POLICY IF EXISTS "partenaires_public_read" ON partenaires;
CREATE POLICY "partenaires_public_read"
ON partenaires
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Policy pour catégories de véhicules (lecture publique)
DROP POLICY IF EXISTS "rental_vehicle_categories_public_read" ON rental_vehicle_categories;
CREATE POLICY "rental_vehicle_categories_public_read"
ON rental_vehicle_categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Policy pour profiles (lecture publique des avatars partenaires)
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
CREATE POLICY "profiles_public_read"
ON profiles
FOR SELECT
TO anon, authenticated
USING (true);