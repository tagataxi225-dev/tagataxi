-- Table pour analytics de partage d'agences de location
CREATE TABLE IF NOT EXISTS rental_partner_share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partenaires(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('whatsapp', 'facebook', 'telegram', 'email', 'sms', 'copy_link', 'native_share')),
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_rental_partner_share_analytics_partner ON rental_partner_share_analytics(partner_id);
CREATE INDEX idx_rental_partner_share_analytics_type ON rental_partner_share_analytics(share_type);
CREATE INDEX idx_rental_partner_share_analytics_date ON rental_partner_share_analytics(created_at);

-- RLS
ALTER TABLE rental_partner_share_analytics ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut insérer des analytics
CREATE POLICY "Anyone can insert share analytics"
ON rental_partner_share_analytics FOR INSERT
WITH CHECK (true);

-- Les partenaires peuvent voir leurs propres stats
CREATE POLICY "Partners can view their own share analytics"
ON rental_partner_share_analytics FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM partenaires WHERE user_id = auth.uid()
  )
);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all share analytics"
ON rental_partner_share_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'
  )
);