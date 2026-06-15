-- Corriger les produits existants avec moderation_status 'inactive' -> 'pending'
UPDATE marketplace_products
SET moderation_status = 'pending', updated_at = NOW()
WHERE moderation_status = 'inactive'
  AND created_at > NOW() - INTERVAL '30 days'
  AND status = 'active';

-- Log correction
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count > 0 THEN
    INSERT INTO activity_logs (activity_type, description, metadata)
    VALUES (
      'marketplace_moderation_fix',
      'Correction automatique du statut de modération des produits',
      jsonb_build_object('products_updated', v_updated_count)
    );
  END IF;
END $$;