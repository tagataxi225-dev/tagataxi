-- ==========================================
-- PHASE 1 - Correction du système de création de produits
-- ==========================================

-- 1.1 - Supprimer les policies redondantes sur marketplace_products
DROP POLICY IF EXISTS "Sellers create products" ON marketplace_products;
DROP POLICY IF EXISTS "marketplace_products_sellers_can_insert" ON marketplace_products;
DROP POLICY IF EXISTS "marketplace_products_verified_sellers_insert" ON marketplace_products;

-- Créer UNE SEULE policy claire et simple
CREATE POLICY "sellers_can_create_products" 
ON marketplace_products 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = seller_id 
  AND moderation_status = 'pending'
);

-- 1.2 - Créer table dédiée pour notifications produits vendeurs
CREATE TABLE IF NOT EXISTS public.vendor_product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_vendor_product_notifications_vendor_id ON public.vendor_product_notifications(vendor_id);
CREATE INDEX idx_vendor_product_notifications_product_id ON public.vendor_product_notifications(product_id);
CREATE INDEX idx_vendor_product_notifications_unread ON public.vendor_product_notifications(vendor_id, is_read) WHERE is_read = FALSE;

-- RLS Policy simple
ALTER TABLE public.vendor_product_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_view_own_product_notifications" 
ON public.vendor_product_notifications 
FOR SELECT 
TO authenticated
USING (auth.uid() = vendor_id);

CREATE POLICY "vendors_update_own_product_notifications" 
ON public.vendor_product_notifications 
FOR UPDATE 
TO authenticated
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Admins peuvent tout faire
CREATE POLICY "admins_manage_all_vendor_notifications" 
ON public.vendor_product_notifications 
FOR ALL 
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 1.3 - Déblocage immédiat pour le compte iouantchi@gmail.com
-- S'assurer que le compte peut créer des produits
DO $$
DECLARE
  ivan_user_id UUID;
  test_product_id UUID;
BEGIN
  -- Récupérer l'UUID d'Ivan
  SELECT user_id INTO ivan_user_id 
  FROM public.clients 
  WHERE email = 'iouantchi@gmail.com'
  LIMIT 1;
  
  IF ivan_user_id IS NOT NULL THEN
    -- Logger l'opération
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      ivan_user_id,
      'account_unblocked',
      'Compte déblocué pour création de produits marketplace',
      jsonb_build_object(
        'email', 'iouantchi@gmail.com',
        'action', 'marketplace_product_creation_enabled'
      )
    );
    
    RAISE NOTICE 'Compte iouantchi@gmail.com déblocué avec succès (user_id: %)', ivan_user_id;
  ELSE
    RAISE NOTICE 'Compte iouantchi@gmail.com non trouvé dans la table clients';
  END IF;
END $$;