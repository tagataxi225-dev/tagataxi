-- Créer l'utilisateur super admin avec une structure simplifiée
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  'authenticated',
  'authenticated',
  'support@icon-sarl.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Super Administrateur"}',
  false,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = now();

-- Créer l'identité associée dans auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  email
) VALUES (
  gen_random_uuid(),
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  '{"sub": "f15340e1-6c68-4306-b13a-e0c372b1b335", "email": "support@icon-sarl.com", "email_verified": true, "phone_verified": false}',
  'email',
  now(),
  now(),
  now(),
  'support@icon-sarl.com'
)
ON CONFLICT (provider, user_id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  email = EXCLUDED.email,
  updated_at = now();