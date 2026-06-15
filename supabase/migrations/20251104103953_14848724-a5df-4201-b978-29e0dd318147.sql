-- Configuration des frais de rechargement KwendaPay
-- Date: 2025-11-04

-- Vérifier et insérer la configuration pour les frais de rechargement wallet
DO $$
BEGIN
  -- Vérifier si la configuration existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM public.commission_settings 
    WHERE service_type = 'wallet_topup' AND is_active = true
  ) THEN
    -- Insérer la configuration si elle n'existe pas
    INSERT INTO public.commission_settings (
      service_type, 
      admin_rate, 
      driver_rate, 
      platform_rate, 
      is_active
    ) VALUES (
      'wallet_topup',
      1.0,  -- 1% de frais sur les recharges
      0.0,  -- Non applicable pour les recharges
      99.0, -- Reste pour l'utilisateur (non utilisé dans le calcul)
      true
    );
  ELSE
    -- Mettre à jour la configuration existante
    UPDATE public.commission_settings 
    SET admin_rate = 1.0, updated_at = NOW() 
    WHERE service_type = 'wallet_topup' AND is_active = true;
  END IF;
END $$;