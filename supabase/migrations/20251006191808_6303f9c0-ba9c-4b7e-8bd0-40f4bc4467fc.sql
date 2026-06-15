-- ACTIVATION FINALE du compte vendeur iouantchi@gmail.com

-- 1. Activer user_verification
UPDATE public.user_verification
SET 
  phone_verified = true,
  identity_verified = true,
  verification_status = 'approved',
  verification_level = 'basic',
  verified_at = now(),
  updated_at = now()
WHERE user_id = 'c9ee2b59-2c9b-4bf5-833d-3473cc1aba71'::uuid;