-- Insert realistic transport bookings for user activities
INSERT INTO transport_bookings (
  user_id, 
  pickup_location, 
  destination, 
  vehicle_type, 
  status, 
  estimated_price, 
  actual_price, 
  booking_time, 
  pickup_time, 
  completion_time,
  pickup_coordinates,
  destination_coordinates
) VALUES 
-- Recent completed trips
(auth.uid(), 'Cocody Riviera Golf', 'Plateau Centre', 'standard', 'completed', 2500, 2500, 
 now() - interval '2 hours', now() - interval '1 hour 45 minutes', now() - interval '1 hour 15 minutes',
 '{"lat": 5.3600, "lng": -3.9750}', '{"lat": 5.3267, "lng": -4.0267}'),

(auth.uid(), 'Marcory Zone 4', 'Treichville Gare', 'economy', 'completed', 1800, 1800,
 now() - interval '1 day 3 hours', now() - interval '1 day 2 hours 45 minutes', now() - interval '1 day 2 hours 20 minutes',
 '{"lat": 5.2833, "lng": -3.9667}', '{"lat": 5.2833, "lng": -4.0000}'),

(auth.uid(), 'Yopougon Niangon', 'Adjamé Marché', 'standard', 'completed', 3200, 3200,
 now() - interval '2 days 5 hours', now() - interval '2 days 4 hours 40 minutes', now() - interval '2 days 4 hours 10 minutes',
 '{"lat": 5.3500, "lng": -4.0833}', '{"lat": 5.3833, "lng": -4.0333}'),

(auth.uid(), 'Plateau Tours Administratives', 'Cocody 2 Plateaux', 'comfort', 'completed', 2800, 2800,
 now() - interval '3 days 2 hours', now() - interval '3 days 1 hour 45 minutes', now() - interval '3 days 1 hour 20 minutes',
 '{"lat": 5.3267, "lng": -4.0267}', '{"lat": 5.3667, "lng": -3.9833}'),

(auth.uid(), 'Abobo Avocatier', 'Port Bouet Aéroport', 'standard', 'completed', 4500, 4500,
 now() - interval '4 days 6 hours', now() - interval '4 days 5 hours 30 minutes', now() - interval '4 days 4 hours 45 minutes',
 '{"lat": 5.4167, "lng": -4.0167}', '{"lat": 5.2333, "lng": -3.9333}'),

-- One pending trip
(auth.uid(), 'Riviera Palmeraie', 'Marcory Anoumabo', 'economy', 'pending', 2200, NULL,
 now() - interval '30 minutes', NULL, NULL,
 '{"lat": 5.3750, "lng": -3.9583}', '{"lat": 5.2667, "lng": -3.9500}');

-- Insert realistic delivery orders
INSERT INTO delivery_orders (
  user_id,
  pickup_location,
  delivery_location,
  delivery_type,
  package_type,
  vehicle_size,
  status,
  estimated_price,
  actual_price,
  order_time,
  pickup_time,
  delivery_time,
  pickup_coordinates,
  delivery_coordinates,
  loading_assistance
) VALUES
-- Recent completed deliveries
(auth.uid(), 'Cocody Angré', 'Plateau Immeuble SCIAM', 'flash', 'documents', 'moto', 'completed', 1500, 1500,
 now() - interval '5 hours', now() - interval '4 hours 45 minutes', now() - interval '4 hours 20 minutes',
 '{"lat": 5.3833, "lng": -3.9500}', '{"lat": 5.3267, "lng": -4.0267}', false),

(auth.uid(), 'Treichville Marché', 'Marcory Biétry', 'standard', 'food', 'small_car', 'completed', 2000, 2000,
 now() - interval '1 day 7 hours', now() - interval '1 day 6 hours 30 minutes', now() - interval '1 day 6 hours',
 '{"lat": 5.2833, "lng": -4.0000}', '{"lat": 5.2833, "lng": -3.9667}', false),

(auth.uid(), 'Adjamé Liberté', 'Yopougon Wassakara', 'cargo', 'furniture', 'large_van', 'completed', 8500, 8500,
 now() - interval '3 days 4 hours', now() - interval '3 days 3 hours 30 minutes', now() - interval '3 days 2 hours 45 minutes',
 '{"lat": 5.3833, "lng": -4.0333}', '{"lat": 5.3333, "lng": -4.1000}', true),

