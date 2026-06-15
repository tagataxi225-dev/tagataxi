-- ============================================
-- PHASE 1 : CRÉER PLANS D'ABONNEMENT LIVREURS
-- ============================================

-- Insérer 4 nouveaux plans spécifiques aux livreurs
INSERT INTO subscription_plans (
  name,
  description,
  service_type,
  duration_type,
  price,
  currency,
  rides_included,
  max_rides_per_day,
  priority_level,
  price_per_extra_ride,
  is_trial,
  trial_duration_days,
  is_active,
  features
) VALUES
-- Plan 1 : Essai Gratuit Livraison
(
  'Essai Gratuit Livraison',
  'Testez le service de livraison gratuitement pendant 7 jours',
  'delivery',
  'weekly',
  0,
  'CDF',
  10,
  10,
  1,
  0,
  true,
  7,
  true,
  '{"type": "trial", "support": "standard", "priority": "normal"}'::jsonb
),

-- Plan 2 : Livreur Starter
(
  'Livreur Starter',
  'Pour les livreurs débutants - 20 livraisons par mois',
  'delivery',
  'monthly',
  15000,
  'CDF',
  20,
  2,
  2,
  800,
  false,
  0,
  true,
  '{"type": "starter", "support": "standard", "priority": "normal", "bonus": "5%"}'::jsonb
),

-- Plan 3 : Livreur Pro
(
  'Livreur Pro',
  'Pour les livreurs réguliers - 50 livraisons par mois',
  'delivery',
  'monthly',
  30000,
  'CDF',
  50,
  5,
  3,
  700,
  false,
  0,
  true,
  '{"type": "pro", "support": "priority", "priority": "high", "bonus": "10%"}'::jsonb
),

-- Plan 4 : Livreur Expert
(
  'Livreur Expert',
  'Pour les livreurs intensifs - 100 livraisons par mois',
  'delivery',
  'monthly',
  50000,
  'CDF',
  100,
  10,
  4,
  600,
  false,
  0,
  true,
  '{"type": "expert", "support": "vip", "priority": "urgent", "bonus": "15%"}'::jsonb
);