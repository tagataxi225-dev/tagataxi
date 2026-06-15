-- ================================================================
-- CORRECTION DU FLUX DE MODÉRATION MARKETPLACE
-- ================================================================
-- Objectif : S'assurer que les produits en attente de modération 
--            ne sont PAS visibles publiquement, uniquement par admin

-- ================================================================
-- 1. POLITIQUE RLS : LECTURE PUBLIQUE (uniquement produits approuvés)
-- ================================================================
DROP POLICY IF EXISTS "marketplace_products_public_read" ON public.marketplace_products;

CREATE POLICY "marketplace_products_public_read" 
ON public.marketplace_products 
FOR SELECT 
TO authenticated
USING (
  moderation_status = 'approved' 
  AND status = 'active'
);

-- ================================================================
-- 2. POLITIQUE RLS : VENDEURS peuvent voir LEURS produits (tous statuts)
-- ================================================================
DROP POLICY IF EXISTS "marketplace_products_seller_view_own" ON public.marketplace_products;

CREATE POLICY "marketplace_products_seller_view_own" 
ON public.marketplace_products 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = seller_id
);

-- ================================================================
-- 3. POLITIQUE RLS : ADMINS peuvent voir TOUS les produits
-- ================================================================
DROP POLICY IF EXISTS "marketplace_products_admin_view_all" ON public.marketplace_products;

CREATE POLICY "marketplace_products_admin_view_all" 
ON public.marketplace_products 
FOR SELECT 
TO authenticated
USING (
  is_current_user_admin()
);

-- ================================================================
-- 4. POLITIQUE RLS : VENDEURS VÉRIFIÉS peuvent créer des produits
-- ================================================================
DROP POLICY IF EXISTS "marketplace_products_verified_sellers_insert" ON public.marketplace_products;

CREATE POLICY "marketplace_products_verified_sellers_insert" 
ON public.marketplace_products 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = seller_id
  AND EXISTS (
    SELECT 1 FROM public.seller_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.verified_seller = true
  )
);

-- ================================================================
-- 5. POLITIQUE RLS : VENDEURS peuvent modifier leurs propres produits (sauf moderation_status)
-- ================================================================
DROP POLICY IF EXISTS "marketplace_products_seller_update_own" ON public.marketplace_products;

CREATE POLICY "marketplace_products_seller_update_own" 
ON public.marketplace_products 
FOR UPDATE 
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- ================================================================
-- 6. POLITIQUE RLS : ADMINS peuvent modifier tous les produits
-- ================================================================
DROP POLICY IF EXISTS "marketplace_products_admin_update_all" ON public.marketplace_products;

CREATE POLICY "marketplace_products_admin_update_all" 
ON public.marketplace_products 
FOR UPDATE 
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- ================================================================
-- 7. TRIGGER : NOTIFICATION VENDEUR APRÈS APPROBATION/REJET
-- ================================================================
CREATE OR REPLACE FUNCTION public.notify_seller_moderation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notification si le statut de modération change
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    
    -- ✅ APPROUVÉ : Notification positive
    IF NEW.moderation_status = 'approved' THEN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        notification_type,
        reference_type,
        reference_id
      ) VALUES (
        NEW.seller_id,
        '✅ Produit approuvé',
        'Votre produit "' || NEW.title || '" a été approuvé et est maintenant visible sur la marketplace.',
        'marketplace_approval',
        'marketplace_product',
        NEW.id
      );
    
    -- ❌ REJETÉ : Notification avec raison
    ELSIF NEW.moderation_status = 'rejected' THEN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        notification_type,
        reference_type,
        reference_id
      ) VALUES (
        NEW.seller_id,
        '❌ Produit rejeté',
        'Votre produit "' || NEW.title || '" a été rejeté. Raison : ' || COALESCE(NEW.rejection_reason, 'Non spécifiée'),
        'marketplace_rejection',
        'marketplace_product',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_notify_seller_moderation ON public.marketplace_products;

CREATE TRIGGER trigger_notify_seller_moderation
AFTER UPDATE ON public.marketplace_products
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_moderation_status();

-- ================================================================
-- 8. VÉRIFICATION : S'assurer que la colonne rejection_reason existe
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'marketplace_products' 
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.marketplace_products 
    ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;