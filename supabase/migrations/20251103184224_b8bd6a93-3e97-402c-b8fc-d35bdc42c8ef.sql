-- Fonction pour envoyer des notifications aux abonnés d'un vendeur
CREATE OR REPLACE FUNCTION send_notification_to_vendor_subscribers(
  p_vendor_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO vendor_notifications (
    customer_id,
    vendor_id,
    notification_type,
    title,
    message,
    metadata,
    is_read,
    is_acknowledged,
    sound_played,
    created_at
  )
  SELECT 
    customer_id,
    p_vendor_id,
    p_notification_type,
    p_title,
    p_message,
    p_metadata,
    false,
    false,
    false,
    NOW()
  FROM vendor_subscriptions
  WHERE vendor_id = p_vendor_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;