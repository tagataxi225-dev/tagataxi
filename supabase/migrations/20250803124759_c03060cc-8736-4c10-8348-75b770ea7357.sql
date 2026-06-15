-- Supprimer la contrainte existante et la recréer correctement
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Recréer la contrainte avec les bonnes valeurs
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('client', 'chauffeur', 'partenaire', 'admin'));