-- Script SQL pour tester le système de location de véhicules
-- À exécuter dans le SQL Editor de Supabase

-- ==========================================
-- PHASE 4 : TESTS DATABASE
-- ==========================================

-- 1. Vérifier qu'il y a des véhicules disponibles
SELECT 
  id,
  name,
  brand,
  model,
  daily_rate,
  available_cities,
  is_available,
  is_active,
  moderation_status,
  created_at
FROM rental_vehicles
WHERE is_available = true 
  AND is_active = true 
  AND moderation_status = 'approved'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Vérifier la fonction de vérification de disponibilité
-- Remplacer <VEHICLE_ID> par un ID réel de véhicule
SELECT check_vehicle_availability(
  '<VEHICLE_ID>'::uuid,
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '4 days'
) as is_available;

-- 3. Lister les réservations récentes
SELECT 
  rb.id,
  rb.vehicle_id,
  rv.name as vehicle_name,
  rb.start_date,
  rb.end_date,
  rb.total_price,
  rb.security_deposit,
  rb.status,
  rb.driver_choice,
  rb.pickup_location,
  rb.created_at
FROM rental_bookings rb
JOIN rental_vehicles rv ON rv.id = rb.vehicle_id
ORDER BY rb.created_at DESC
LIMIT 10;

-- 4. Vérifier les dates réservées pour un véhicule spécifique
-- Remplacer <VEHICLE_ID> par un ID réel de véhicule
SELECT 
  id,
  start_date,
  end_date,
  status,
  driver_name,
  total_price
FROM rental_bookings
WHERE vehicle_id = '<VEHICLE_ID>'
  AND status IN ('pending', 'confirmed', 'in_progress')
ORDER BY start_date;

-- 5. Créer une réservation de test (optionnel)
-- ATTENTION : Remplacer les valeurs entre <> avant d'exécuter
/*
INSERT INTO rental_bookings (
  user_id,
  vehicle_id,
  start_date,
  end_date,
  total_price,
  security_deposit,
  pickup_location,
  return_location,
  driver_choice,
  rental_duration_type,
  status,
  payment_status,
  driver_name,
  driver_phone,
  driver_email,
  driver_license
) VALUES (
  '<USER_ID>'::uuid,
  '<VEHICLE_ID>'::uuid,
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '5 days',
  50000,
  30000,
  'Avenue de la Libération, Gombe, Kinshasa',
  'Avenue de la Libération, Gombe, Kinshasa',
  'without_driver',
  'daily',
  'pending',
  'pending',
  'Test User',
  '+243 800 000 000',
  'test@kwenda.com',
  'TEST123456'
) RETURNING id, created_at;
*/

-- 6. Vérifier les catégories de véhicules
SELECT 
  id,
  name,
  description,
  created_at,
  (SELECT COUNT(*) FROM rental_vehicles WHERE category_id = rental_vehicle_categories.id) as vehicle_count
FROM rental_vehicle_categories
ORDER BY name;

-- 7. Vérifier les équipements disponibles
SELECT 
  id,
  name,
  daily_price,
  item_type,
  description
FROM rental_equipment
WHERE is_available = true
ORDER BY item_type, name;

-- 8. Statistiques globales
SELECT 
  (SELECT COUNT(*) FROM rental_vehicles WHERE is_available = true AND is_active = true) as available_vehicles,
  (SELECT COUNT(*) FROM rental_bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM rental_bookings WHERE status = 'confirmed') as confirmed_bookings,
  (SELECT COUNT(*) FROM rental_bookings WHERE status = 'in_progress') as active_bookings,
  (SELECT COUNT(*) FROM rental_bookings WHERE status = 'completed') as completed_bookings,
  (SELECT COUNT(*) FROM rental_bookings WHERE status = 'cancelled') as cancelled_bookings;

-- 9. Vérifier les RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('rental_bookings', 'rental_vehicles')
ORDER BY tablename, policyname;

-- 10. Tester le calcul de prix (fonction hypothétique)
-- Si la fonction existe dans votre DB
/*
SELECT calculate_rental_price(
  '<VEHICLE_ID>'::uuid,
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '4 days',
  'Kinshasa',
  ARRAY[]::uuid[]
);
*/
