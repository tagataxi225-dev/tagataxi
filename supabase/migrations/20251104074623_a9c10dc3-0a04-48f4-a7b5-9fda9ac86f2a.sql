-- Table pour stocker les paramètres utilisateurs
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Notifications
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  booking_reminders BOOLEAN DEFAULT TRUE,
  promotional_offers BOOLEAN DEFAULT FALSE,
  
  -- Privacy
  location_sharing BOOLEAN DEFAULT TRUE,
  ride_history_visible BOOLEAN DEFAULT TRUE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  
  -- App preferences
  dark_mode BOOLEAN DEFAULT FALSE,
  sound_effects BOOLEAN DEFAULT TRUE,
  auto_location BOOLEAN DEFAULT TRUE,
  offline_maps BOOLEAN DEFAULT FALSE,
  
  -- Security
  two_factor_auth BOOLEAN DEFAULT FALSE,
  biometric_login BOOLEAN DEFAULT FALSE,
  auto_logout BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy : Users can only read/write their own settings
CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();