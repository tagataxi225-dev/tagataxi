-- Phase 5: Données de test et validation end-to-end
-- Créer des données de test pour valider le workflow

-- Créer une demande de transport test
INSERT INTO public.ride_requests (
  user_id,
  pickup_location,
  pickup_coordinates,
  destination,
  destination_coordinates,
  estimated_price,
  vehicle_class,
  status
) VALUES (
  (SELECT user_id FROM public.profiles LIMIT 1),
  'Gombe - Place de la Poste',
  '{"lat": -4.3217, "lng": 15.3069}',
  'Kinshasa - Aéroport de Ndjili',
  '{"lat": -4.3858, "lng": 15.4446}',
  15000,
  'standard',
  'pending'
);

-- Créer une commande de livraison test
INSERT INTO public.delivery_orders (
  user_id,
  pickup_location,
  pickup_coordinates,
  delivery_location,
  delivery_coordinates,
  delivery_type,
  estimated_price,
  status
) VALUES (
  (SELECT user_id FROM public.profiles LIMIT 1),
  'Gombe - Centre Ville',
  '{"lat": -4.3217, "lng": 15.3069}',
  'Lemba - Université de Kinshasa',
  '{"lat": -4.4034, "lng": 15.3054}',
  'standard',
  8000,
  'pending'
);

-- Créer un produit marketplace test
INSERT INTO public.marketplace_products (
  seller_id,
  title,
  description,
  price,
  category,
  location,
  coordinates,
  status,
  moderation_status
) VALUES (
  (SELECT user_id FROM public.profiles LIMIT 1),
  'Smartphone Samsung Galaxy A54',
  'Téléphone en excellent état, 128GB de stockage',
  450000,
  'electronique',
  'Gombe - Centre Commercial',
  '{"lat": -4.3217, "lng": 15.3069}',
  'active',
  'approved'
);

-- Activer les notifications temps réel pour toutes les tables
ALTER TABLE public.ride_requests REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_orders REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_delivery_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;