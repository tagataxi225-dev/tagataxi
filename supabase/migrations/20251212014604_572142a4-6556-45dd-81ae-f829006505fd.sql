-- Table pour stocker les badges gagnés par les utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  source TEXT DEFAULT 'gratta',
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Activer RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies pour les badges
CREATE POLICY "Users can view their own badges" 
ON user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
ON user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Table pour suivre l'activité de grattage des utilisateurs (pour l'algorithme adaptatif)
CREATE TABLE IF NOT EXISTS user_gratta_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cards_scratched INTEGER DEFAULT 0,
  mega_cards INTEGER DEFAULT 0,
  rare_cards INTEGER DEFAULT 0,
  active_cards INTEGER DEFAULT 0,
  standard_cards INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,
  last_scratch_date DATE,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE user_gratta_stats ENABLE ROW LEVEL SECURITY;

-- Policies pour les stats
CREATE POLICY "Users can view their own gratta stats" 
ON user_gratta_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gratta stats" 
ON user_gratta_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gratta stats" 
ON user_gratta_stats 
FOR UPDATE 
USING (auth.uid() = user_id);