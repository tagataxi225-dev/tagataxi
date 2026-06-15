-- Mettre à jour les enregistrements super admin avec l'UUID correct
UPDATE public.admins 
SET user_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335'::uuid,
    email = 'support@icon-sarl.com'
WHERE email = 'superadmin@kwendataxi.com';

UPDATE public.user_roles 
SET user_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335'::uuid
WHERE user_id = (SELECT user_id FROM public.admins WHERE email = 'support@icon-sarl.com' LIMIT 1);