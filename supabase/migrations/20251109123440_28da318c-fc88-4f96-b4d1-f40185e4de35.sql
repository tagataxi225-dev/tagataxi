-- ✅ PHASE 1: Correction du trigger défaillant qui bloque la publication de produits

-- 1. Désactiver le trigger problématique
DROP TRIGGER IF EXISTS trigger_notify_admin_new_product ON marketplace_products;

-- 2. Supprimer la fonction obsolète qui utilise des paramètres inexistants
DROP FUNCTION IF EXISTS notify_admin_on_new_product();

-- 3. Créer une nouvelle fonction CORRECTE qui ne dépend pas de paramètres inexistants
CREATE OR REPLACE FUNCTION notify_admin_on_new_product_v2()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer dans une table de queue pour traitement asynchrone
  INSERT INTO admin_notification_queue (
    notification_type,
    reference_id,
    reference_type,
    data,
    created_at
  ) VALUES (
    'new_product',
    NEW.id,
    'marketplace_product',
    jsonb_build_object(
      'product_id', NEW.id::text,
      'seller_id', NEW.seller_id::text,
      'product_title', NEW.title,
      'product_category', NEW.category,
      'product_price', NEW.price
    ),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne pas bloquer l'insertion si la notification échoue
    RAISE WARNING 'Failed to queue admin notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Créer la table de queue si elle n'existe pas
CREATE TABLE IF NOT EXISTS admin_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_unprocessed 
ON admin_notification_queue(created_at) 
WHERE processed = FALSE;

-- 6. Réactiver le trigger avec la nouvelle fonction
CREATE TRIGGER trigger_notify_admin_new_product_v2
  AFTER INSERT ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_new_product_v2();

-- 7. RLS pour sécurité
ALTER TABLE admin_notification_queue ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admins can view notifications" 
ON admin_notification_queue FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = TRUE
  )
);

-- Politique pour le système (service_role)
CREATE POLICY "System can manage notifications" 
ON admin_notification_queue FOR ALL
TO service_role
USING (true)
WITH CHECK (true);