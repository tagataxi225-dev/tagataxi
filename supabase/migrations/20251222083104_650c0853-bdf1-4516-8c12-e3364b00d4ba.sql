-- Ajouter la colonne scratch_points à user_wallets pour le système Road to Scratch
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS scratch_points INTEGER DEFAULT 0;

-- Ajouter un index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_wallets_scratch_points ON public.user_wallets(scratch_points);