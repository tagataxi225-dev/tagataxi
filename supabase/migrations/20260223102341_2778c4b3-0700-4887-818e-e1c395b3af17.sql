-- Ajouter la colonne city aux vendor_profiles
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Kinshasa';