(auth.uid(), 'Port Bouet Vridi', 'Cocody Riviera 3', 'express', 'electronics', 'small_car', 'completed', 3500, 3500,
 now() - interval '5 days 3 hours', now() - interval '5 days 2 hours 40 minutes', now() - interval '5 days 2 hours 15 minutes',
 '{"lat": 5.2333, "lng": -3.9333}', '{"lat": 5.3600, "lng": -3.9750}', false),

-- One in progress delivery
(auth.uid(), 'Plateau Rue des Jardins', 'Abobo Pk18', 'standard', 'clothing', 'small_car', 'in_transit', 2800, NULL,
 now() - interval '45 minutes', now() - interval '30 minutes', NULL,
 '{"lat": 5.3267, "lng": -4.0267}', '{"lat": 5.4167, "lng": -4.0167}', false);

-- Create some sample driver profiles (these would normally be separate users)
-- We'll reference these in activity logs
INSERT INTO profiles (user_id, display_name, phone_number, avatar_url, user_type) 
SELECT 
  gen_random_uuid(),
  driver_name,
  driver_phone,
  NULL,
  'driver'
FROM (VALUES 
  ('Kouassi Amenan', '+225 07 12 34 56 78'),
  ('Diallo Mamadou', '+225 05 43 21 87 65'),
  ('Koné Adjoa', '+225 01 98 76 54 32'),
  ('Traoré Ibrahim', '+225 07 55 44 33 22'),
  ('Yao Akissi', '+225 05 11 22 33 44')
) AS drivers(driver_name, driver_phone);

-- Insert activity logs for these trips
INSERT INTO activity_logs (
  user_id,
  activity_type,
  description,
  amount,
  currency,
  reference_type,
  reference_id,
  metadata
) VALUES
-- Transport activities
(auth.uid(), 'transport_completed', 'Course terminée: Cocody Riviera Golf → Plateau Centre', 2500, 'CFA', 'transport_booking', 
 (SELECT id FROM transport_bookings WHERE pickup_location = 'Cocody Riviera Golf' LIMIT 1),
 '{"driver_name": "Kouassi Amenan", "driver_rating": 4.8, "vehicle_type": "standard", "duration_minutes": 30}'
),

(auth.uid(), 'transport_completed', 'Course terminée: Marcory Zone 4 → Treichville Gare', 1800, 'CFA', 'transport_booking',
 (SELECT id FROM transport_bookings WHERE pickup_location = 'Marcory Zone 4' LIMIT 1),
 '{"driver_name": "Diallo Mamadou", "driver_rating": 4.9, "vehicle_type": "economy", "duration_minutes": 25}'
),

(auth.uid(), 'transport_completed', 'Course terminée: Yopougon Niangon → Adjamé Marché', 3200, 'CFA', 'transport_booking',
 (SELECT id FROM transport_bookings WHERE pickup_location = 'Yopougon Niangon' LIMIT 1),
 '{"driver_name": "Koné Adjoa", "driver_rating": 4.7, "vehicle_type": "standard", "duration_minutes": 40}'
),

-- Delivery activities  
(auth.uid(), 'delivery_completed', 'Livraison terminée: Cocody Angré → Plateau Immeuble SCIAM', 1500, 'CFA', 'delivery_order',
 (SELECT id FROM delivery_orders WHERE pickup_location = 'Cocody Angré' LIMIT 1),
 '{"driver_name": "Traoré Ibrahim", "driver_rating": 4.6, "delivery_type": "flash", "package_type": "documents"}'
),

(auth.uid(), 'delivery_completed', 'Livraison terminée: Treichville Marché → Marcory Biétry', 2000, 'CFA', 'delivery_order',
 (SELECT id FROM delivery_orders WHERE pickup_location = 'Treichville Marché' LIMIT 1),
 '{"driver_name": "Yao Akissi", "driver_rating": 4.9, "delivery_type": "standard", "package_type": "food"}'
),

-- Payment activities
(auth.uid(), 'payment', 'Paiement course mobile money', -2500, 'CFA', 'transport_booking',
 (SELECT id FROM transport_bookings WHERE pickup_location = 'Cocody Riviera Golf' LIMIT 1),
 '{"payment_method": "mobile_money", "provider": "Orange Money"}'
),

(auth.uid(), 'wallet_topup', 'Rechargement portefeuille', 10000, 'CFA', NULL, NULL,
 '{"payment_method": "mobile_money", "provider": "MTN Mobile Money"}'
);