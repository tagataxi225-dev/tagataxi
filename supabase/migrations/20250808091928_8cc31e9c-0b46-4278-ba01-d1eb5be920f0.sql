
-- 1) Catégories de véhicules de location
CREATE TABLE IF NOT EXISTS public.rental_vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT 'Car',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les catégories actives
DROP POLICY IF EXISTS "Public can view active rental categories" ON public.rental_vehicle_categories;
CREATE POLICY "Public can view active rental categories"
  ON public.rental_vehicle_categories
  FOR SELECT
  USING (is_active = true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_rental_vehicle_categories_updated_at ON public.rental_vehicle_categories;
CREATE TRIGGER trg_rental_vehicle_categories_updated_at
BEFORE UPDATE ON public.rental_vehicle_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) Véhicules de location
CREATE TABLE IF NOT EXISTS public.rental_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.rental_vehicle_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  vehicle_type text NOT NULL,
  fuel_type text,
  transmission text,
  seats int NOT NULL DEFAULT 4,
  daily_rate numeric NOT NULL,
  hourly_rate numeric NOT NULL,
  weekly_rate numeric NOT NULL,
  security_deposit numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  license_plate text,
  location_address text,
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  rejection_reason text,
  moderator_id uuid,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_vehicles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- 2.a) Public: voir seulement les véhicules approuvés, actifs et disponibles
DROP POLICY IF EXISTS "Public can view approved active available rentals" ON public.rental_vehicles;
CREATE POLICY "Public can view approved active available rentals"
  ON public.rental_vehicles
  FOR SELECT
  USING (moderation_status = 'approved' AND is_active = true AND is_available = true);

-- 2.b) Partenaires: voir leurs propres véhicules (quelque soit le statut)
DROP POLICY IF EXISTS "Partners can view their rental vehicles" ON public.rental_vehicles;
CREATE POLICY "Partners can view their rental vehicles"
  ON public.rental_vehicles
  FOR SELECT
  USING (auth.uid() = partner_id);

-- 2.c) Partenaires: créer leurs véhicules
DROP POLICY IF EXISTS "Partners can create rental vehicles" ON public.rental_vehicles;
CREATE POLICY "Partners can create rental vehicles"
  ON public.rental_vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

-- 2.d) Partenaires: mettre à jour leurs véhicules
DROP POLICY IF EXISTS "Partners can update their rental vehicles" ON public.rental_vehicles;
CREATE POLICY "Partners can update their rental vehicles"
  ON public.rental_vehicles
  FOR UPDATE
  USING (auth.uid() = partner_id);

-- 2.e) Partenaires: supprimer leurs véhicules
DROP POLICY IF EXISTS "Partners can delete their rental vehicles" ON public.rental_vehicles;
CREATE POLICY "Partners can delete their rental vehicles"
  ON public.rental_vehicles
  FOR DELETE
  USING (auth.uid() = partner_id);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_partner_id ON public.rental_vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_category_id ON public.rental_vehicles(category_id);
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_mod_active_avail ON public.rental_vehicles(moderation_status, is_active, is_available);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_rental_vehicles_updated_at ON public.rental_vehicles;
CREATE TRIGGER trg_rental_vehicles_updated_at
BEFORE UPDATE ON public.rental_vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3) Réservations de location
CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.rental_vehicles(id) ON DELETE RESTRICT,
  rental_duration_type text NOT NULL CHECK (rental_duration_type IN ('hourly','half_day','daily','weekly')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  pickup_location text NOT NULL,
  return_location text NOT NULL,
  total_amount numeric NOT NULL,
  security_deposit numeric NOT NULL,
  special_requests text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','rejected','no_show')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

-- RLS: l'utilisateur voit ses réservations
DROP POLICY IF EXISTS "Users can view their rental bookings" ON public.rental_bookings;
CREATE POLICY "Users can view their rental bookings"
  ON public.rental_bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: le partenaire voit les réservations de ses véhicules
DROP POLICY IF EXISTS "Partners can view bookings for their vehicles" ON public.rental_bookings;
CREATE POLICY "Partners can view bookings for their vehicles"
  ON public.rental_bookings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.rental_vehicles rv
    WHERE rv.id = rental_bookings.vehicle_id
      AND rv.partner_id = auth.uid()
  ));

