-- Fix category slug consistency and vendor subscriptions
-- Update food category slug
UPDATE marketplace_categories
SET slug = 'food'
WHERE slug = 'alimentation';

-- Add vendor subscription columns
ALTER TABLE vendor_subscriptions
ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_subscriber 
ON vendor_subscriptions(subscriber_id) WHERE is_active = true;

-- RLS for vendor_subscriptions
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can subscribe to vendors"
ON vendor_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can view their subscriptions"
ON vendor_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = subscriber_id OR auth.uid() IN (
  SELECT user_id FROM vendor_profiles WHERE id = vendor_id
));

CREATE POLICY "Users can unsubscribe"
ON vendor_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = subscriber_id)
WITH CHECK (auth.uid() = subscriber_id);