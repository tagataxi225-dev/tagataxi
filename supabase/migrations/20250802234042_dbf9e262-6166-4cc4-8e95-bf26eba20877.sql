-- Add test data for transport bookings to demonstrate earnings functionality
INSERT INTO transport_bookings (
  id,
  user_id,
  driver_id,
  pickup_location,
  destination,
  pickup_coordinates,
  destination_coordinates,
  vehicle_type,
  estimated_price,
  actual_price,
  status,
  booking_time,
  pickup_time,
  completion_time
) VALUES 
-- This week's completed rides
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Gombe', 'Lemba', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 8000, 8500, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', NOW() - INTERVAL '2 days' + INTERVAL '25 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Kinshasa Centre', 'Masina', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 12000, 12000, 'completed', NOW() - INTERVAL '2 days' + INTERVAL '2 hours', NOW() - INTERVAL '2 days' + INTERVAL '2 hours 5 minutes', NOW() - INTERVAL '2 days' + INTERVAL '2 hours 35 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Kalamu', 'Ngaliema', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 15000, 15500, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes', NOW() - INTERVAL '1 day' + INTERVAL '40 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Matete', 'Kimbanseke', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 10000, 10500, 'completed', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', NOW() - INTERVAL '1 day' + INTERVAL '3 hours 12 minutes', NOW() - INTERVAL '1 day' + INTERVAL '3 hours 45 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'N\'djili', 'Lemba', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 18000, 18000, 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '12 hours' + INTERVAL '50 minutes'),

-- Yesterday's rides
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Gombe', 'Bandalungwa', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 14000, 14500, 'completed', NOW() - INTERVAL '1 day' + INTERVAL '5 hours', NOW() - INTERVAL '1 day' + INTERVAL '5 hours 8 minutes', NOW() - INTERVAL '1 day' + INTERVAL '5 hours 38 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Limete', 'Kingasani', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 16000, 16500, 'completed', NOW() - INTERVAL '1 day' + INTERVAL '7 hours', NOW() - INTERVAL '1 day' + INTERVAL '7 hours 5 minutes', NOW() - INTERVAL '1 day' + INTERVAL '7 hours 42 minutes'),

-- Previous week's rides for comparison
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Gombe', 'Lemba', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 8000, 8000, 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '10 minutes', NOW() - INTERVAL '8 days' + INTERVAL '30 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Kalamu', 'Masina', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 12000, 12500, 'completed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days' + INTERVAL '8 minutes', NOW() - INTERVAL '9 days' + INTERVAL '35 minutes'),
(gen_random_uuid(), gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), 'Matete', 'Ngaliema', '{"lat": -4.4419, "lng": 15.2663}', '{"lat": -4.4419, "lng": 15.2663}', 'taxi', 15000, 15000, 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '12 minutes', NOW() - INTERVAL '10 days' + INTERVAL '45 minutes');

-- Add some ratings for the driver
INSERT INTO user_ratings (
  rater_user_id,
  rated_user_id,
  booking_id,
  rating,
  comment
) VALUES 
(gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), (SELECT id FROM transport_bookings WHERE status = 'completed' LIMIT 1), 5, 'Excellent chauffeur'),
(gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), (SELECT id FROM transport_bookings WHERE status = 'completed' OFFSET 1 LIMIT 1), 4, 'Très bien'),
(gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), (SELECT id FROM transport_bookings WHERE status = 'completed' OFFSET 2 LIMIT 1), 5, 'Service parfait'),
(gen_random_uuid(), (SELECT user_id FROM profiles WHERE user_type = 'chauffeur' LIMIT 1), (SELECT id FROM transport_bookings WHERE status = 'completed' OFFSET 3 LIMIT 1), 4, 'Ponctuel et professionnel');