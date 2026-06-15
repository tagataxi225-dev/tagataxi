-- Phase 1: Créer les RLS policies manquantes pour sécuriser les données

-- Sécuriser la table profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Sécuriser les données sensibles de localisation
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Politique pour protéger les coordonnées des clients
CREATE POLICY "Clients can view their own coordinates" 
ON public.delivery_orders 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = driver_id);

-- Sécuriser escrow_payments
DROP POLICY IF EXISTS "System can manage escrow payments" ON public.escrow_payments;
CREATE POLICY "Users can view their escrow payments" 
ON public.escrow_payments 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "System can insert escrow payments" 
ON public.escrow_payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update escrow payments" 
ON public.escrow_payments 
FOR UPDATE 
USING (true);

-- Sécuriser vendor_earnings
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own earnings" 
ON public.vendor_earnings 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can manage vendor earnings" 
ON public.vendor_earnings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update vendor earnings" 
ON public.vendor_earnings 
FOR UPDATE 
USING (true);

-- Créer la table partenaires si elle n'existe pas ou la corriger
CREATE TABLE IF NOT EXISTS public.partenaires (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_email text NOT NULL,
  phone text NOT NULL,
  business_type text DEFAULT 'transport'::text,
  service_areas text[] DEFAULT ARRAY['Kinshasa'::text],
  commission_rate numeric DEFAULT 15.00,
  is_active boolean DEFAULT false,
  verification_status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  address text,
  business_license text,
  tax_number text
);

-- Activer RLS sur partenaires
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;

-- Policies pour partenaires
CREATE POLICY "Partners can view their own profile" 
ON public.partenaires 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile" 
ON public.partenaires 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create partner profiles" 
ON public.partenaires 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners" 
ON public.partenaires 
FOR SELECT 
USING (has_permission(auth.uid(), 'partners_admin'::permission));

-- Corriger la table rental_vehicles pour avoir le bon partner_id
ALTER TABLE public.rental_vehicles 
ADD COLUMN IF NOT EXISTS partner_user_id uuid;

-- Mettre à jour les véhicules existants pour avoir le bon partner_user_id
UPDATE public.rental_vehicles 
SET partner_user_id = partner_id 
WHERE partner_user_id IS NULL;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_partenaires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partenaires_updated_at
  BEFORE UPDATE ON public.partenaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partenaires_updated_at();