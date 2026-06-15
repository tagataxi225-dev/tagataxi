-- Utiliser la fonction admin pour créer l'utilisateur
SELECT 
  auth.admin_create_user(
    'support@icon-sarl.com',  -- email
    '123456',                 -- password  
    '{"display_name": "Super Administrateur"}'::jsonb, -- user_metadata
    '{"provider": "email", "providers": ["email"]}'::jsonb, -- app_metadata
    true,                     -- email_confirm
    'f15340e1-6c68-4306-b13a-e0c372b1b335'::uuid -- user_id
  ) as user_created;