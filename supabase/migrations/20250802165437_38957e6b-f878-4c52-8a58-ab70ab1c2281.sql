-- First, let's create a function to get or create a test user for realistic data
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Get an existing user or use a placeholder UUID for testing
    SELECT user_id INTO test_user_id FROM profiles WHERE user_type = 'client' LIMIT 1;
    
    -- If no user exists, create sample data with a fixed UUID for now
    -- This will be replaced with real user data when authentication is implemented
    IF test_user_id IS NULL THEN
        test_user_id := '12345678-1234-1234-1234-123456789012';
    END IF;

    -- Insert realistic transport bookings
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
    -- Recent completed trips with Abidjan locations
    (test_user_id, 'Cocody Riviera Golf', 'Plateau Centre', 'standard', 'completed', 2500, 2500, 
     now() - interval '2 hours', now() - interval '1 hour 45 minutes', now() - interval '1 hour 15 minutes',
     '{"lat": 5.3600, "lng": -3.9750}', '{"lat": 5.3267, "lng": -4.0267}'),

    (test_user_id, 'Marcory Zone 4', 'Treichville Gare', 'economy', 'completed', 1800, 1800,
     now() - interval '1 day 3 hours', now() - interval '1 day 2 hours 45 minutes', now() - interval '1 day 2 hours 20 minutes',
     '{"lat": 5.2833, "lng": -3.9667}', '{"lat": 5.2833, "lng": -4.0000}'),

    (test_user_id, 'Yopougon Niangon', 'Adjamé Marché', 'standard', 'completed', 3200, 3200,
     now() - interval '2 days 5 hours', now() - interval '2 days 4 hours 40 minutes', now() - interval '2 days 4 hours 10 minutes',
     '{"lat": 5.3500, "lng": -4.0833}', '{"lat": 5.3833, "lng": -4.0333}'),

    (test_user_id, 'Plateau Tours Administratives', 'Cocody 2 Plateaux', 'comfort', 'completed', 2800, 2800,
     now() - interval '3 days 2 hours', now() - interval '3 days 1 hour 45 minutes', now() - interval '3 days 1 hour 20 minutes',
     '{"lat": 5.3267, "lng": -4.0267}', '{"lat": 5.3667, "lng": -3.9833}'),

    (test_user_id, 'Abobo Avocatier', 'Port Bouët Aéroport', 'standard', 'completed', 4500, 4500,
     now() - interval '4 days 6 hours', now() - interval '4 days 5 hours 30 minutes', now() - interval '4 days 4 hours 45 minutes',
     '{"lat": 5.4167, "lng": -4.0167}', '{"lat": 5.2333, "lng": -3.9333}'),

    -- One pending trip
    (test_user_id, 'Riviera Palmeraie', 'Marcory Anoumabo', 'economy', 'pending', 2200, NULL,
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
    (test_user_id, 'Cocody Angré', 'Plateau Immeuble SCIAM', 'flash', 'documents', 'moto', 'completed', 1500, 1500,
     now() - interval '5 hours', now() - interval '4 hours 45 minutes', now() - interval '4 hours 20 minutes',
     '{"lat": 5.3833, "lng": -3.9500}', '{"lat": 5.3267, "lng": -4.0267}', false),

    (test_user_id, 'Treichville Marché', 'Marcory Biétry', 'standard', 'food', 'small_car', 'completed', 2000, 2000,
     now() - interval '1 day 7 hours', now() - interval '1 day 6 hours 30 minutes', now() - interval '1 day 6 hours',
     '{"lat": 5.2833, "lng": -4.0000}', '{"lat": 5.2833, "lng": -3.9667}', false),

    (test_user_id, 'Adjamé Liberté', 'Yopougon Wassakara', 'cargo', 'furniture', 'large_van', 'completed', 8500, 8500,
     now() - interval '3 days 4 hours', now() - interval '3 days 3 hours 30 minutes', now() - interval '3 days 2 hours 45 minutes',
     '{"lat": 5.3833, "lng": -4.0333}', '{"lat": 5.3333, "lng": -4.1000}', true),

    (test_user_id, 'Port Bouët Vridi', 'Cocody Riviera 3', 'express', 'electronics', 'small_car', 'completed', 3500, 3500,
     now() - interval '5 days 3 hours', now() - interval '5 days 2 hours 40 minutes', now() - interval '5 days 2 hours 15 minutes',
     '{"lat": 5.2333, "lng": -3.9333}', '{"lat": 5.3600, "lng": -3.9750}', false),

    -- One in progress delivery
    (test_user_id, 'Plateau Rue des Jardins', 'Abobo Pk18', 'standard', 'clothing', 'small_car', 'in_transit', 2800, NULL,
     now() - interval '45 minutes', now() - interval '30 minutes', NULL,
     '{"lat": 5.3267, "lng": -4.0267}', '{"lat": 5.4167, "lng": -4.0167}', false);

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
    -- Transport activities with driver info
    (test_user_id, 'transport_completed', 'Course terminée: Cocody Riviera Golf → Plateau Centre', 2500, 'CFA', 'transport_booking', 
     (SELECT id FROM transport_bookings WHERE pickup_location = 'Cocody Riviera Golf' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Kouassi Amenan", "driver_rating": 4.8, "vehicle_type": "standard", "duration_minutes": 30}'
    ),

    (test_user_id, 'transport_completed', 'Course terminée: Marcory Zone 4 → Treichville Gare', 1800, 'CFA', 'transport_booking',
     (SELECT id FROM transport_bookings WHERE pickup_location = 'Marcory Zone 4' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Diallo Mamadou", "driver_rating": 4.9, "vehicle_type": "economy", "duration_minutes": 25}'
    ),

    (test_user_id, 'transport_completed', 'Course terminée: Yopougon Niangon → Adjamé Marché', 3200, 'CFA', 'transport_booking',
     (SELECT id FROM transport_bookings WHERE pickup_location = 'Yopougon Niangon' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Koné Adjoa", "driver_rating": 4.7, "vehicle_type": "standard", "duration_minutes": 40}'
    ),

    (test_user_id, 'transport_completed', 'Course terminée: Plateau Tours Administratives → Cocody 2 Plateaux', 2800, 'CFA', 'transport_booking',
     (SELECT id FROM transport_bookings WHERE pickup_location = 'Plateau Tours Administratives' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Diabaté Seydou", "driver_rating": 4.5, "vehicle_type": "comfort", "duration_minutes": 35}'
    ),

    (test_user_id, 'transport_completed', 'Course terminée: Abobo Avocatier → Port Bouët Aéroport', 4500, 'CFA', 'transport_booking',
     (SELECT id FROM transport_bookings WHERE pickup_location = 'Abobo Avocatier' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Ouattara Fatou", "driver_rating": 4.9, "vehicle_type": "standard", "duration_minutes": 55}'
    ),

    -- Delivery activities  
    (test_user_id, 'delivery_completed', 'Livraison terminée: Cocody Angré → Plateau Immeuble SCIAM', 1500, 'CFA', 'delivery_order',
     (SELECT id FROM delivery_orders WHERE pickup_location = 'Cocody Angré' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Traoré Ibrahim", "driver_rating": 4.6, "delivery_type": "flash", "package_type": "documents"}'
    ),

    (test_user_id, 'delivery_completed', 'Livraison terminée: Treichville Marché → Marcory Biétry', 2000, 'CFA', 'delivery_order',
     (SELECT id FROM delivery_orders WHERE pickup_location = 'Treichville Marché' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Yao Akissi", "driver_rating": 4.9, "delivery_type": "standard", "package_type": "food"}'
    ),

    (test_user_id, 'delivery_completed', 'Livraison terminée: Adjamé Liberté → Yopougon Wassakara', 8500, 'CFA', 'delivery_order',
     (SELECT id FROM delivery_orders WHERE pickup_location = 'Adjamé Liberté' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Bamba Salif", "driver_rating": 4.7, "delivery_type": "cargo", "package_type": "furniture"}'
    ),

    (test_user_id, 'delivery_completed', 'Livraison terminée: Port Bouët Vridi → Cocody Riviera 3', 3500, 'CFA', 'delivery_order',
     (SELECT id FROM delivery_orders WHERE pickup_location = 'Port Bouët Vridi' AND user_id = test_user_id LIMIT 1),
     '{"driver_name": "Coulibaly Awa", "driver_rating": 4.8, "delivery_type": "express", "package_type": "electronics"}'
    ),

    -- Payment and wallet activities
    (test_user_id, 'payment', 'Paiement course mobile money', -2500, 'CFA', 'transport_booking',
     (SELECT id FROM transport_bookings WHERE pickup_location = 'Cocody Riviera Golf' AND user_id = test_user_id LIMIT 1),
     '{"payment_method": "mobile_money", "provider": "Orange Money"}'
    ),

    (test_user_id, 'wallet_topup', 'Rechargement portefeuille', 10000, 'CFA', NULL, NULL,
     '{"payment_method": "mobile_money", "provider": "MTN Mobile Money"}'
    ),

    (test_user_id, 'payment', 'Paiement livraison portefeuille', -1500, 'CFA', 'delivery_order',
     (SELECT id FROM delivery_orders WHERE pickup_location = 'Cocody Angré' AND user_id = test_user_id LIMIT 1),
     '{"payment_method": "wallet", "provider": "Kwenda Pay"}'
    );

END $$;