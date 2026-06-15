-- Insert realistic driver profiles for Kinshasa
INSERT INTO public.profiles (user_id, display_name, phone_number, avatar_url, user_type) VALUES
(gen_random_uuid(), 'Jean-Baptiste Mukendi', '+243818123456', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'chauffeur'),
(gen_random_uuid(), 'Marie Kasongo', '+243898654321', 'https://images.unsplash.com/photo-1494790108755-2616b612b1-2d?w=150&h=150&fit=crop&crop=face', 'chauffeur'),
(gen_random_uuid(), 'Patrick Tshisekedi', '+243827891234', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'chauffeur'),
(gen_random_uuid(), 'Grace Ndamba', '+243856789012', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'chauffeur'),
(gen_random_uuid(), 'Joseph Mbala', '+243823456789', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'chauffeur');

-- Get some driver IDs and a sample user ID for bookings
DO $$
DECLARE
    driver1_id uuid;
    driver2_id uuid;
    driver3_id uuid;
    driver4_id uuid;
    driver5_id uuid;
    sample_user_id uuid;
BEGIN
    -- Get driver IDs
    SELECT user_id INTO driver1_id FROM public.profiles WHERE display_name = 'Jean-Baptiste Mukendi';
    SELECT user_id INTO driver2_id FROM public.profiles WHERE display_name = 'Marie Kasongo';
    SELECT user_id INTO driver3_id FROM public.profiles WHERE display_name = 'Patrick Tshisekedi';
    SELECT user_id INTO driver4_id FROM public.profiles WHERE display_name = 'Grace Ndamba';
    SELECT user_id INTO driver5_id FROM public.profiles WHERE display_name = 'Joseph Mbala';
    
    -- Get or create a sample user (client)
    INSERT INTO public.profiles (user_id, display_name, phone_number, user_type) 
    VALUES (gen_random_uuid(), 'Client Test', '+243801234567', 'client')
    ON CONFLICT DO NOTHING;
    
    SELECT user_id INTO sample_user_id FROM public.profiles WHERE display_name = 'Client Test' LIMIT 1;

    -- Insert realistic transport bookings for Kinshasa
    INSERT INTO public.transport_bookings (
        user_id, driver_id, pickup_location, destination, vehicle_type, 
        status, estimated_price, actual_price, booking_time, pickup_time, completion_time,
        pickup_coordinates, destination_coordinates
    ) VALUES
    -- Recent completed trips
    (sample_user_id, driver1_id, 'Gombe Centre', 'Kalamu Marché', 'taxi', 'completed', 3500, 3500, 
     now() - interval '2 hours', now() - interval '1 hour 45 minutes', now() - interval '1 hour 15 minutes',
     '{"lat": -4.3317, "lng": 15.3139}', '{"lat": -4.3708, "lng": 15.3146}'),
    
    (sample_user_id, driver2_id, 'Université de Kinshasa', 'Lemba Terminus', 'moto-taxi', 'completed', 2000, 2000,
     now() - interval '1 day', now() - interval '23 hours 50 minutes', now() - interval '23 hours 25 minutes',
     '{"lat": -4.4047, "lng": 15.2832}', '{"lat": -4.3892, "lng": 15.2661}'),
    
    (sample_user_id, driver3_id, 'Marché Central', 'Ngaliema Mont Fleury', 'taxi', 'completed', 4500, 4500,
     now() - interval '2 days', now() - interval '1 day 23 hours', now() - interval '1 day 22 hours 30 minutes',
     '{"lat": -4.3167, "lng": 15.3133}', '{"lat": -4.3833, "lng": 15.2667}'),
    
    (sample_user_id, driver4_id, 'Kintambo Magasin', 'Matete Rond-point', 'taxi-bus', 'completed', 1500, 1500,
     now() - interval '3 days', now() - interval '2 days 23 hours', now() - interval '2 days 22 hours 20 minutes',
     '{"lat": -4.3000, "lng": 15.2833}', '{"lat": -4.3833, "lng": 15.3500}'),
    
    (sample_user_id, driver5_id, 'Aéroport de N''djili', 'Gombe Royal', 'taxi', 'completed', 12000, 12000,
     now() - interval '1 week', now() - interval '6 days 23 hours', now() - interval '6 days 22 hours 15 minutes',
     '{"lat": -4.3858, "lng": 15.4447}', '{"lat": -4.3208, "lng": 15.3069}'),
    
    -- A pending trip
    (sample_user_id, driver1_id, 'Masina Petro-Congo', 'Kingabwa Port', 'moto-taxi', 'pending', 2500, NULL,
     now() - interval '30 minutes', NULL, NULL,
     '{"lat": -4.3833, "lng": 15.4167}', '{"lat": -4.3000, "lng": 15.3333}');

    -- Insert user ratings for completed trips
    INSERT INTO public.user_ratings (rater_user_id, rated_user_id, rating, comment, booking_id) 
    SELECT 
        tb.user_id,
        tb.driver_id,
        CASE 
            WHEN p.display_name = 'Jean-Baptiste Mukendi' THEN 5
            WHEN p.display_name = 'Marie Kasongo' THEN 4
            WHEN p.display_name = 'Patrick Tshisekedi' THEN 5
            WHEN p.display_name = 'Grace Ndamba' THEN 3
            WHEN p.display_name = 'Joseph Mbala' THEN 5
        END,
        CASE 
            WHEN p.display_name = 'Jean-Baptiste Mukendi' THEN 'Excellent chauffeur, très ponctuel!'
            WHEN p.display_name = 'Marie Kasongo' THEN 'Bonne conduite, trajet rapide'
            WHEN p.display_name = 'Patrick Tshisekedi' THEN 'Parfait, je recommande vivement'
            WHEN p.display_name = 'Grace Ndamba' THEN 'Service correct'
            WHEN p.display_name = 'Joseph Mbala' THEN 'Transport confortable et sécurisé'
        END,
        tb.id
    FROM public.transport_bookings tb
    JOIN public.profiles p ON tb.driver_id = p.user_id
    WHERE tb.status = 'completed' AND tb.user_id = sample_user_id;

END $$;