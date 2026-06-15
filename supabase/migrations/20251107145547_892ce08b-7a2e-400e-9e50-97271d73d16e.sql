-- Phase 1: Nettoyer les espaces dans les villes
UPDATE restaurant_profiles 
SET city = TRIM(city)
WHERE city LIKE '% ' OR city LIKE ' %';

-- Phase 7: Vérifier et créer les RLS policies si nécessaires

-- Policy pour restaurant_profiles (lecture publique des restaurants actifs)
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurant_profiles;
CREATE POLICY "Anyone can view active restaurants"
ON restaurant_profiles FOR SELECT
USING (is_active = true);

-- Policy pour food_products (lecture publique des produits approuvés)
DROP POLICY IF EXISTS "Anyone can view approved products" ON food_products;
CREATE POLICY "Anyone can view approved products"
ON food_products FOR SELECT
USING (moderation_status = 'approved' AND is_available = true);

-- Activer le realtime pour restaurant_profiles
ALTER TABLE restaurant_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_profiles;