-- Migration: Système de notifications pour les messages unifiés
-- Ajouter trigger pour notifier automatiquement lors de nouveaux messages

-- Fonction pour créer automatiquement une notification quand un message est envoyé
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation unified_conversations%ROWTYPE;
  v_recipient_id uuid;
  v_sender_profile profiles%ROWTYPE;
  v_notification_title text;
  v_notification_body text;
BEGIN
  -- Récupérer la conversation
  SELECT * INTO v_conversation 
  FROM unified_conversations 
  WHERE id = NEW.conversation_id;
  
  -- Déterminer le destinataire (l'autre participant)
  IF v_conversation.participant_1 = NEW.sender_id THEN
    v_recipient_id := v_conversation.participant_2;
  ELSE
    v_recipient_id := v_conversation.participant_1;
  END IF;
  
  -- ⚠️ Ne pas notifier si le sender = recipient (auto-message)
  IF v_recipient_id = NEW.sender_id THEN
    RAISE NOTICE 'Notification skipped: sender equals recipient';
    RETURN NEW;
  END IF;
  
  -- Récupérer le profil de l'expéditeur
  SELECT * INTO v_sender_profile 
  FROM profiles 
  WHERE user_id = NEW.sender_id;
  
  -- Construire le titre selon le contexte
  v_notification_title := COALESCE(v_sender_profile.display_name, 'Nouveau message');
  
  CASE v_conversation.context_type
    WHEN 'marketplace' THEN
      v_notification_title := '🛍️ ' || v_notification_title;
      v_notification_body := 'Nouveau message sur votre commande';
    WHEN 'transport' THEN
      v_notification_title := '🚗 ' || v_notification_title;
      v_notification_body := 'Message de votre chauffeur';
    WHEN 'delivery' THEN
      v_notification_title := '📦 ' || v_notification_title;
      v_notification_body := 'Message de livraison';
    WHEN 'rental' THEN
      v_notification_title := '🚙 ' || v_notification_title;
      v_notification_body := 'Message location de véhicule';
    ELSE
      v_notification_body := 'Nouveau message';
  END CASE;
  
  -- Insérer la notification
  INSERT INTO push_notifications (
    user_id,
    title,
    body,
    type,
    data,
    priority,
    created_at
  ) VALUES (
    v_recipient_id,
    v_notification_title,
    LEFT(NEW.content, 100),  -- Limiter à 100 caractères
    'chat_message',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'context_type', v_conversation.context_type,
      'context_id', v_conversation.context_id
    ),
    'high',
    now()
  );
  
  RAISE NOTICE 'Notification created for user % (conversation %)', v_recipient_id, NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.unified_messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.unified_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();

-- Vérifier et créer les politiques RLS sur push_notifications si manquantes
DO $$ 
BEGIN
  -- Politique pour voir ses propres notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_notifications' 
    AND policyname = 'Users can view their own push notifications'
  ) THEN
    CREATE POLICY "Users can view their own push notifications"
    ON public.push_notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;

  -- Politique pour insérer des notifications (système)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_notifications' 
    AND policyname = 'System can insert push notifications'
  ) THEN
    CREATE POLICY "System can insert push notifications"
    ON public.push_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Activer RLS sur push_notifications si pas déjà fait
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Activer realtime sur push_notifications pour les notifications instantanées
ALTER PUBLICATION supabase_realtime ADD TABLE push_notifications;