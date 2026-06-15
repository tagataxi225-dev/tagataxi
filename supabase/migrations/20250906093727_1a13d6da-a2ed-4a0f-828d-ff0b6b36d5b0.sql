-- Créer les tables manquantes pour le système de notifications et chat de livraison

-- Table pour les notifications de livraison
CREATE TABLE IF NOT EXISTS public.delivery_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  delivery_order_id uuid REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  notification_type text NOT NULL DEFAULT 'status_update',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_user_id ON public.delivery_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_order_id ON public.delivery_notifications(delivery_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_created_at ON public.delivery_notifications(created_at DESC);

-- Activer RLS
ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour les notifications
CREATE POLICY "Users can access their own delivery notifications"
ON public.delivery_notifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table pour les messages de chat de livraison
CREATE TABLE IF NOT EXISTS public.delivery_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_order_id uuid NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'driver', 'system')),
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_delivery_chat_messages_order_id ON public.delivery_chat_messages(delivery_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_chat_messages_sent_at ON public.delivery_chat_messages(sent_at DESC);

-- Activer RLS
ALTER TABLE public.delivery_chat_messages ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour les messages de chat
CREATE POLICY "Delivery participants can access chat messages"
ON public.delivery_chat_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_orders 
    WHERE id = delivery_order_id 
    AND (user_id = auth.uid() OR driver_id = auth.uid())
  )
  OR auth.uid() = sender_id
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delivery_orders 
    WHERE id = delivery_order_id 
    AND (user_id = auth.uid() OR driver_id = auth.uid())
  )
  OR auth.uid() = sender_id
);

-- Trigger pour mettre à jour updated_at sur delivery_notifications
CREATE OR REPLACE FUNCTION public.update_delivery_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER update_delivery_notifications_updated_at
  BEFORE UPDATE ON public.delivery_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_delivery_notifications_updated_at();