-- Table pour l'historique des notifications utilisateur
CREATE TABLE IF NOT EXISTS public.user_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.user_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.user_notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_is_read ON public.user_notification_logs(user_id, is_read);

-- Enable RLS
ALTER TABLE public.user_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.user_notification_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.user_notification_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.user_notification_logs FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
ON public.user_notification_logs FOR INSERT
WITH CHECK (true);

-- Table pour les tokens FCM
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
ON public.push_notification_tokens FOR ALL
USING (auth.uid() = user_id);