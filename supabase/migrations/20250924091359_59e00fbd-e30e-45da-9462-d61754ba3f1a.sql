-- Fonctions RPC pour le système de chat et évaluation taxi

-- Fonction pour insérer une évaluation de chauffeur
CREATE OR REPLACE FUNCTION public.insert_driver_rating(
  p_driver_id UUID,
  p_user_id UUID,
  p_booking_id UUID,
  p_rating INTEGER,
  p_feedback TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rating_id UUID;
BEGIN
  INSERT INTO public.driver_ratings (
    driver_id, user_id, booking_id, rating, feedback
  ) VALUES (
    p_driver_id, p_user_id, p_booking_id, p_rating, p_feedback
  ) RETURNING id INTO rating_id;
  
  -- Marquer la réservation comme évaluée
  UPDATE public.transport_bookings 
  SET rated = true 
  WHERE id = p_booking_id;
  
  RETURN rating_id;
END;
$$;

-- Fonction pour créer un signalement
CREATE OR REPLACE FUNCTION public.insert_booking_report(
  p_booking_id UUID,
  p_user_id UUID,
  p_driver_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_id UUID;
BEGIN
  INSERT INTO public.booking_reports (
    booking_id, user_id, driver_id, reason
  ) VALUES (
    p_booking_id, p_user_id, p_driver_id, p_reason
  ) RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$;

-- Fonction pour récupérer les messages de chat
CREATE OR REPLACE FUNCTION public.get_transport_chat_messages(
  p_booking_id UUID
)
RETURNS TABLE(
  id UUID,
  booking_id UUID,
  sender_id UUID,
  sender_type TEXT,
  message TEXT,
  message_type TEXT,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tcm.id,
    tcm.booking_id,
    tcm.sender_id,
    tcm.sender_type,
    tcm.message,
    tcm.message_type,
    tcm.metadata,
    tcm.sent_at,
    tcm.read_at
  FROM public.transport_chat_messages tcm
  WHERE tcm.booking_id = p_booking_id
  ORDER BY tcm.sent_at ASC;
END;
$$;

-- Fonction pour marquer un message comme lu
CREATE OR REPLACE FUNCTION public.mark_message_as_read(
  p_message_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.transport_chat_messages
  SET read_at = now()
  WHERE id = p_message_id
    AND read_at IS NULL;
END;
$$;

-- Fonction pour envoyer un message de chat
CREATE OR REPLACE FUNCTION public.send_transport_chat_message(
  p_booking_id UUID,
  p_sender_id UUID,
  p_message TEXT,
  p_message_type TEXT DEFAULT 'text'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO public.transport_chat_messages (
    booking_id, sender_id, sender_type, message, message_type
  ) VALUES (
    p_booking_id, p_sender_id, 'client', p_message, p_message_type
  ) RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$;