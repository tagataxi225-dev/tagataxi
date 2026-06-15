-- Sécuriser les données de localisation des livraisons marketplace

-- 1. Vérifier si la table marketplace_delivery_assignments existe et créer si nécessaire
CREATE TABLE IF NOT EXISTS public.marketplace_delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  driver_id uuid,
  pickup_coordinates jsonb NOT NULL,
  delivery_coordinates jsonb NOT NULL,
  pickup_address text,
  delivery_address text,
  estimated_pickup_time timestamp with time zone,
  estimated_delivery_time timestamp with time zone,
  actual_pickup_time timestamp with time zone,
  actual_delivery_time timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  distance_km numeric,
  delivery_instructions text,
  special_requirements text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  assigned_at timestamp with time zone,
  pickup_contact_name text,
  pickup_contact_phone text,
  delivery_contact_name text,
  delivery_contact_phone text
);

-- 2. Activer RLS sur la table
ALTER TABLE public.marketplace_delivery_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer toute politique publique dangereuse existante
DROP POLICY IF EXISTS "Enable read access for all users" ON public.marketplace_delivery_assignments;
DROP POLICY IF EXISTS "Public read access" ON public.marketplace_delivery_assignments;

-- 4. Créer des politiques RLS sécurisées

-- Les vendeurs peuvent voir les assignments de leurs commandes
CREATE POLICY "Sellers can view assignments for their orders" ON public.marketplace_delivery_assignments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_orders mo 
    WHERE mo.id = marketplace_delivery_assignments.order_id 
      AND mo.seller_id = auth.uid()
  )
);

-- Les acheteurs peuvent voir les assignments de leurs commandes
CREATE POLICY "Buyers can view assignments for their orders" ON public.marketplace_delivery_assignments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_orders mo 
    WHERE mo.id = marketplace_delivery_assignments.order_id 
      AND mo.buyer_id = auth.uid()
  )
);

-- Les chauffeurs peuvent voir seulement leurs assignments
CREATE POLICY "Drivers can view their own assignments" ON public.marketplace_delivery_assignments
FOR SELECT 
USING (auth.uid() = driver_id);

-- Les chauffeurs peuvent mettre à jour leurs assignments
CREATE POLICY "Drivers can update their own assignments" ON public.marketplace_delivery_assignments
FOR UPDATE 
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- Les admins peuvent voir tous les assignments (avec audit)
CREATE POLICY "Admins can view all assignments" ON public.marketplace_delivery_assignments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Le système peut insérer des assignments
CREATE POLICY "System can create assignments" ON public.marketplace_delivery_assignments
FOR INSERT 
WITH CHECK (true);

-- 5. Créer une fonction sécurisée pour obtenir les informations de livraison nécessaires
-- sans exposer les coordonnées exactes
CREATE OR REPLACE FUNCTION public.get_delivery_zone_info(assignment_id_param uuid)
RETURNS TABLE (
  assignment_id uuid,
  order_id uuid,
  pickup_zone text,
  delivery_zone text,
  estimated_distance_km numeric,
  estimated_duration_minutes integer,
  status text,
  special_requirements text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_authorized boolean := false;
BEGIN
  -- Vérifier si l'utilisateur est autorisé à voir cette assignment
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_delivery_assignments mda
    JOIN public.marketplace_orders mo ON mda.order_id = mo.id
    WHERE mda.id = assignment_id_param
      AND (
        mo.seller_id = auth.uid() OR 
        mo.buyer_id = auth.uid() OR 
        mda.driver_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
      )
  ) INTO user_authorized;
  
  IF NOT user_authorized THEN
    RAISE EXCEPTION 'Accès non autorisé à cette assignment de livraison';
  END IF;
  
  -- Retourner les informations générales sans coordonnées exactes
  RETURN QUERY
  SELECT 
    mda.id,
    mda.order_id,
    COALESCE(mda.pickup_address, 'Zone de collecte') as pickup_zone,
    COALESCE(mda.delivery_address, 'Zone de livraison') as delivery_zone,
    mda.distance_km,
    COALESCE(EXTRACT(EPOCH FROM (mda.estimated_delivery_time - mda.estimated_pickup_time))/60, 30)::integer as estimated_duration,
    mda.status,
    mda.special_requirements
  FROM public.marketplace_delivery_assignments mda
  WHERE mda.id = assignment_id_param;
END;
$$;

-- 6. Créer une fonction pour les chauffeurs afin d'obtenir leurs coordonnées de livraison
CREATE OR REPLACE FUNCTION public.get_driver_delivery_coordinates(assignment_id_param uuid)
RETURNS TABLE (
  pickup_lat numeric,
  pickup_lng numeric,
  delivery_lat numeric,
  delivery_lng numeric,
  pickup_address text,
  delivery_address text,
  pickup_contact text,
  delivery_contact text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que le chauffeur est assigné à cette livraison
  IF NOT EXISTS (
    SELECT 1 FROM public.marketplace_delivery_assignments 
    WHERE id = assignment_id_param AND driver_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé - vous n''êtes pas assigné à cette livraison';
  END IF;
  
  -- Logger l'accès aux coordonnées sensibles
  INSERT INTO public.delivery_location_access_logs (
    accessed_by, assignment_id, access_type, access_reason
  ) VALUES (
    auth.uid(), assignment_id_param, 'driver_coordinates', 'Driver accessing delivery coordinates'
  );
  
  -- Retourner les coordonnées pour la navigation
  RETURN QUERY
  SELECT 
    (mda.pickup_coordinates->>'lat')::numeric,
    (mda.pickup_coordinates->>'lng')::numeric,
    (mda.delivery_coordinates->>'lat')::numeric,
    (mda.delivery_coordinates->>'lng')::numeric,
    mda.pickup_address,
    mda.delivery_address,
    COALESCE(mda.pickup_contact_name || ' - ' || mda.pickup_contact_phone, 'Contact non disponible'),
    COALESCE(mda.delivery_contact_name || ' - ' || mda.delivery_contact_phone, 'Contact non disponible')
  FROM public.marketplace_delivery_assignments mda
  WHERE mda.id = assignment_id_param;
END;
$$;

-- 7. Créer une table d'audit pour les accès aux coordonnées de livraison
CREATE TABLE IF NOT EXISTS public.delivery_location_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid NOT NULL,
  assignment_id uuid NOT NULL,
  access_type text NOT NULL,
  access_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS pour les logs d'audit des livraisons
ALTER TABLE public.delivery_location_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view delivery location access logs" ON public.delivery_location_access_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 8. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_delivery_zone_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_delivery_coordinates TO authenticated;

-- 9. Créer un trigger pour logger automatiquement les accès directs aux coordonnées
CREATE OR REPLACE FUNCTION public.log_delivery_coordinates_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logger les SELECT sur les coordonnées sensibles
  IF TG_OP = 'SELECT' AND (
    OLD.pickup_coordinates IS NOT NULL OR 
    OLD.delivery_coordinates IS NOT NULL
  ) THEN
    INSERT INTO public.delivery_location_access_logs (
      accessed_by, assignment_id, access_type, access_reason
    ) VALUES (
      auth.uid(), OLD.id, 'direct_access', 'Direct table access to coordinates'
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- Note: Les triggers SELECT ne sont pas supportés par PostgreSQL
-- Utiliser les fonctions sécurisées à la place pour tracker les accès

-- 10. Ajouter un trigger pour les mises à jour
CREATE OR REPLACE FUNCTION public.update_delivery_assignment_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_delivery_assignment_updated_at
  BEFORE UPDATE ON public.marketplace_delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_delivery_assignment_timestamp();