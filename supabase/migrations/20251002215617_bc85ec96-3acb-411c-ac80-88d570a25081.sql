-- Table de signalement de produits marketplace
CREATE TABLE IF NOT EXISTS public.product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_reports_product ON public.product_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reports_status ON public.product_reports(status);
CREATE INDEX IF NOT EXISTS idx_product_reports_reporter ON public.product_reports(reporter_id);

-- RLS Policies
ALTER TABLE public.product_reports ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres signalements
CREATE POLICY "Users can view own reports"
ON public.product_reports
FOR SELECT
USING (auth.uid() = reporter_id OR is_current_user_admin());

-- Les utilisateurs peuvent créer des signalements
CREATE POLICY "Users can create reports"
ON public.product_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Seuls les admins peuvent modifier les signalements
CREATE POLICY "Admins can update reports"
ON public.product_reports
FOR UPDATE
USING (is_current_user_admin());

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE TRIGGER update_product_reports_updated_at
BEFORE UPDATE ON public.product_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créer une notification admin lors d'un signalement
CREATE OR REPLACE FUNCTION public.notify_admin_product_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_title TEXT;
BEGIN
  -- Récupérer le titre du produit
  SELECT title INTO product_title
  FROM public.marketplace_products
  WHERE id = NEW.product_id;

  -- Créer une notification admin
  INSERT INTO public.admin_notifications (
    type, title, message, severity, data
  ) VALUES (
    'product_report',
    'Nouveau signalement de produit',
    'Un produit a été signalé : ' || COALESCE(product_title, 'Produit inconnu') || ' - Raison : ' || NEW.reason,
    'warning',
    jsonb_build_object(
      'report_id', NEW.id,
      'product_id', NEW.product_id,
      'reporter_id', NEW.reporter_id,
      'reason', NEW.reason,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger pour notification automatique
CREATE TRIGGER notify_admin_on_product_report
AFTER INSERT ON public.product_reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_product_report();

-- Fonction pour créer des notifications vendeur automatiques
CREATE OR REPLACE FUNCTION public.notify_seller_product_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notification lors de la soumission (status = active, moderation = pending)
  IF TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.moderation_status = 'pending' THEN
    INSERT INTO public.user_notifications (
      user_id, title, message, type, priority, data
    ) VALUES (
      NEW.seller_id,
      'Produit en cours de modération',
      'Votre produit "' || NEW.title || '" a été soumis et est en cours de vérification par notre équipe.',
      'marketplace',
      'normal',
      jsonb_build_object('product_id', NEW.id, 'status', 'pending')
    );
  END IF;

  -- Notification lors de l'approbation
  IF TG_OP = 'UPDATE' AND OLD.moderation_status = 'pending' AND NEW.moderation_status = 'approved' THEN
    INSERT INTO public.user_notifications (
      user_id, title, message, type, priority, data
    ) VALUES (
      NEW.seller_id,
      '✅ Produit approuvé',
      'Félicitations ! Votre produit "' || NEW.title || '" a été approuvé et est maintenant visible sur la marketplace.',
      'marketplace',
      'normal',
      jsonb_build_object('product_id', NEW.id, 'status', 'approved')
    );
  END IF;

  -- Notification lors du rejet
  IF TG_OP = 'UPDATE' AND OLD.moderation_status = 'pending' AND NEW.moderation_status = 'rejected' THEN
    INSERT INTO public.user_notifications (
      user_id, title, message, type, priority, data
    ) VALUES (
      NEW.seller_id,
      '❌ Produit rejeté',
      'Votre produit "' || NEW.title || '" a été rejeté. Raison : ' || COALESCE(NEW.rejection_reason, 'Non spécifiée'),
      'marketplace',
      'high',
      jsonb_build_object('product_id', NEW.id, 'status', 'rejected', 'reason', NEW.rejection_reason)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour notifications vendeur automatiques
DROP TRIGGER IF EXISTS notify_seller_on_product_status ON public.marketplace_products;
CREATE TRIGGER notify_seller_on_product_status
AFTER INSERT OR UPDATE OF moderation_status ON public.marketplace_products
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_product_status();