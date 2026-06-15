-- Initialiser average_preparation_time pour les restaurants existants
UPDATE restaurant_profiles 
SET average_preparation_time = 30 
WHERE average_preparation_time IS NULL 
  AND verification_status = 'approved';