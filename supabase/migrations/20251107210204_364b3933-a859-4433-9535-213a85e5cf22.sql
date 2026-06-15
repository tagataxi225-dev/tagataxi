-- ============================================================================
-- PHASE 5: Données de test pour Système de Modération Marketplace
-- ============================================================================

DO $$ 
DECLARE
  test_vendor_id UUID;
  test_product_id_1 UUID;
  test_product_id_2 UUID;
  test_product_id_3 UUID;
BEGIN
  -- Récupérer un vendeur existant pour les tests
  SELECT user_id INTO test_vendor_id
  FROM vendor_profiles
  LIMIT 1;

  -- Si aucun vendeur trouvé, arrêter le script
  IF test_vendor_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucun vendeur trouvé. Veuillez créer un profil vendeur d''abord.';
    RETURN;
  END IF;

  RAISE NOTICE '📦 Création de produits de test pour le vendeur: %', test_vendor_id;

  -- 1️⃣ Produit en attente de modération (PENDING)
  INSERT INTO marketplace_products (
    seller_id,
    title,
    description,
    price,
    category,
    condition,
    images,
    stock_count,
    moderation_status,
    status
  ) VALUES (
    test_vendor_id,
    '[TEST] iPhone 14 Pro Max - En attente de modération',
    'Produit de test pour vérifier le workflow de modération. iPhone 14 Pro Max 256GB Noir, état neuf avec boîte et accessoires.',
    1200000,
    'electronics',
    'new',
    ARRAY['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400'],
    5,
    'pending',
    'active'
  ) RETURNING id INTO test_product_id_1;

  RAISE NOTICE '✅ Produit PENDING créé: % (devrait notifier les admins)', test_product_id_1;

  -- 2️⃣ Produit approuvé (APPROVED)
  INSERT INTO marketplace_products (
    seller_id,
    title,
    description,
    price,
    category,
    condition,
    images,
    stock_count,
    moderation_status,
    status
  ) VALUES (
    test_vendor_id,
    '[TEST] Samsung Galaxy S24 Ultra - Approuvé',
    'Produit de test déjà approuvé. Samsung Galaxy S24 Ultra 512GB Titanium.',
    1500000,
    'electronics',
    'new',
    ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'],
    3,
    'approved',
    'active'
  ) RETURNING id INTO test_product_id_2;

  RAISE NOTICE '✅ Produit APPROVED créé: %', test_product_id_2;

  -- 3️⃣ Produit rejeté (REJECTED)
  INSERT INTO marketplace_products (
    seller_id,
    title,
    description,
    price,
    category,
    condition,
    images,
    stock_count,
    moderation_status,
    rejection_reason,
    status
  ) VALUES (
    test_vendor_id,
    '[TEST] Produit Non Conforme - Rejeté',
    'Produit de test rejeté pour démonstration.',
    50000,
    'electronics',
    'used',
    ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    1,
    'rejected',
    'Images de mauvaise qualité et description insuffisante',
    'active'
  ) RETURNING id INTO test_product_id_3;

  RAISE NOTICE '✅ Produit REJECTED créé: %', test_product_id_3;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RÉSUMÉ DES PRODUITS DE TEST';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vendeur ID: %', test_vendor_id;
  RAISE NOTICE '1. PENDING (en attente): %', test_product_id_1;
  RAISE NOTICE '2. APPROVED (approuvé): %', test_product_id_2;
  RAISE NOTICE '3. REJECTED (rejeté): %', test_product_id_3;
  RAISE NOTICE '========================================';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des données de test: %', SQLERRM;
END $$;