-- RLS: l’utilisateur peut créer ses réservations
DROP POLICY IF EXISTS "Users can create their rental bookings" ON public.rental_bookings;
CREATE POLICY "Users can create their rental bookings"
  ON public.rental_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: mise à jour par l’utilisateur (ex: annulation) OU le partenaire (changement de statut)
DROP POLICY IF EXISTS "Users can update their rental bookings" ON public.rental_bookings;
CREATE POLICY "Users can update their rental bookings"
  ON public.rental_bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can update bookings for their vehicles" ON public.rental_bookings;
CREATE POLICY "Partners can update bookings for their vehicles"
  ON public.rental_bookings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.rental_vehicles rv
    WHERE rv.id = rental_bookings.vehicle_id
      AND rv.partner_id = auth.uid()
  ));

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_rental_bookings_user_id ON public.rental_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_vehicle_id ON public.rental_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_status ON public.rental_bookings(status);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_rental_bookings_updated_at ON public.rental_bookings;
CREATE TRIGGER trg_rental_bookings_updated_at
BEFORE UPDATE ON public.rental_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4) Flotte Taxi Partenaire (gestion des véhicules taxi côté partenaire)
CREATE TABLE IF NOT EXISTS public.partner_taxi_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  name text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  vehicle_class text NOT NULL DEFAULT 'standard' CHECK (vehicle_class IN ('moto','standard','premium','bus')),
  color text,
  seats int NOT NULL DEFAULT 4,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  license_plate text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  rejection_reason text,
  moderator_id uuid,
  moderated_at timestamptz,
  assigned_driver_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_taxi_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS: Partenaires gèrent leurs véhicules
DROP POLICY IF EXISTS "Partners can view their taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Partners can view their taxi vehicles"
  ON public.partner_taxi_vehicles
  FOR SELECT
  USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Partners can create taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Partners can create taxi vehicles"
  ON public.partner_taxi_vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Partners can update their taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Partners can update their taxi vehicles"
  ON public.partner_taxi_vehicles
  FOR UPDATE
  USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Partners can delete their taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Partners can delete their taxi vehicles"
  ON public.partner_taxi_vehicles
  FOR DELETE
  USING (auth.uid() = partner_id);

-- RLS: Chauffeurs voient le véhicule qui leur est assigné
DROP POLICY IF EXISTS "Drivers can view assigned taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Drivers can view assigned taxi vehicles"
  ON public.partner_taxi_vehicles
  FOR SELECT
  USING (auth.uid() = assigned_driver_id);

-- (Optionnel) Public: voir les taxis approuvés & actifs (si besoin d’exposition publique)
DROP POLICY IF EXISTS "Public can view approved taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Public can view approved taxi vehicles"
  ON public.partner_taxi_vehicles
  FOR SELECT
  USING (moderation_status = 'approved' AND is_active = true);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_partner_taxi_partner_id ON public.partner_taxi_vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_taxi_mod_active_avail ON public.partner_taxi_vehicles(moderation_status, is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_partner_taxi_assigned_driver ON public.partner_taxi_vehicles(assigned_driver_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_partner_taxi_vehicles_updated_at ON public.partner_taxi_vehicles;
CREATE TRIGGER trg_partner_taxi_vehicles_updated_at
BEFORE UPDATE ON public.partner_taxi_vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 5) (Optionnel) Pré-remplir quelques catégories de location (idempotent)
INSERT INTO public.rental_vehicle_categories (name, description, icon, is_active)
VALUES 
  ('Moto', 'Deux-roues économiques pour la ville', 'Bike', true),
  ('Voiture', 'Voitures citadines et compactes', 'Car', true),
  ('Utilitaire', 'Véhicules utilitaires / pick-up', 'Truck', true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;
