-- ==========================================
-- ACTION 1 : Lier Chauffeurs → Partenaire
-- ==========================================
-- Active le système de commission 5% pour les chauffeurs existants

-- Lier "hadou kone" (chauffeur avec abonnement actif) au partenaire "Kwenda Test Fleet"
UPDATE public.driver_codes
SET 
  partner_id = '62897f41-530b-4079-8268-f4bee2bfce15',
  updated_at = NOW()
WHERE driver_id = '6bd56fde-d3e1-4df9-a79c-670397581890'
  AND code = 'KKGNNAZY';

-- Lier le deuxième chauffeur au même partenaire
UPDATE public.driver_codes
SET 
  partner_id = '62897f41-530b-4079-8268-f4bee2bfce15',
  updated_at = NOW()
WHERE driver_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335'
  AND code = 'W54UA5ZF';

-- Vérification : afficher les codes avec partner_id
-- SELECT code, driver_id, partner_id, updated_at 
-- FROM public.driver_codes 
-- WHERE partner_id IS NOT NULL;