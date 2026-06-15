
-- 1. Ajouter commission_rate à subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 12.0;

-- 2. Mettre à jour les taux de commission réduits pour chaque plan
-- Essai Gratuit Transport (20 courses) → 8%
UPDATE public.subscription_plans SET commission_rate = 8.0 WHERE id = 'fd0c07bc-2865-4706-bc0e-42108afac2f1';

-- Essai Gratuit Livraison (10 livraisons) → 8%
UPDATE public.subscription_plans SET commission_rate = 8.0 WHERE id = '2fa925e9-da55-4b15-bbba-4230c3be49dc';

-- Migration Crédits → 8%
UPDATE public.subscription_plans SET commission_rate = 8.0 WHERE id = 'c9ccdc7d-e418-4b78-adf4-6abb3d2d75da';

-- Pack 5 Courses (10,000 CDF) → 8%
UPDATE public.subscription_plans SET commission_rate = 8.0 WHERE id = 'a792a02b-db21-4eb4-90b7-6dd0b7f8831a';

-- Pack 10 Courses (20,000 CDF) → 6%
UPDATE public.subscription_plans SET commission_rate = 6.0 WHERE id = '3e720c5b-b7ba-4f80-9ec7-0f573514db7e';

-- Pack 20 Courses (35,000 CDF) → 5%
UPDATE public.subscription_plans SET commission_rate = 5.0 WHERE id = 'a0b223d4-04cb-47a4-b3b1-f3c09368795a';

-- Pack 50 Courses (80,000 CDF) → 4%
UPDATE public.subscription_plans SET commission_rate = 4.0 WHERE id = '6ac7b528-ff61-4f3a-adf7-fb94ef81a005';

-- Standard Chauffeur (25,000 CDF, 50 courses) → 5%
UPDATE public.subscription_plans SET commission_rate = 5.0 WHERE id = '0d48e858-94cc-423d-8658-3548aa014e73';

-- Plan Hebdomadaire Basic (5,000 CDF) → 8%
UPDATE public.subscription_plans SET commission_rate = 8.0 WHERE id = '64af411c-a1a7-4664-a64b-18cd0bde2bf0';

-- Plan Hebdomadaire Premium (8,000 CDF) → 6%
UPDATE public.subscription_plans SET commission_rate = 6.0 WHERE id = '71c1bc45-761f-4738-bb1c-819485a113f4';

-- Plan Mensuel Basic (18,000 CDF) → 7%
UPDATE public.subscription_plans SET commission_rate = 7.0 WHERE id = 'e556e126-5c96-4b99-842e-1644eccf9f8e';

-- Plan Mensuel Premium (28,000 CDF) → 5%
UPDATE public.subscription_plans SET commission_rate = 5.0 WHERE id = 'c3ff5575-80e0-402d-b955-156d516df898';

-- Livreur Starter (15,000 CDF, 20 livraisons) → 8%
UPDATE public.subscription_plans SET commission_rate = 8.0 WHERE id = 'e0692068-f25b-4d93-9824-7e16db174d76';

-- Livreur Pro (30,000 CDF, 50 livraisons) → 5%
UPDATE public.subscription_plans SET commission_rate = 5.0 WHERE id = 'a8234e42-a314-4908-b10d-c342a3b52aa5';

-- Livreur Expert (50,000 CDF, 100 livraisons) → 4%
UPDATE public.subscription_plans SET commission_rate = 4.0 WHERE id = 'ae1c0dd3-3365-491b-bf83-d52d3e8b3715';
