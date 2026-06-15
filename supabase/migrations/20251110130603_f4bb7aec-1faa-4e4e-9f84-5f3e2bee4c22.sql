-- Table pour les notations générales des agences de location (sans réservation)
CREATE TABLE IF NOT EXISTS partner_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partenaires(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, client_id) -- Un client ne peut noter qu'une fois par agence
);

-- Index pour performance
CREATE INDEX idx_partner_ratings_partner ON partner_ratings(partner_id);
CREATE INDEX idx_partner_ratings_client ON partner_ratings(client_id);
CREATE INDEX idx_partner_ratings_rating ON partner_ratings(rating);
CREATE INDEX idx_partner_ratings_created ON partner_ratings(created_at DESC);

-- RLS
ALTER TABLE partner_ratings ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les notations
CREATE POLICY "Anyone can view partner ratings"
ON partner_ratings FOR SELECT
USING (true);

-- Clients connectés peuvent insérer leur notation
CREATE POLICY "Authenticated users can insert their rating"
ON partner_ratings FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Clients peuvent modifier leur propre notation
CREATE POLICY "Users can update their own rating"
ON partner_ratings FOR UPDATE
USING (auth.uid() = client_id);

-- Clients peuvent supprimer leur propre notation
CREATE POLICY "Users can delete their own rating"
ON partner_ratings FOR DELETE
USING (auth.uid() = client_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_partner_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_ratings_updated_at
BEFORE UPDATE ON partner_ratings
FOR EACH ROW
EXECUTE FUNCTION update_partner_ratings_updated_at();