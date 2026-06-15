-- Insert test user profiles
INSERT INTO public.profiles (user_id, display_name, phone_number, user_type) VALUES
('123e4567-e89b-12d3-a456-426614174001', 'Jean Mukendi', '+243970123456', 'client'),
('123e4567-e89b-12d3-a456-426614174002', 'Marie Tshimanga', '+243970234567', 'client'),
('123e4567-e89b-12d3-a456-426614174003', 'Pierre Kabila', '+243970345678', 'chauffeur'),
('123e4567-e89b-12d3-a456-426614174004', 'Grace Mbuyi', '+243970456789', 'chauffeur'),
('123e4567-e89b-12d3-a456-426614174005', 'Emmanuel Kasongo', '+243970567890', 'partenaire'),
('123e4567-e89b-12d3-a456-426614174006', 'Solange Ilunga', '+243970678901', 'client')
ON CONFLICT (user_id) DO NOTHING;

-- Insert marketplace products
INSERT INTO public.marketplace_products (seller_id, title, description, price, category, subcategory, condition, location, coordinates, images, status) VALUES
('123e4567-e89b-12d3-a456-426614174005', 'Smartphone Samsung Galaxy A54', 'Téléphone neuf avec garantie, 128GB de stockage, écran AMOLED 6.4 pouces', 450000, 'electronique', 'smartphones', 'new', 'Gombe, Kinshasa', '{"lat": -4.4419, "lng": 15.2663}', '["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'Ordinateur portable HP Pavilion', 'Laptop performant pour le travail et les études, Intel i5, 8GB RAM, 256GB SSD', 650000, 'electronique', 'ordinateurs', 'new', 'Kalamu, Kinshasa', '{"lat": -4.4500, "lng": 15.2800}', '["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'Réfrigérateur LG 300L', 'Réfrigérateur neuf avec congélateur, classe énergétique A+, très économique', 380000, 'electromenager', 'refrigerateurs', 'new', 'Lemba, Kinshasa', '{"lat": -4.4300, "lng": 15.2900}', '["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'Canapé 3 places moderne', 'Canapé confortable en tissu, couleur grise, parfait pour salon', 250000, 'mobilier', 'salon', 'new', 'Ngaliema, Kinshasa', '{"lat": -4.4200, "lng": 15.2400}', '["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'Vélo de ville Decathlon', 'Vélo 21 vitesses, très bon état, idéal pour les déplacements en ville', 120000, 'sport', 'velos', 'good', 'Matete, Kinshasa', '{"lat": -4.4100, "lng": 15.3100}', '["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'Machine à laver Samsung 7kg', 'Lave-linge automatique, plusieurs programmes de lavage, très économique', 420000, 'electromenager', 'lave-linge', 'new', 'Masina, Kinshasa', '{"lat": -4.3800, "lng": 15.3400}', '["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'Table à manger 6 places', 'Table en bois massif avec 6 chaises, style moderne et élégant', 180000, 'mobilier', 'salle-a-manger', 'good', 'Kimbanseke, Kinshasa', '{"lat": -4.4000, "lng": 15.3600}', '["https://images.unsplash.com/photo-1549497538-303791108f95?w=400"]', 'active'),
('123e4567-e89b-12d3-a456-426614174005', 'PlayStation 5 + jeux', 'Console PS5 avec 2 manettes et 5 jeux inclus, état parfait', 750000, 'electronique', 'consoles', 'good', 'Ndjili, Kinshasa', '{"lat": -4.3900, "lng": 15.3300}', '["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400"]', 'active');

-- Insert driver profiles
INSERT INTO public.driver_profiles (user_id, license_number, license_expiry, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, vehicle_class, insurance_number, insurance_expiry, verification_status, is_active, total_rides, rating_average, rating_count) VALUES
('123e4567-e89b-12d3-a456-426614174003', 'KIN123456789', '2025-12-31', 'Toyota', 'Corolla', 2020, 'CD-123-AB', 'Blanc', 'standard', 'INS789123456', '2025-06-30', 'verified', true, 150, 4.7, 89),
('123e4567-e89b-12d3-a456-426614174004', 'KIN987654321', '2025-11-15', 'Hyundai', 'Accent', 2019, 'CD-456-CD', 'Gris', 'standard', 'INS456789123', '2025-05-15', 'verified', true, 203, 4.8, 156),
('123e4567-e89b-12d3-a456-426614174006', 'KIN555666777', '2025-10-20', 'Nissan', 'Sentra', 2021, 'CD-789-EF', 'Noir', 'premium', 'INS123456789', '2025-08-20', 'verified', true, 78, 4.9, 45)
ON CONFLICT (user_id) DO NOTHING;

-- Insert driver locations (active drivers)
INSERT INTO public.driver_locations (driver_id, latitude, longitude, is_online, is_available, vehicle_class, last_ping) VALUES
('123e4567-e89b-12d3-a456-426614174003', -4.4419, 15.2663, true, true, 'standard', now()),
('123e4567-e89b-12d3-a456-426614174004', -4.4500, 15.2800, true, true, 'standard', now()),
('123e4567-e89b-12d3-a456-426614174006', -4.4300, 15.2900, true, true, 'premium', now())
ON CONFLICT (driver_id) DO UPDATE SET 
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_online = EXCLUDED.is_online,
  is_available = EXCLUDED.is_available,
  last_ping = EXCLUDED.last_ping;

-- Insert user wallets
INSERT INTO public.user_wallets (user_id, balance, currency, is_active) VALUES
('123e4567-e89b-12d3-a456-426614174001', 50000, 'CDF', true),
('123e4567-e89b-12d3-a456-426614174002', 75000, 'CDF', true),
('123e4567-e89b-12d3-a456-426614174003', 120000, 'CDF', true),
('123e4567-e89b-12d3-a456-426614174004', 95000, 'CDF', true),
('123e4567-e89b-12d3-a456-426614174005', 200000, 'CDF', true),
('123e4567-e89b-12d3-a456-426614174006', 30000, 'CDF', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert some user places for demonstration
INSERT INTO public.user_places (user_id, name, address, coordinates, place_type) VALUES
('123e4567-e89b-12d3-a456-426614174001', 'Domicile', 'Avenue Kasavubu, Gombe', '{"lat": -4.4419, "lng": 15.2663}', 'home'),
('123e4567-e89b-12d3-a456-426614174001', 'Bureau', 'Boulevard du 30 Juin, Gombe', '{"lat": -4.4400, "lng": 15.2700}', 'work'),
('123e4567-e89b-12d3-a456-426614174002', 'Maison', 'Avenue Tombalbaye, Kalamu', '{"lat": -4.4500, "lng": 15.2800}', 'home'),
('123e4567-e89b-12d3-a456-426614174002', 'Université', 'Campus Unikin, Lemba', '{"lat": -4.4300, "lng": 15.2900}', 'work')
ON CONFLICT (user_id, name) DO NOTHING;