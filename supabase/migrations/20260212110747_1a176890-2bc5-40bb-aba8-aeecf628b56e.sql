ALTER TABLE public.promotional_ads ADD COLUMN placement TEXT NOT NULL DEFAULT 'home';

-- Update existing rows to 'home'
UPDATE public.promotional_ads SET placement = 'home' WHERE placement IS NULL;