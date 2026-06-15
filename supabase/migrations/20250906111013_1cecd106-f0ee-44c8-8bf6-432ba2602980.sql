-- Créer la table des associations chauffeur-véhicule
CREATE TABLE public.driver_vehicle_associations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL,
    vehicle_id UUID,
    partner_id UUID,
    association_type TEXT NOT NULL CHECK (association_type IN ('own_vehicle', 'partner_vehicle')),
    vehicle_details JSONB, -- Stocke les détails du véhicule si c'est son propre véhicule
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false, -- Véhicule principal du chauffeur
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    approved_by UUID,
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    notes TEXT
);

-- Créer la table des préférences de service du chauffeur
CREATE TABLE public.driver_service_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL,
    service_types TEXT[] NOT NULL DEFAULT ARRAY['taxi'], -- taxi, delivery, transport
    preferred_zones TEXT[] DEFAULT ARRAY['Kinshasa'],
    vehicle_classes TEXT[] DEFAULT ARRAY['standard'], -- standard, premium, economic
    max_distance_km NUMERIC DEFAULT 50,
    work_schedule JSONB DEFAULT '{"flexible": true}', -- Horaires de travail préférés
    minimum_fare NUMERIC,
    special_services TEXT[] DEFAULT ARRAY[]::text[], -- wheelchair_accessible, pet_friendly, etc.
    languages TEXT[] DEFAULT ARRAY['fr'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter les contraintes et index
ALTER TABLE public.driver_vehicle_associations 
ADD CONSTRAINT driver_vehicle_associations_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.chauffeurs(user_id) ON DELETE CASCADE;

ALTER TABLE public.driver_vehicle_associations 
ADD CONSTRAINT driver_vehicle_associations_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES public.partenaires(user_id) ON DELETE SET NULL;

ALTER TABLE public.driver_service_preferences 
ADD CONSTRAINT driver_service_preferences_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.chauffeurs(user_id) ON DELETE CASCADE;

-- Index pour optimiser les requêtes
CREATE INDEX idx_driver_vehicle_associations_driver_id ON public.driver_vehicle_associations(driver_id);
CREATE INDEX idx_driver_vehicle_associations_active ON public.driver_vehicle_associations(is_active, driver_id);
CREATE INDEX idx_driver_service_preferences_driver_id ON public.driver_service_preferences(driver_id);
CREATE INDEX idx_driver_service_preferences_service_types ON public.driver_service_preferences USING GIN(service_types);

-- Contrainte pour s'assurer qu'un chauffeur n'a qu'un seul véhicule principal actif
CREATE UNIQUE INDEX idx_driver_primary_vehicle 
ON public.driver_vehicle_associations(driver_id) 
WHERE is_primary = true AND is_active = true;

-- Contrainte pour s'assurer qu'un chauffeur n'a qu'une configuration de préférences active
CREATE UNIQUE INDEX idx_driver_active_preferences 
ON public.driver_service_preferences(driver_id) 
WHERE is_active = true;

-- Activer RLS
ALTER TABLE public.driver_vehicle_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_service_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour driver_vehicle_associations
CREATE POLICY "Drivers access own vehicle associations" 
ON public.driver_vehicle_associations 
FOR ALL 
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Partners view their vehicles associations" 
ON public.driver_vehicle_associations 
FOR SELECT 
USING (auth.uid() = partner_id);

CREATE POLICY "Admins manage all vehicle associations" 
ON public.driver_vehicle_associations 
FOR ALL 
USING (is_current_user_admin());

-- Policies pour driver_service_preferences
CREATE POLICY "Drivers access own service preferences" 
ON public.driver_service_preferences 
FOR ALL 
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins view all service preferences" 
ON public.driver_service_preferences 
FOR SELECT 
USING (is_current_user_admin());

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_driver_vehicle_associations_updated_at
    BEFORE UPDATE ON public.driver_vehicle_associations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_service_preferences_updated_at
    BEFORE UPDATE ON public.driver_service_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour gérer la logique des véhicules principaux
CREATE OR REPLACE FUNCTION public.set_primary_vehicle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si on définit un véhicule comme principal, désactiver les autres
  IF NEW.is_primary = true AND NEW.is_active = true THEN
    UPDATE public.driver_vehicle_associations 
    SET is_primary = false, updated_at = now()
    WHERE driver_id = NEW.driver_id 
      AND id != NEW.id 
      AND is_primary = true 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_primary_vehicle_trigger
    BEFORE INSERT OR UPDATE ON public.driver_vehicle_associations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_primary_vehicle();