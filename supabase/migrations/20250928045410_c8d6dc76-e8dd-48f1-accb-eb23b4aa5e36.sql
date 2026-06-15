-- Phase 1b: Corrections critiques simplifiées

-- 1. Ajouter les colonnes manquantes à rental_vehicle_categories
ALTER TABLE public.rental_vehicle_categories 
ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 50000;

ALTER TABLE public.rental_vehicle_categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.rental_vehicle_categories 
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'Car';

ALTER TABLE public.rental_vehicle_categories 
ADD COLUMN IF NOT EXISTS color_class TEXT DEFAULT 'bg-blue-500';

ALTER TABLE public.rental_vehicle_categories 
ADD COLUMN IF NOT EXISTS recommended_price_range JSONB DEFAULT '{"min": 40000, "max": 80000}'::jsonb;

-- 2. Corriger les véhicules orphelins
UPDATE public.rental_vehicles 
SET partner_id = (
  SELECT id FROM public.partenaires 
  WHERE verification_status = 'approved' 
  AND is_active = true 
  LIMIT 1
)
WHERE partner_id IS NULL;