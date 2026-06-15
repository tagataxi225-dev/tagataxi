-- Correction finale : utiliser les bonnes valeurs pour les contraintes
-- Créer une commande de livraison test avec les bonnes valeurs
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
  'flash',
  8000,
  'pending'
);