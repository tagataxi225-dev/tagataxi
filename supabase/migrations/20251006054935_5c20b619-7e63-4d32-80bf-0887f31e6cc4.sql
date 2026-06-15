
-- Migration pour tables Location et Marketplace Admin
-- Création des tables manquantes pour gestion complète

-- ========================================
-- 1. TABLES LOCATION (Partner Rental)
-- ========================================

CREATE TABLE IF NOT EXISTS public.partner_rental_vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_rental_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.partner_rental_vehicle_categories(id),
  vehicle_name TEXT NOT NULL,
  license_plate TEXT,
  location TEXT,
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.partner_rental_vehicles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partenaires(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- 2. RLS POLICIES - LOCATION
-- ========================================

ALTER TABLE public.partner_rental_vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_rental_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_rental_bookings ENABLE ROW LEVEL SECURITY;

-- Catégories: lecture publique, modification admin
CREATE POLICY "Categories visible par tous authentifiés"
  ON public.partner_rental_vehicle_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Categories gérées par admin"
  ON public.partner_rental_vehicle_categories FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Véhicules: partenaires et admins
CREATE POLICY "Véhicules visibles par partenaire et admin"
  ON public.partner_rental_vehicles FOR SELECT
  USING (
    (auth.uid() IN (SELECT user_id FROM partenaires WHERE id = partner_id)) OR
    is_current_user_admin()
  );

CREATE POLICY "Véhicules modifiables par partenaire"
  ON public.partner_rental_vehicles FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM partenaires WHERE id = partner_id));

CREATE POLICY "Véhicules gérés par admin"
  ON public.partner_rental_vehicles FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Bookings: utilisateurs et partenaires
CREATE POLICY "Bookings visibles par client et partenaire"
  ON public.partner_rental_bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    (auth.uid() IN (SELECT user_id FROM partenaires WHERE id = partner_id)) OR
    is_current_user_admin()
  );

CREATE POLICY "Bookings créés par client"
  ON public.partner_rental_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Bookings gérés par admin"
  ON public.partner_rental_bookings FOR ALL
  USING (is_current_user_admin());

-- ========================================
-- 3. COMMENTAIRES DE DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.partner_rental_vehicle_categories IS 
'Catégories de véhicules de location (SUV, Berline, etc.)';

COMMENT ON TABLE public.partner_rental_vehicles IS 
'Véhicules soumis par les partenaires pour location avec modération admin';

COMMENT ON TABLE public.partner_rental_bookings IS 
'Réservations de véhicules de location par les clients';

-- ========================================
-- 4. LOGS DE MIGRATION
-- ========================================

INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'database_migration',
  'Création tables Location et Marketplace Admin - Étape 2 et 3',
  jsonb_build_object(
    'timestamp', now(),
    'tables_created', ARRAY[
      'partner_rental_vehicle_categories',
      'partner_rental_vehicles',
      'partner_rental_bookings'
    ],
    'migration_version', '20250106_location_marketplace_admin'
  )
);
