-- Table vendor_product_notifications pour notifier les vendeurs
CREATE TABLE IF NOT EXISTS public.vendor_product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('product_approved', 'product_rejected', 'product_pending')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.vendor_product_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own notifications"
ON public.vendor_product_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = vendor_id);

CREATE POLICY "System can insert notifications"
ON public.vendor_product_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Vendors can update their notifications"
ON public.vendor_product_notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor 
ON public.vendor_product_notifications(vendor_id, is_read, created_at DESC);

-- Fonction pour créer une notification automatique lors de l'approbation/rejet
CREATE OR REPLACE FUNCTION public.notify_vendor_product_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le statut de modération change
  IF (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status) THEN
    
    -- Notification d'approbation
    IF NEW.moderation_status = 'approved' THEN
      INSERT INTO public.vendor_product_notifications (
        vendor_id,
        product_id,
        notification_type,
        title,
        message,
        priority,
        metadata
      ) VALUES (
        NEW.seller_id,
        NEW.id,
        'product_approved',
        '✅ Produit approuvé',
        format('Votre produit "%s" a été approuvé et est maintenant visible sur la marketplace.', NEW.title),
        'high',
        jsonb_build_object('product_title', NEW.title, 'category', NEW.category)
      );
    
    -- Notification de rejet
    ELSIF NEW.moderation_status = 'rejected' THEN
      INSERT INTO public.vendor_product_notifications (
        vendor_id,
        product_id,
        notification_type,
        title,
        message,
        priority,
        metadata
      ) VALUES (
        NEW.seller_id,
        NEW.id,
        'product_rejected',
        '❌ Produit rejeté',
        format('Votre produit "%s" a été rejeté. Raison: %s', NEW.title, COALESCE(NEW.rejection_reason, 'Non conforme')),
        'high',
        jsonb_build_object(
          'product_title', NEW.title, 
          'category', NEW.category,
          'rejection_reason', COALESCE(NEW.rejection_reason, 'Non conforme')
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger sur marketplace_products
DROP TRIGGER IF EXISTS trigger_notify_vendor_product_status ON public.marketplace_products;
CREATE TRIGGER trigger_notify_vendor_product_status
AFTER UPDATE ON public.marketplace_products
FOR EACH ROW
EXECUTE FUNCTION public.notify_vendor_product_status();