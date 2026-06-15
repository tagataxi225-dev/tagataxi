-- Phase 6: Migration base de données pour location complète

-- Ajouter colonnes à rental_bookings
ALTER TABLE rental_bookings
ADD COLUMN IF NOT EXISTS driver_choice TEXT CHECK (driver_choice IN ('with_driver', 'without_driver', 'not_applicable')),
ADD COLUMN IF NOT EXISTS equipment_ids TEXT[],
ADD COLUMN IF NOT EXISTS equipment_total DECIMAL(10,2) DEFAULT 0;

-- Créer table de pricing pour équipements (optionnel mais recommandé)
CREATE TABLE IF NOT EXISTS rental_equipment_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_type_id UUID REFERENCES vehicle_equipment_types(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  daily_rate DECIMAL(10,2) DEFAULT 5000,
  weekly_rate DECIMAL(10,2) DEFAULT 30000,
  currency TEXT DEFAULT 'CDF',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rental_equipment_pricing_city ON rental_equipment_pricing(city);
CREATE INDEX IF NOT EXISTS idx_rental_equipment_pricing_active ON rental_equipment_pricing(is_active);

-- RLS pour rental_equipment_pricing (lecture publique)
ALTER TABLE rental_equipment_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment pricing visible to everyone"
ON rental_equipment_pricing FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage equipment pricing"
ON rental_equipment_pricing FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insérer tarifs par défaut pour Kinshasa, Lubumbashi, Kolwezi
INSERT INTO rental_equipment_pricing (equipment_type_id, city, daily_rate, weekly_rate)
SELECT 
  id,
  city,
  CASE 
    WHEN city = 'Lubumbashi' THEN 6000
    WHEN city = 'Kolwezi' THEN 5500
    ELSE 5000
  END,
  CASE 
    WHEN city = 'Lubumbashi' THEN 36000
    WHEN city = 'Kolwezi' THEN 33000
    ELSE 30000
  END
FROM vehicle_equipment_types
CROSS JOIN (VALUES ('Kinshasa'), ('Lubumbashi'), ('Kolwezi')) AS cities(city)
ON CONFLICT DO NOTHING;

-- Trigger pour updated_at
CREATE TRIGGER update_rental_equipment_pricing_updated_at
BEFORE UPDATE ON rental_equipment_pricing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();