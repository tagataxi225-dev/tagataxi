-- ============================================
-- PHASE 2: BASE DE DONNÉES POUR RÉSERVATION POUR AUTRUI
-- ============================================

-- Créer la table des bénéficiaires
CREATE TABLE IF NOT EXISTS booking_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT, -- 'family', 'friend', 'colleague', 'other'
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_phone UNIQUE(user_id, phone)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON booking_beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_favorite ON booking_beneficiaries(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_usage ON booking_beneficiaries(user_id, usage_count DESC);

-- RLS Policies
ALTER TABLE booking_beneficiaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own beneficiaries" ON booking_beneficiaries;
CREATE POLICY "Users can view their own beneficiaries"
  ON booking_beneficiaries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own beneficiaries" ON booking_beneficiaries;
CREATE POLICY "Users can insert their own beneficiaries"
  ON booking_beneficiaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own beneficiaries" ON booking_beneficiaries;
CREATE POLICY "Users can update their own beneficiaries"
  ON booking_beneficiaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own beneficiaries" ON booking_beneficiaries;
CREATE POLICY "Users can delete their own beneficiaries"
  ON booking_beneficiaries FOR DELETE
  USING (auth.uid() = user_id);

-- Ajouter les colonnes dans transport_bookings si elles n'existent pas
ALTER TABLE transport_bookings
ADD COLUMN IF NOT EXISTS booked_for_other BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS beneficiary_id UUID REFERENCES booking_beneficiaries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS beneficiary_name TEXT,
ADD COLUMN IF NOT EXISTS beneficiary_phone TEXT,
ADD COLUMN IF NOT EXISTS beneficiary_instructions TEXT;

-- Index pour recherche rapide des courses pour autrui
CREATE INDEX IF NOT EXISTS idx_bookings_beneficiary ON transport_bookings(beneficiary_id) WHERE beneficiary_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_for_other ON transport_bookings(booked_for_other) WHERE booked_for_other = true;

-- Fonction RPC pour incrémenter l'utilisation et auto-favoriser
CREATE OR REPLACE FUNCTION increment_beneficiary_usage(beneficiary_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE booking_beneficiaries
  SET 
    usage_count = usage_count + 1,
    is_favorite = CASE 
      WHEN usage_count + 1 >= 3 THEN true 
      ELSE is_favorite 
    END,
    updated_at = NOW()
  WHERE id = beneficiary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_beneficiaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_beneficiaries_timestamp ON booking_beneficiaries;
CREATE TRIGGER update_beneficiaries_timestamp
  BEFORE UPDATE ON booking_beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiaries_updated_at();