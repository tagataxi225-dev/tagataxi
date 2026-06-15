-- Phase 2: Système de gains intelligent avec Pity System

-- 1. Corriger les probabilités basées sur la rareté
UPDATE lottery_prize_types SET
  probability = CASE rarity
    WHEN 'common' THEN 0.70
    WHEN 'rare' THEN 0.20
    WHEN 'epic' THEN 0.08
    WHEN 'legendary' THEN 0.02
    ELSE 0.70
  END
WHERE is_active = true;

-- 2. Créer table de tracking du pity system
CREATE TABLE IF NOT EXISTS scratch_card_pity_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Compteurs
  total_scratched INTEGER DEFAULT 0,
  commons_streak INTEGER DEFAULT 0,
  last_rare_at TIMESTAMPTZ,
  last_epic_at TIMESTAMPTZ,
  last_legendary_at TIMESTAMPTZ,
  
  -- Garanties (pity thresholds)
  guaranteed_rare_at INTEGER DEFAULT 10,
  guaranteed_epic_at INTEGER DEFAULT 50,
  guaranteed_legendary_at INTEGER DEFAULT 200,
  
  -- Multiplicateurs temporaires
  active_multiplier NUMERIC DEFAULT 1.0,
  multiplier_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE scratch_card_pity_tracker ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pity tracker
CREATE POLICY "Users view own pity tracker"
  ON scratch_card_pity_tracker
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert/update pity tracker
CREATE POLICY "System manages pity tracker"
  ON scratch_card_pity_tracker
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Fonction d'incrémentation automatique
CREATE OR REPLACE FUNCTION increment_pity_counter()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO scratch_card_pity_tracker (user_id, total_scratched, commons_streak)
  VALUES (
    NEW.user_id, 
    1, 
    CASE WHEN NEW.rarity = 'common' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_scratched = scratch_card_pity_tracker.total_scratched + 1,
    commons_streak = CASE 
      WHEN NEW.rarity = 'common' THEN scratch_card_pity_tracker.commons_streak + 1
      ELSE 0
    END,
    last_rare_at = CASE 
      WHEN NEW.rarity = 'rare' THEN NEW.created_at 
      ELSE scratch_card_pity_tracker.last_rare_at 
    END,
    last_epic_at = CASE 
      WHEN NEW.rarity = 'epic' THEN NEW.created_at 
      ELSE scratch_card_pity_tracker.last_epic_at 
    END,
    last_legendary_at = CASE 
      WHEN NEW.rarity = 'legendary' THEN NEW.created_at 
      ELSE scratch_card_pity_tracker.last_legendary_at 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Trigger sur lottery_wins pour cartes à gratter
DROP TRIGGER IF EXISTS on_scratch_card_won ON lottery_wins;
CREATE TRIGGER on_scratch_card_won
  AFTER INSERT ON lottery_wins
  FOR EACH ROW
  WHEN (NEW.scratch_percentage IS NOT NULL)
  EXECUTE FUNCTION increment_pity_counter();