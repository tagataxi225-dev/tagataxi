-- ✅ PHASE 1: Activer les commissions sur courses (transport + delivery)
-- Admin: 10%, Driver: 87.5%, Partner: 2.5%

-- Désactiver toutes les anciennes configurations
UPDATE commission_settings
SET is_active = false
WHERE service_type IN ('transport', 'delivery');

-- Créer nouvelle configuration pour TRANSPORT
INSERT INTO commission_settings (
  service_type,
  admin_rate,
  driver_rate,
  platform_rate,
  is_active,
  created_by
) VALUES (
  'transport',
  10.0,  -- 10% pour admin Kwenda
  87.5,  -- 87.5% pour le chauffeur
  2.5,   -- 2.5% pour le partenaire commercial
  true,
  (SELECT user_id FROM admins WHERE is_active = true ORDER BY created_at LIMIT 1)
);

-- Créer nouvelle configuration pour DELIVERY
INSERT INTO commission_settings (
  service_type,
  admin_rate,
  driver_rate,
  platform_rate,
  is_active,
  created_by
) VALUES (
  'delivery',
  10.0,  -- 10% pour admin Kwenda
  87.5,  -- 87.5% pour le chauffeur/livreur
  2.5,   -- 2.5% pour le partenaire commercial
  true,
  (SELECT user_id FROM admins WHERE is_active = true ORDER BY created_at LIMIT 1)
);

-- Vérification finale
SELECT 
  service_type,
  admin_rate || '%' as admin_commission,
  driver_rate || '%' as driver_keeps,
  platform_rate || '%' as partner_commission,
  is_active,
  created_at
FROM commission_settings
WHERE service_type IN ('transport', 'delivery') AND is_active = true
ORDER BY service_type;