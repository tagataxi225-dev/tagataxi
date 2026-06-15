-- Corriger la contrainte verification_level pour accepter 'verified' 
-- (valeur actuellement présente dans la base de données)

ALTER TABLE public.user_verification 
DROP CONSTRAINT IF EXISTS user_verification_verification_level_check;

ALTER TABLE public.user_verification 
ADD CONSTRAINT user_verification_verification_level_check 
CHECK (verification_level IN ('none', 'basic', 'full', 'verified'));