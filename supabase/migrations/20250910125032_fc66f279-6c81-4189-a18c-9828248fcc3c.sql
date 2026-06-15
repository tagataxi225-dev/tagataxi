-- Étape 1: Sécurité et notifications unifiées (corrigé)

-- Supprimer les vues SECURITY DEFINER dangereuses
SELECT cleanup_security_definer_views();

-- Créer la table d'audit des webhooks
CREATE TABLE IF NOT EXISTS public.webhook_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_data JSONB,
  execution_time_ms INTEGER,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  correlation_id UUID,
  success BOOLEAN NOT NULL DEFAULT false,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_webhook_audit_type_date ON public.webhook_audit_logs(webhook_type, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_correlation ON public.webhook_audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_user ON public.webhook_audit_logs(user_id);

-- RLS
ALTER TABLE public.webhook_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_audit_admin_only" ON public.webhook_audit_logs
  FOR ALL USING (is_current_user_admin());

-- Table unifiée des notifications
CREATE TABLE IF NOT EXISTS public.unified_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  channels TEXT[] NOT NULL DEFAULT ARRAY['push'],
  delivery_status JSONB NOT NULL DEFAULT '{}',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  correlation_id UUID,
  template_id UUID,
  source_event TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performance (sans USING GIN pour JSONB temporairement)
CREATE INDEX IF NOT EXISTS idx_unified_notifications_user_priority ON public.unified_notifications(user_id, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_unified_notifications_category ON public.unified_notifications(category, created_at);
CREATE INDEX IF NOT EXISTS idx_unified_notifications_reference ON public.unified_notifications(reference_type, reference_id);

-- RLS
ALTER TABLE public.unified_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unified_notifications_user_access" ON public.unified_notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "unified_notifications_admin_access" ON public.unified_notifications
  FOR ALL USING (is_current_user_admin());