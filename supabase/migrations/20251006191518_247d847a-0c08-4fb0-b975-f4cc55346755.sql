-- Activer le compte vendeur pour iouantchi@gmail.com
UPDATE public.seller_profiles
SET 
  verified_seller = true,
  updated_at = now()
WHERE user_id = 'c9ee2b59-2c9b-4bf5-833d-3473cc1aba71'::uuid;

-- Logger l'activation
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  'c9ee2b59-2c9b-4bf5-833d-3473cc1aba71'::uuid,
  'seller_activation',
  'Activation manuelle du compte vendeur - déblocage marketplace',
  jsonb_build_object(
    'email', 'iouantchi@gmail.com',
    'activated_at', now(),
    'method', 'admin_direct_activation'
  )
);