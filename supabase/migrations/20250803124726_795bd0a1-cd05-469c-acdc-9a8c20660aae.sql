-- Créer des données de test avec des UUIDs existants ou les générer

-- Insérer des profils de test directement
INSERT INTO profiles (user_id, display_name, phone_number, user_type) 
SELECT gen_random_uuid(), 'Jean Mukendi', '+243970123456', 'client'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Jean Mukendi')
UNION ALL
SELECT gen_random_uuid(), 'Marie Tshimbala', '+243970234567', 'client'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Marie Tshimbala')
UNION ALL  
SELECT gen_random_uuid(), 'Patrick Ngoma', '+243970345678', 'chauffeur'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Patrick Ngoma')
UNION ALL
SELECT gen_random_uuid(), 'Grace Kabamba', '+243970456789', 'chauffeur'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Grace Kabamba')
UNION ALL
SELECT gen_random_uuid(), 'Joseph Mulamba', '+243970567890', 'chauffeur'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Joseph Mulamba');

-- Récupérer les IDs des chauffeurs créés
DO $$
DECLARE
    patrick_id UUID;
    grace_id UUID;
    joseph_id UUID;
    jean_id UUID;
    marie_id UUID;
BEGIN
    -- Récupérer les IDs
    SELECT user_id INTO patrick_id FROM profiles WHERE display_name = 'Patrick Ngoma' LIMIT 1;
    SELECT user_id INTO grace_id FROM profiles WHERE display_name = 'Grace Kabamba' LIMIT 1;
    SELECT user_id INTO joseph_id FROM profiles WHERE display_name = 'Joseph Mulamba' LIMIT 1;
    SELECT user_id INTO jean_id FROM profiles WHERE display_name = 'Jean Mukendi' LIMIT 1;
    SELECT user_id INTO marie_id FROM profiles WHERE display_name = 'Marie Tshimbala' LIMIT 1;

    -- Créer des profils de chauffeurs vérifiés
    INSERT INTO driver_profiles (
      user_id, license_number, vehicle_make, vehicle_model, vehicle_year, 
      vehicle_plate, vehicle_color, vehicle_class, insurance_number, 
      license_expiry, insurance_expiry, verification_status, is_active,
      rating_average, rating_count, total_rides
    ) VALUES
      (patrick_id, 'KIN123456', 'Toyota', 'Corolla', 2020, 
       'CD-1234-KIN', 'Blanc', 'standard', 'INS789012', '2026-12-31', '2025-12-31', 
       'verified', true, 4.8, 150, 145),
      (grace_id, 'KIN234567', 'Hyundai', 'Accent', 2021, 
       'CD-2345-KIN', 'Gris', 'standard', 'INS890123', '2027-06-30', '2025-12-31', 
       'verified', true, 4.6, 89, 85),
      (joseph_id, 'KIN345678', 'Kia', 'Picanto', 2019, 
       'CD-3456-KIN', 'Rouge', 'economy', 'INS901234', '2026-08-15', '2025-12-31', 
       'verified', true, 4.9, 200, 195)
    ON CONFLICT (user_id) DO NOTHING;

    -- Ajouter des localisations de chauffeurs actifs
    INSERT INTO driver_locations (
      driver_id, latitude, longitude, is_online, is_available, 
      vehicle_class, last_ping
    ) VALUES
      (patrick_id, -4.4419, 15.2663, true, true, 'standard', now()),
      (grace_id, -4.4350, 15.2950, true, true, 'standard', now()),
      (joseph_id, -4.4500, 15.2800, true, true, 'economy', now())
    ON CONFLICT (driver_id) DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      is_online = EXCLUDED.is_online,
      is_available = EXCLUDED.is_available,
      last_ping = EXCLUDED.last_ping;

    -- Ajouter des produits dans la marketplace
    INSERT INTO marketplace_products (
      seller_id, title, description, price, category, subcategory, 
      images, condition, location, status, featured
    ) VALUES
      (jean_id, 'iPhone 13 Pro Max 256GB', 
       'iPhone 13 Pro Max en excellent état, avec chargeur et écouteurs originaux', 
       850000, 'electronique', 'smartphones', 
       '["https://images.unsplash.com/photo-1632661674596-df8be070a5c8?w=400"]', 
       'excellent', 'Gombe, Kinshasa', 'active', true),
       
      (marie_id, 'Robe Africaine Wax', 
       'Belle robe en tissu wax authentique, taille M, parfaite pour occasions spéciales', 
       45000, 'mode', 'femme', 
       '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400"]', 
       'neuf', 'Kalamu, Kinshasa', 'active', false),
       
      (jean_id, 'Machine à laver Samsung 7kg', 
       'Machine à laver automatique, très peu utilisée, garantie encore valide', 
       320000, 'electromenager', 'gros_electromenager', 
       '["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"]', 
       'excellent', 'Lemba, Kinshasa', 'active', false),
       
      (marie_id, 'Lot Cosmétiques Bio', 
       'Set complet de cosmétiques bio pour soin du visage, produits naturels', 
       25000, 'beaute', 'soin_visage', 
       '["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400"]', 
       'neuf', 'Matete, Kinshasa', 'active', true),
       
      (jean_id, 'Canapé 3 places cuir', 
       'Canapé en cuir véritable, très confortable, parfait état', 
       180000, 'maison', 'salon', 
       '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"]', 
       'bon', 'Ngaliema, Kinshasa', 'active', false),
       
      (marie_id, 'Vélo VTT Décathlon', 
       'VTT en bon état, idéal pour déplacements en ville ou balades', 
       95000, 'sport', 'cyclisme', 
       '["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"]', 
       'bon', 'Kasa-Vubu, Kinshasa', 'active', false)
    ON CONFLICT DO NOTHING;

    -- Ajouter des portefeuilles pour les utilisateurs
    INSERT INTO user_wallets (user_id, balance, currency) VALUES
      (jean_id, 50000.00, 'CDF'),
      (marie_id, 75000.00, 'CDF'),
      (patrick_id, 120000.00, 'CDF'),
      (grace_id, 85000.00, 'CDF'),
      (joseph_id, 95000.00, 'CDF')
    ON CONFLICT (user_id) DO UPDATE SET
      balance = EXCLUDED.balance;

    -- Ajouter quelques lieux récents pour les utilisateurs
    INSERT INTO user_places (user_id, name, address, coordinates, place_type) VALUES
      (jean_id, 'Maison', 'Avenue Tombalbaye, Gombe', '{"lat": -4.4419, "lng": 15.2663}', 'home'),
      (jean_id, 'Bureau', 'Boulevard du 30 Juin, Centre-ville', '{"lat": -4.4400, "lng": 15.2700}', 'work'),
      (marie_id, 'Domicile', 'Kalamu, près du marché', '{"lat": -4.4500, "lng": 15.2800}', 'home'),
      (marie_id, 'Université', 'Campus UNIKIN, Lemba', '{"lat": -4.4600, "lng": 15.2900}', 'work')
    ON CONFLICT DO NOTHING;

END $$;