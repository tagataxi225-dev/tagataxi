-- Deuxième partie: Création des tables et configuration du système de notifications

-- Mise à jour de la table role_permissions pour ajouter les nouvelles permissions
INSERT INTO public.role_permissions (role, admin_role, permission, is_active) VALUES
  ('admin', 'super_admin', 'notifications_admin', true),
  ('admin', 'content_admin', 'notifications_write', true),
  ('admin', 'content_admin', 'notifications_read', true),
  ('admin', 'support_admin', 'notifications_write', true),
  ('admin', 'support_admin', 'notifications_read', true),
  ('admin', 'finance_admin', 'notifications_read', true)
ON CONFLICT (role, admin_role, permission) DO NOTHING;

-- Table des types de notifications
CREATE TABLE IF NOT EXISTS public.admin_notification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des templates de notifications
CREATE TABLE IF NOT EXISTS public.admin_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID NOT NULL REFERENCES public.admin_notification_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  content_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des notifications envoyées par les admins
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID NOT NULL REFERENCES public.admin_notification_types(id),
  template_id UUID REFERENCES public.admin_notification_templates(id),
  sender_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all_users', 'user_role', 'specific_users', 'zone_users')),
  target_criteria JSONB,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des notifications individuelles envoyées aux utilisateurs
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_notification_id UUID REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activation RLS sur toutes les tables
ALTER TABLE public.admin_notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour admin_notification_types
CREATE POLICY "Admins can manage notification types" ON public.admin_notification_types
  FOR ALL USING (has_permission(auth.uid(), 'notifications_admin'));

CREATE POLICY "Everyone can view active notification types" ON public.admin_notification_types
  FOR SELECT USING (is_active = true);

-- Policies pour admin_notification_templates
CREATE POLICY "Admins can manage notification templates" ON public.admin_notification_templates
  FOR ALL USING (has_permission(auth.uid(), 'notifications_admin'));

CREATE POLICY "Notification managers can view templates" ON public.admin_notification_templates
  FOR SELECT USING (has_permission(auth.uid(), 'notifications_write') OR has_permission(auth.uid(), 'notifications_admin'));

-- Policies pour admin_notifications
CREATE POLICY "Admins can manage all notifications" ON public.admin_notifications
  FOR ALL USING (has_permission(auth.uid(), 'notifications_admin'));

CREATE POLICY "Notification managers can manage their notifications" ON public.admin_notifications
  FOR ALL USING (has_permission(auth.uid(), 'notifications_write') AND sender_id = auth.uid());

CREATE POLICY "Notification managers can view all notifications" ON public.admin_notifications
  FOR SELECT USING (has_permission(auth.uid(), 'notifications_write') OR has_permission(auth.uid(), 'notifications_admin'));

-- Policies pour user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create user notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all user notifications" ON public.user_notifications
  FOR SELECT USING (has_permission(auth.uid(), 'notifications_admin'));

-- Triggers pour updated_at
CREATE TRIGGER update_admin_notification_types_updated_at
  BEFORE UPDATE ON public.admin_notification_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_notification_templates_updated_at
  BEFORE UPDATE ON public.admin_notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_notifications_updated_at
  BEFORE UPDATE ON public.admin_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notifications_updated_at
  BEFORE UPDATE ON public.user_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Données initiales pour les types de notifications
INSERT INTO public.admin_notification_types (name, description) VALUES 
  ('system', 'Notifications système importantes'),
  ('marketing', 'Notifications commerciales et promotionnelles'),
  ('update', 'Mises à jour de l''application'),
  ('maintenance', 'Notifications de maintenance'),
  ('security', 'Alertes de sécurité'),
  ('welcome', 'Messages de bienvenue'),
  ('announcement', 'Annonces générales')
ON CONFLICT (name) DO NOTHING;

-- Templates de base
INSERT INTO public.admin_notification_templates (type_id, name, title_template, content_template) 
SELECT 
  nt.id,
  'Bienvenue sur Kwenda',
  'Bienvenue {{user_name}} !',
  'Merci de vous être inscrit sur Kwenda. Votre application VTC et livraison pour l''Afrique francophone.'
FROM public.admin_notification_types nt 
WHERE nt.name = 'welcome'
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_notification_templates (type_id, name, title_template, content_template) 
SELECT 
  nt.id,
  'Maintenance programmée',
  'Maintenance prévue - {{date}}',
  'Une maintenance est programmée le {{date}} de {{start_time}} à {{end_time}}. Les services pourraient être temporairement indisponibles.'
FROM public.admin_notification_types nt 
WHERE nt.name = 'maintenance'
ON CONFLICT DO NOTHING;

-- Fonction pour obtenir les statistiques de notifications
CREATE OR REPLACE FUNCTION public.get_notification_stats(admin_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB := '{}';
  total_sent INTEGER;
  total_read INTEGER;
  total_pending INTEGER;
  total_failed INTEGER;
BEGIN
  -- Statistiques générales
  SELECT COUNT(*) INTO total_sent
  FROM public.admin_notifications
  WHERE (admin_id IS NULL OR sender_id = admin_id)
    AND status = 'sent';

  SELECT COUNT(*) INTO total_pending  
  FROM public.admin_notifications
  WHERE (admin_id IS NULL OR sender_id = admin_id)
    AND status IN ('draft', 'scheduled', 'sending');

  SELECT COUNT(*) INTO total_failed
  FROM public.admin_notifications
  WHERE (admin_id IS NULL OR sender_id = admin_id)
    AND status = 'failed';

  SELECT COUNT(*) INTO total_read
  FROM public.user_notifications un
  JOIN public.admin_notifications an ON un.admin_notification_id = an.id
  WHERE (admin_id IS NULL OR an.sender_id = admin_id)
    AND un.is_read = true;

  result := jsonb_build_object(
    'total_sent', total_sent,
    'total_read', total_read,
    'total_pending', total_pending,
    'total_failed', total_failed,
    'read_rate', CASE WHEN total_sent > 0 THEN ROUND((total_read::NUMERIC / total_sent) * 100, 2) ELSE 0 END
  );

  RETURN result;
END;
$$;