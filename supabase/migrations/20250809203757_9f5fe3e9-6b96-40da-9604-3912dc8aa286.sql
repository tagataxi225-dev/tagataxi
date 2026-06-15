-- Mise à jour de la table marketplace_orders pour inclure les nouveaux états et timestamps
ALTER TABLE public.marketplace_orders 
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pickup_coordinates JSONB,
ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_rating INTEGER,
ADD COLUMN IF NOT EXISTS customer_feedback TEXT;

-- Créer une table pour les notifications de suivi de commandes
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table des notifications
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour les notifications
CREATE POLICY "Users can view their own order notifications"
ON public.order_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert order notifications"
ON public.order_notifications
FOR INSERT
WITH CHECK (true);

-- Activer la réplication temps réel pour les notifications
ALTER TABLE public.order_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_orders REPLICA IDENTITY FULL;

-- Fonction pour créer des notifications automatiques lors du changement d'état
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  buyer_notification_type TEXT;
  seller_notification_type TEXT;
BEGIN
  -- Déterminer le type de notification basé sur le nouveau statut
  CASE NEW.status
    WHEN 'confirmed' THEN
      notification_title := 'Commande confirmée';
      notification_message := 'Votre commande a été confirmée par le vendeur';
      buyer_notification_type := 'order_confirmed';
      seller_notification_type := 'order_to_prepare';
    WHEN 'preparing' THEN
      notification_title := 'Commande en préparation';
      notification_message := 'Le vendeur prépare votre commande';
      buyer_notification_type := 'order_preparing';
    WHEN 'ready_for_pickup' THEN
      notification_title := 'Commande prête';
      notification_message := 'Votre commande est prête pour collecte/livraison';
      buyer_notification_type := 'order_ready';
    WHEN 'in_transit' THEN
      notification_title := 'Commande en livraison';
      notification_message := 'Votre commande est en route vers vous';
      buyer_notification_type := 'order_in_transit';
    WHEN 'delivered' THEN
      notification_title := 'Commande livrée';
      notification_message := 'Votre commande a été livrée avec succès';
      buyer_notification_type := 'order_delivered';
    WHEN 'completed' THEN
      notification_title := 'Commande terminée';
      notification_message := 'Transaction terminée avec succès';
      buyer_notification_type := 'order_completed';
      seller_notification_type := 'payment_released';
    ELSE
      RETURN NEW;
  END CASE;

  -- Créer notification pour l'acheteur
  IF buyer_notification_type IS NOT NULL THEN
    INSERT INTO public.order_notifications (
      order_id, user_id, notification_type, title, message, metadata
    ) VALUES (
      NEW.id, NEW.buyer_id, buyer_notification_type, 
      notification_title, notification_message,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  -- Créer notification pour le vendeur si nécessaire
  IF seller_notification_type IS NOT NULL THEN
    INSERT INTO public.order_notifications (
      order_id, user_id, notification_type, title, message, metadata
    ) VALUES (
      NEW.id, NEW.seller_id, seller_notification_type, 
      CASE seller_notification_type
        WHEN 'order_to_prepare' THEN 'Nouvelle commande à préparer'
        WHEN 'payment_released' THEN 'Paiement libéré'
        ELSE notification_title
      END,
      CASE seller_notification_type
        WHEN 'order_to_prepare' THEN 'Vous avez une nouvelle commande à préparer'
        WHEN 'payment_released' THEN 'Le paiement de votre vente a été libéré'
        ELSE notification_message
      END,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour les notifications automatiques
DROP TRIGGER IF EXISTS order_status_notification_trigger ON public.marketplace_orders;
CREATE TRIGGER order_status_notification_trigger
  AFTER UPDATE OF status ON public.marketplace_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_status_change();

-- Fonction pour calculer l'estimation de livraison
CREATE OR REPLACE FUNCTION public.calculate_delivery_estimate(order_id_param UUID)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  estimated_time TIMESTAMP WITH TIME ZONE;
  base_prep_time INTERVAL := '2 hours'::INTERVAL;
  delivery_time INTERVAL := '1 hour'::INTERVAL;
BEGIN
  -- Récupérer les détails de la commande
  SELECT * INTO order_record 
  FROM public.marketplace_orders 
  WHERE id = order_id_param;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculer l'estimation basée sur l'état actuel
  CASE order_record.status
    WHEN 'pending' THEN
      estimated_time := now() + base_prep_time + delivery_time;
    WHEN 'confirmed' THEN
      estimated_time := now() + base_prep_time + delivery_time;
    WHEN 'preparing' THEN
      estimated_time := now() + (base_prep_time / 2) + delivery_time;
    WHEN 'ready_for_pickup' THEN
      estimated_time := now() + delivery_time;
    WHEN 'in_transit' THEN
      estimated_time := now() + (delivery_time / 2);
    ELSE
      estimated_time := now();
  END CASE;
  
  RETURN estimated_time;
END;
$$;