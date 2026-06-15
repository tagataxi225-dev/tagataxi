-- Créer la table pour les notifications push
CREATE TABLE public.push_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  data JSONB DEFAULT '{}',
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  fcm_success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient leurs propres notifications
CREATE POLICY "Users can view their own notifications"
ON public.push_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Politique pour que le système puisse créer des notifications
CREATE POLICY "System can insert notifications"
ON public.push_notifications
FOR INSERT
WITH CHECK (true);

-- Politique pour que le système puisse mettre à jour le statut
CREATE POLICY "System can update notification status"
ON public.push_notifications
FOR UPDATE
USING (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_push_notifications_updated_at
BEFORE UPDATE ON public.push_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_push_notifications_user_id ON public.push_notifications(user_id);
CREATE INDEX idx_push_notifications_sent_at ON public.push_notifications(sent_at);
CREATE INDEX idx_push_notifications_priority ON public.push_notifications(priority);

-- Ajouter colonne FCM token aux profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;