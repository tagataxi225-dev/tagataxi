-- Étape 1: Sécurité - Corriger les vues SECURITY DEFINER et créer la table d'audit des webhooks

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
CREATE INDEX idx_webhook_audit_type_date ON public.webhook_audit_logs(webhook_type, created_at);
CREATE INDEX idx_webhook_audit_correlation ON public.webhook_audit_logs(correlation_id);
CREATE INDEX idx_webhook_audit_user ON public.webhook_audit_logs(user_id);

-- RLS
ALTER TABLE public.webhook_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_audit_admin_only" ON public.webhook_audit_logs
  FOR ALL USING (is_current_user_admin());

-- Fonction pour logger les webhooks
CREATE OR REPLACE FUNCTION public.log_webhook_audit(
  p_webhook_type TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}',
  p_response_status INTEGER DEFAULT NULL,
  p_response_data JSONB DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_retry_count INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.webhook_audit_logs (
    webhook_type, event_type, payload, response_status, response_data,
    execution_time_ms, user_id, success, retry_count, error_message,
    correlation_id
  ) VALUES (
    p_webhook_type, p_event_type, p_payload, p_response_status, p_response_data,
    p_execution_time_ms, auth.uid(), p_success, p_retry_count, p_error_message,
    COALESCE(p_correlation_id, gen_random_uuid())
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Table unifiée des notifications
CREATE TABLE IF NOT EXISTS public.unified_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- order, delivery, ride, marketplace, system
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Canaux de livraison
  channels TEXT[] NOT NULL DEFAULT ARRAY['push'], -- push, sms, email, websocket
  delivery_status JSONB NOT NULL DEFAULT '{}', -- {push: 'sent', sms: 'failed', email: 'pending'}
  
  -- Gestion des tentatives
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  correlation_id UUID,
  template_id UUID,
  source_event TEXT, -- webhook qui a créé la notification
  reference_id UUID, -- ID de l'objet source (commande, livraison, etc.)
  reference_type TEXT, -- type de l'objet source
  
  -- États
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performance
CREATE INDEX idx_unified_notifications_user_priority ON public.unified_notifications(user_id, priority, created_at);
CREATE INDEX idx_unified_notifications_status ON public.unified_notifications(delivery_status) USING GIN;
CREATE INDEX idx_unified_notifications_category ON public.unified_notifications(category, created_at);
CREATE INDEX idx_unified_notifications_retry ON public.unified_notifications(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_unified_notifications_reference ON public.unified_notifications(reference_type, reference_id);

-- RLS
ALTER TABLE public.unified_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unified_notifications_user_access" ON public.unified_notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "unified_notifications_admin_access" ON public.unified_notifications
  FOR ALL USING (is_current_user_admin());

-- Table des templates de notifications
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  default_channels TEXT[] NOT NULL DEFAULT ARRAY['push'],
  default_priority TEXT NOT NULL DEFAULT 'normal',
  variables JSONB NOT NULL DEFAULT '[]', -- Liste des variables requises
  conditions JSONB DEFAULT '{}', -- Conditions pour l'utilisation du template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS pour templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_read" ON public.notification_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "notification_templates_admin_manage" ON public.notification_templates
  FOR ALL USING (is_current_user_admin());

-- Triggers pour unified_notifications
CREATE OR REPLACE FUNCTION public.update_unified_notifications_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER unified_notifications_updated_at
  BEFORE UPDATE ON public.unified_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unified_notifications_timestamp();

-- Fonction pour créer une notification depuis un template
CREATE OR REPLACE FUNCTION public.create_notification_from_template(
  p_template_name TEXT,
  p_user_id UUID,
  p_variables JSONB DEFAULT '{}',
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  template_record RECORD;
  notification_id UUID;
  rendered_title TEXT;
  rendered_message TEXT;
  var_key TEXT;
  var_value TEXT;
BEGIN
  -- Récupérer le template
  SELECT * INTO template_record
  FROM public.notification_templates
  WHERE name = p_template_name AND is_active = true;
  
  IF template_record IS NULL THEN
    RAISE EXCEPTION 'Template % not found or inactive', p_template_name;
  END IF;
  
  -- Rendre le titre et le message avec les variables
  rendered_title := template_record.title_template;
  rendered_message := template_record.message_template;
  
  -- Remplacer les variables dans le titre et le message
  FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_variables) LOOP
    rendered_title := replace(rendered_title, '{{' || var_key || '}}', var_value);
    rendered_message := replace(rendered_message, '{{' || var_key || '}}', var_value);
  END LOOP;
  
  -- Créer la notification
  INSERT INTO public.unified_notifications (
    user_id, notification_type, category, priority, title, message,
    channels, template_id, reference_id, reference_type, correlation_id, data
  ) VALUES (
    p_user_id, template_record.name, template_record.category, template_record.default_priority,
    rendered_title, rendered_message, template_record.default_channels,
    template_record.id, p_reference_id, p_reference_type, 
    COALESCE(p_correlation_id, gen_random_uuid()), p_variables
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;