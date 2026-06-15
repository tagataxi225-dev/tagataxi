-- Rendre les champs véhicule nullable dans la table chauffeurs
ALTER TABLE public.chauffeurs 
  ALTER COLUMN vehicle_make DROP NOT NULL,
  ALTER COLUMN vehicle_model DROP NOT NULL,
  ALTER COLUMN vehicle_plate DROP NOT NULL,
  ALTER COLUMN insurance_number DROP NOT NULL;

-- Ajouter un indicateur pour savoir si le chauffeur a son propre véhicule
ALTER TABLE public.chauffeurs 
  ADD COLUMN has_own_vehicle BOOLEAN DEFAULT FALSE;

-- Créer une table pour gérer les demandes d'association partenaire-chauffeur
CREATE TABLE public.partner_driver_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.chauffeurs(user_id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partenaires(user_id) ON DELETE CASCADE,
  request_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la nouvelle table
ALTER TABLE public.partner_driver_requests ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour que les chauffeurs voient leurs demandes
CREATE POLICY "Drivers can view their own requests"
ON public.partner_driver_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE user_id = auth.uid() AND user_id = partner_driver_requests.driver_id
  )
);

-- Politique RLS pour que les partenaires voient leurs demandes reçues
CREATE POLICY "Partners can view requests to them"
ON public.partner_driver_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partenaires 
    WHERE user_id = auth.uid() AND user_id = partner_driver_requests.partner_id
  )
);

-- Politique pour que les chauffeurs puissent créer des demandes
CREATE POLICY "Drivers can create requests"
ON public.partner_driver_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE user_id = auth.uid() AND user_id = partner_driver_requests.driver_id
  )
);

-- Politique pour que les partenaires puissent répondre aux demandes
CREATE POLICY "Partners can update requests to them"
ON public.partner_driver_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partenaires 
    WHERE user_id = auth.uid() AND user_id = partner_driver_requests.partner_id
  )
);

-- Politique admin pour voir toutes les demandes
CREATE POLICY "Admins can view all requests"
ON public.partner_driver_requests
FOR ALL
USING (is_current_user_admin());

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_partner_driver_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_driver_requests_updated_at
  BEFORE UPDATE ON public.partner_driver_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partner_driver_requests_updated_at();