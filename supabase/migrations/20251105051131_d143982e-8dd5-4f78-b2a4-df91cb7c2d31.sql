-- ✅ SOLUTION SÉCURISÉE : Désactiver les produits test au lieu de les supprimer
-- Cela évite les problèmes de foreign key et garde l'historique

UPDATE marketplace_products
SET 
  status = 'inactive',
  moderation_status = 'rejected',
  rejection_reason = 'Produit de test - Désactivé automatiquement',
  updated_at = NOW()
WHERE seller_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335';

-- Log de l'action
COMMENT ON TABLE marketplace_products IS 'Produits test désactivés le 2025-11-05 - Marketplace prête pour production';