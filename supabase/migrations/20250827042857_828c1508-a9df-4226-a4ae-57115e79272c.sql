-- Phase 1: Corriger seulement ce qui peut l'être sans erreur

-- Créer la table partenaires si elle n'existe pas
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

-- Policies pour partenaires (sans permissions enum)
DROP POLICY IF EXISTS "Partners can view their own profile" ON public.partenaires;
DROP POLICY IF EXISTS "Partners can update their own profile" ON public.partenaires;
DROP POLICY IF EXISTS "Users can create partner profiles" ON public.partenaires;
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partenaires;

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

-- Policy simple pour admins (vérifier s'ils sont admin via table admins)
CREATE POLICY "Admins can view all partners" 
ON public.partenaires 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));

-- Corriger la table rental_vehicles pour avoir le bon partner_id
ALTER TABLE public.rental_vehicles 
ADD COLUMN IF NOT EXISTS partner_user_id uuid;

-- Mettre à jour les véhicules existants pour avoir le bon partner_user_id
UPDATE public.rental_vehicles 
SET partner_user_id = partner_id 
WHERE partner_user_id IS NULL;