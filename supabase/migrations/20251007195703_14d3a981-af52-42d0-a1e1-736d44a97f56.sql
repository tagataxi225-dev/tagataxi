-- =====================================================
-- TABLE: notification_campaign_history
-- Description: Historique des campagnes de notifications push admin
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_campaign_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_title TEXT NOT NULL,
  message_content TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'all_clients', 'all_drivers', etc.
  target_criteria JSONB DEFAULT '{}'::jsonb,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Statistiques
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  
  -- Métadonnées
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_notification_campaigns_sent_by ON public.notification_campaign_history(sent_by);
CREATE INDEX idx_notification_campaigns_status ON public.notification_campaign_history(status);
CREATE INDEX idx_notification_campaigns_target_type ON public.notification_campaign_history(target_type);
CREATE INDEX idx_notification_campaigns_created_at ON public.notification_campaign_history(created_at DESC);

-- RLS: Seuls les admins peuvent gérer les campagnes
ALTER TABLE public.notification_campaign_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all campaigns"
ON public.notification_campaign_history
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_notification_campaign_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notification_campaign_timestamp
BEFORE UPDATE ON public.notification_campaign_history
FOR EACH ROW
EXECUTE FUNCTION update_notification_campaign_updated_at();

COMMENT ON TABLE public.notification_campaign_history IS 'Historique et statistiques des campagnes de notifications push envoyées par les admins';