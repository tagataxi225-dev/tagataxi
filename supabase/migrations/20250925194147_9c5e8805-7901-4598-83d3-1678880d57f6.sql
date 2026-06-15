-- Ajouter uniquement les colonnes manquantes pour la gestion des codes promo
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamp with time zone;

-- Publier tous les codes existants actifs pour éviter de casser l'existant
UPDATE public.promo_codes 
SET is_published = true 
WHERE is_active = true;

-- Créer un index pour optimiser les requêtes de codes publiés
CREATE INDEX IF NOT EXISTS idx_promo_codes_published ON public.promo_codes(is_published, is_active, valid_until);