-- Mettre à jour le compte admin avec le nouvel email
UPDATE public.admins 
SET 
  email = 'support@kwendataxi.com',
  updated_at = now()
WHERE user_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335';