-- Migration corrigée avec REFRESH MATERIALIZED VIEW
DO $$
DECLARE
  v_default_partner_id UUID;
  v_admin_user_id UUID;
  v_orphan_count INTEGER;
BEGIN
  SELECT id INTO v_admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_admin_user_id IS NULL THEN RAISE EXCEPTION 'Aucun utilisateur trouvé'; END IF;

  INSERT INTO partenaires (
    user_id, company_name, display_name, phone_number, business_type, address,
    slogan, shop_description, phone, email, website, created_at, updated_at
  )
  SELECT 
    v_admin_user_id, 'Kwenda Location', 'Kwenda Location', 
    '+243000000000', 'rental_agency', 'Kinshasa, RDC',
    'Flotte officielle Kwenda',
    'Véhicules officiels de la plateforme Kwenda, vérifiés et garantis.',
    '+243 000 000 000', 'location@kwenda.cd', 'https://kwenda.cd',
    NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM partenaires WHERE company_name = 'Kwenda Location')
  RETURNING id INTO v_default_partner_id;

  IF v_default_partner_id IS NULL THEN 
    SELECT id INTO v_default_partner_id FROM partenaires WHERE company_name = 'Kwenda Location' LIMIT 1; 
  END IF;

  SELECT COUNT(*) INTO v_orphan_count FROM rental_vehicles WHERE partner_id IS NULL;
  UPDATE rental_vehicles SET partner_id = v_default_partner_id, updated_at = NOW() WHERE partner_id IS NULL;
  
  -- Rafraîchir la vue matérialisée pour mettre à jour les stats
  REFRESH MATERIALIZED VIEW CONCURRENTLY partner_rental_stats;
    
  RAISE NOTICE '✅ Migration réussie: % véhicules orphelins assignés à Kwenda Location', v_orphan_count;
END $$;