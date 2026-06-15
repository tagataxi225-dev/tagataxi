-- Kwenda Gratta: Ajouter les nouvelles colonnes à lottery_wins
ALTER TABLE lottery_wins ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'standard';
ALTER TABLE lottery_wins ADD COLUMN IF NOT EXISTS daily_card BOOLEAN DEFAULT false;
ALTER TABLE lottery_wins ADD COLUMN IF NOT EXISTS boost_details JSONB DEFAULT '{}';
ALTER TABLE lottery_wins ADD COLUMN IF NOT EXISTS expires_in_hours INTEGER DEFAULT 24;

-- Index pour optimiser les requêtes sur les cartes quotidiennes
CREATE INDEX IF NOT EXISTS idx_lottery_wins_daily_card ON lottery_wins(user_id, daily_card, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lottery_wins_card_type ON lottery_wins(card_type);