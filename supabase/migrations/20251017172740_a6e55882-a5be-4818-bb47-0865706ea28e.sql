-- Sprint 1: Système de rareté et carte à gratter

-- 1. Ajouter colonnes rareté aux types de prix
ALTER TABLE lottery_prize_types 
ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partenaires(id),
ADD COLUMN IF NOT EXISTS physical_delivery_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS probability NUMERIC(5,4) DEFAULT 0.7000;

-- 2. Modifier lottery_wins pour le système de grattage
ALTER TABLE lottery_wins
ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'cash' CHECK (reward_type IN ('cash', 'points', 'physical_gift', 'voucher')),
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scratch_revealed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scratch_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));

-- 3. Index pour performances
CREATE INDEX IF NOT EXISTS idx_lottery_wins_scratch ON lottery_wins(user_id, scratch_revealed_at) WHERE scratch_revealed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lottery_prize_rarity ON lottery_prize_types(rarity, is_active) WHERE is_active = TRUE;