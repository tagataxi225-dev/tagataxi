-- Créer le code promo BIENVENUE30 avec created_by NULL
INSERT INTO public.promo_codes (
  code,
  title,
  description,
  discount_type,
  discount_value,
  currency,
  min_order_amount,
  user_limit,
  valid_from,
  valid_until,
  applicable_services,
  is_active,
  is_published
) VALUES (
  'BIENVENUE30',
  '30% de réduction pour les nouveaux clients',
  'Code de bienvenue valable une seule fois par utilisateur sur la première course transport',
  'percentage',
  30,
  'CDF',
  0,
  1,
  NOW(),
  '2099-12-31 23:59:59+00',
  ARRAY['transport']::text[],
  true,
  true
)
ON CONFLICT (code) DO NOTHING;