-- Table pour les abonnements restaurants
CREATE TABLE IF NOT EXISTS restaurant_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(restaurant_id, follower_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_restaurant_followers_restaurant ON restaurant_followers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_followers_follower ON restaurant_followers(follower_id);

-- RLS
ALTER TABLE restaurant_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view followers" ON restaurant_followers;
CREATE POLICY "Anyone can view followers"
  ON restaurant_followers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow restaurants" ON restaurant_followers;
CREATE POLICY "Users can follow restaurants"
  ON restaurant_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON restaurant_followers;
CREATE POLICY "Users can unfollow"
  ON restaurant_followers FOR DELETE
  USING (auth.uid() = follower_id);