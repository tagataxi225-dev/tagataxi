-- Create vendor_followers table
CREATE TABLE IF NOT EXISTS vendor_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_followers_vendor ON vendor_followers(vendor_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_followers_user ON vendor_followers(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_followers_active ON vendor_followers(vendor_id, is_active);

-- Enable RLS
ALTER TABLE vendor_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can follow vendors"
  ON vendor_followers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow vendors"
  ON vendor_followers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view followers"
  ON vendor_followers FOR SELECT
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_vendor_followers_updated_at
  BEFORE UPDATE ON vendor_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add vendor profile enhancements
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_verified_seller BOOLEAN DEFAULT false;

-- Create vendor stats view
CREATE OR REPLACE VIEW vendor_stats AS
SELECT
  p.id AS vendor_id,
  p.display_name,
  p.avatar_url,
  p.cover_url,
  p.bio,
  p.is_verified_seller,
  COUNT(DISTINCT mp.id) AS products_count,
  COUNT(DISTINCT mo.id) AS sales_count,
  COALESCE(AVG(mp.rating_average), 0) AS avg_rating,
  COUNT(DISTINCT vf.user_id) FILTER (WHERE vf.is_active = true) AS followers_count
FROM profiles p
LEFT JOIN marketplace_products mp ON mp.seller_id = p.id AND mp.status = 'active'
LEFT JOIN marketplace_orders mo ON mo.seller_id = p.id AND mo.status = 'delivered'
LEFT JOIN vendor_followers vf ON vf.vendor_id = p.id
WHERE p.user_type = 'vendor' OR EXISTS (SELECT 1 FROM marketplace_products WHERE seller_id = p.id)
GROUP BY p.id, p.display_name, p.avatar_url, p.cover_url, p.bio, p.is_verified_seller;

-- Grant permissions
GRANT SELECT ON vendor_stats TO authenticated;