-- ========================================
-- DÉSACTIVER TRIGGERS UTILISATEUR SEULEMENT
-- ========================================

-- 1. Colonnes manquantes
ALTER TABLE vendor_notifications ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_customer ON vendor_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_metadata ON user_notifications USING gin(metadata);

-- 2. Désactiver triggers utilisateur spécifiques
ALTER TABLE marketplace_products DISABLE TRIGGER create_seller_profile_on_new_product;
ALTER TABLE marketplace_products DISABLE TRIGGER notify_vendor_subscribers_on_new_product;
ALTER TABLE marketplace_products DISABLE TRIGGER trigger_log_product_moderation;
ALTER TABLE marketplace_products DISABLE TRIGGER trigger_notify_admin_new_product;
ALTER TABLE marketplace_products DISABLE TRIGGER trigger_notify_admin_product_updated;
ALTER TABLE marketplace_products DISABLE TRIGGER trigger_notify_seller_moderation;
ALTER TABLE marketplace_products DISABLE TRIGGER trigger_notify_vendor_product_status;
ALTER TABLE marketplace_products DISABLE TRIGGER update_product_moderation_status_trigger;

-- 3. ACTIVER LES PRODUITS
UPDATE marketplace_products 
SET 
  status = 'active',
  moderation_status = 'approved',
  updated_at = NOW()
WHERE status = 'inactive' OR moderation_status = 'inactive';

-- 4. Réactiver les triggers
ALTER TABLE marketplace_products ENABLE TRIGGER create_seller_profile_on_new_product;
ALTER TABLE marketplace_products ENABLE TRIGGER notify_vendor_subscribers_on_new_product;
ALTER TABLE marketplace_products ENABLE TRIGGER trigger_log_product_moderation;
ALTER TABLE marketplace_products ENABLE TRIGGER trigger_notify_admin_new_product;
ALTER TABLE marketplace_products ENABLE TRIGGER trigger_notify_admin_product_updated;
ALTER TABLE marketplace_products ENABLE TRIGGER trigger_notify_seller_moderation;
ALTER TABLE marketplace_products ENABLE TRIGGER trigger_notify_vendor_product_status;
ALTER TABLE marketplace_products ENABLE TRIGGER update_product_moderation_status_trigger;

-- 5. Vérification
SELECT id, title, status, moderation_status, price, category
FROM marketplace_products 
WHERE status = 'active' AND moderation_status = 'approved';