
-- 1) Table des abonnements push (tokens d’appareils)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios','android','web')),
  app_type text NOT NULL CHECK (app_type IN ('client','driver','partner','admin')),
  device_id text,
  device_model text,
  os_version text,
  language text,
  timezone text,
  notifications_enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Sécurité: l’utilisateur gère ses propres tokens
CREATE POLICY "Users can insert their own push tokens"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own push tokens"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins: gestion complète
CREATE POLICY "Admins can manage all push tokens"
  ON public.push_subscriptions
  FOR ALL
  USING (has_permission(auth.uid(), 'system_admin') OR has_permission(auth.uid(), 'support_admin'))
  WITH CHECK (has_permission(auth.uid(), 'system_admin') OR has_permission(auth.uid(), 'support_admin'));

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_app_type ON public.push_subscriptions(app_type);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform ON public.push_subscriptions(platform);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_seen ON public.push_subscriptions(last_seen_at);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS set_timestamp ON public.push_subscriptions;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Table de log des campagnes push
CREATE TABLE IF NOT EXISTS public.push_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  audience_type text NOT NULL CHECK (audience_type IN ('all','role','users','tokens')),
  audience_role text CHECK (audience_role IN ('client','driver','partner','admin')),
  target_user_ids uuid[],
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','partial')),
  error text,
  sent_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.push_messages ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire/écrire ces logs
CREATE POLICY "Admins can manage push messages"
  ON public.push_messages
  FOR ALL
  USING (has_permission(auth.uid(), 'system_admin') OR has_permission(auth.uid(), 'support_admin'))
  WITH CHECK (has_permission(auth.uid(), 'system_admin') OR has_permission(auth.uid(), 'support_admin'));

-- Index
CREATE INDEX IF NOT EXISTS idx_push_messages_created_at ON public.push_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_messages_audience_type ON public.push_messages (audience_type);
