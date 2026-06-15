-- Modernisation du système de location de véhicules
-- 1. Mise à jour des catégories vers : Eco, Premium, First Class, Utilitaires

-- Sauvegarde des catégories existantes et ajout du champ city
ALTER TABLE rental_vehicle_categories ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE rental_vehicle_categories ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;

-- Mise à jour des catégories existantes vers les nouvelles
UPDATE rental_vehicle_categories SET 
  name = 'Eco',
  description = 'Véhicules économiques et respectueux de l''environnement',
  city = 'all',
  priority = 1
WHERE name = 'Motos' OR name = 'Economic';

UPDATE rental_vehicle_categories SET 
  name = 'Premium', 
  description = 'Véhicules de standing avec équipements haut de gamme',
  city = 'all',
  priority = 2
WHERE name = 'Standard' OR name = 'Premium';

-- Ajouter les nouvelles catégories si elles n'existent pas
INSERT INTO rental_vehicle_categories (id, name, description, icon, is_active, city, priority)
VALUES 
  (gen_random_uuid(), 'First Class', 'Véhicules de luxe avec service premium exclusif', 'Car', true, 'all', 3),
  (gen_random_uuid(), 'Utilitaires', 'Véhicules utilitaires pour transport de marchandises', 'Truck', true, 'all', 4)
ON CONFLICT DO NOTHING;

-- 2. Ajout de la gestion multi-villes aux véhicules
ALTER TABLE rental_vehicles ADD COLUMN IF NOT EXISTS available_cities text[] DEFAULT ARRAY['Kinshasa', 'Lubumbashi', 'Kolwezi'];
ALTER TABLE rental_vehicles ADD COLUMN IF NOT EXISTS city text DEFAULT 'Kinshasa';
ALTER TABLE rental_vehicles ADD COLUMN IF NOT EXISTS comfort_level text DEFAULT 'standard';
ALTER TABLE rental_vehicles ADD COLUMN IF NOT EXISTS equipment jsonb DEFAULT '[]'::jsonb;

-- Mise à jour des véhicules existants
UPDATE rental_vehicles SET 
  available_cities = ARRAY['Kinshasa', 'Lubumbashi', 'Kolwezi'],
  city = 'Kinshasa',
  comfort_level = CASE 
    WHEN vehicle_type = 'moto' THEN 'basic'
    WHEN vehicle_type = 'utility' THEN 'functional'
    ELSE 'standard'
  END;

-- 3. Ajout de tables pour la gestion avancée
CREATE TABLE IF NOT EXISTS rental_city_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  category_id uuid REFERENCES rental_vehicle_categories(id),
  multiplier numeric DEFAULT 1.0,
  base_delivery_fee numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Données initiales de pricing par ville
INSERT INTO rental_city_pricing (city, multiplier, base_delivery_fee)
VALUES 
  ('Kinshasa', 1.0, 5000),
  ('Lubumbashi', 1.2, 7000),
  ('Kolwezi', 1.1, 6000)
ON CONFLICT DO NOTHING;

-- 4. Table pour les équipements modernes
CREATE TABLE IF NOT EXISTS rental_equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  icon text,
  description text,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Équipements modernes
INSERT INTO rental_equipment_types (name, category, icon, description, is_premium)
VALUES 
  ('Climatisation', 'comfort', 'Snowflake', 'Système de climatisation automatique', false),
  ('GPS intégré', 'technology', 'Navigation', 'Navigation GPS avec cartes mises à jour', false),
  ('Bluetooth', 'technology', 'Bluetooth', 'Connectivité Bluetooth pour appareils mobiles', false),
  ('Caméra de recul', 'safety', 'Camera', 'Caméra d''aide au stationnement', true),
  ('Sièges cuir', 'luxury', 'Armchair', 'Sièges en cuir véritable', true),
  ('Toit ouvrant', 'luxury', 'Sun', 'Toit ouvrant panoramique', true),
  ('WiFi embarqué', 'technology', 'Wifi', 'Connexion internet WiFi', true),
  ('Système audio premium', 'luxury', 'Speaker', 'Système audio haute qualité', true)
ON CONFLICT DO NOTHING;

-- 5. Mise à jour des RLS policies pour la gestion multi-villes
DROP POLICY IF EXISTS "Anyone can view city pricing" ON rental_city_pricing;
CREATE POLICY "Anyone can view city pricing" 
ON rental_city_pricing FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Anyone can view equipment types" ON rental_equipment_types;
CREATE POLICY "Anyone can view equipment types" 
ON rental_equipment_types FOR SELECT 
USING (true);

-- Activer RLS sur les nouvelles tables
ALTER TABLE rental_city_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_equipment_types ENABLE ROW LEVEL SECURITY;

-- 6. Fonction pour calculer le prix selon la ville et catégorie
CREATE OR REPLACE FUNCTION calculate_rental_price(
  base_price numeric,
  city_name text,
  category_id_param uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  multiplier numeric := 1.0;
BEGIN
  SELECT rcp.multiplier INTO multiplier
  FROM rental_city_pricing rcp
  WHERE rcp.city = city_name
    AND (category_id_param IS NULL OR rcp.category_id = category_id_param)
  ORDER BY rcp.category_id NULLS LAST
  LIMIT 1;
  
  RETURN ROUND(base_price * COALESCE(multiplier, 1.0));
END;
$$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_city ON rental_vehicles(city);
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_available_cities ON rental_vehicles USING GIN(available_cities);
CREATE INDEX IF NOT EXISTS idx_rental_city_pricing_city ON rental_city_pricing(city);